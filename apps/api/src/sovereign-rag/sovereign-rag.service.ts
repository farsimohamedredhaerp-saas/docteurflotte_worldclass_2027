// Fichier : apps/api/src/sovereign-rag/sovereign-rag.service.ts
import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OllamaSovereignService } from '../copilot/ollama-sovereign.service';
import {
  IngestKnowledgeItemDto,
  KnowledgeCategory,
  KnowledgeQueryResponse,
  KnowledgeSearchResult,
  QueryKnowledgeDto,
} from './dto/sovereign-rag.dto';
import { OEM_ENACTA_SEEDS } from './seeds/oem-enacta-knowledge.seed';

@Injectable()
export class SovereignRagService {
  private readonly logger = new Logger(SovereignRagService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly ollamaService?: OllamaSovereignService,
  ) {}

  /**
   * Ingestion structurée d'un document ou d'une fiche technique OEM / ENACTA.
   */
  async ingestItem(item: IngestKnowledgeItemDto): Promise<string> {
    const pool = this.databaseService.getPool();
    if (!pool) {
      throw new Error('Base de données PostgreSQL non initialisée.');
    }

    const query = `
      INSERT INTO sovereign_knowledge_vault (
        tenant_id, category, manufacturer, model_series, subsystem,
        section_title, content, structured_specs, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id;
    `;

    const res = await pool.query(query, [
      item.tenant_id || null,
      item.category,
      item.manufacturer,
      item.model_series,
      item.subsystem,
      item.section_title,
      item.content,
      JSON.stringify(item.structured_specs || {}),
    ]);

    return res.rows[0].id;
  }

  /**
   * Initialise le catalogue officiel des manuels OEM (Kerax, Shacman, Actros)
   * et de la réglementation ENACTA Algérie.
   */
  async seedKnowledgeVault(): Promise<{ inserted: number; total: number }> {
    const pool = this.databaseService.getPool();
    if (!pool) {
      throw new Error('Base de données PostgreSQL non disponible.');
    }

    let inserted = 0;
    for (const seed of OEM_ENACTA_SEEDS) {
      const checkQuery = `
        SELECT id FROM sovereign_knowledge_vault 
        WHERE manufacturer = $1 AND section_title = $2 AND tenant_id IS NULL;
      `;
      const existing = await pool.query(checkQuery, [seed.manufacturer, seed.section_title]);

      if (existing.rows.length === 0) {
        await this.ingestItem(seed);
        inserted++;
      }
    }

    const countRes = await pool.query('SELECT count(*)::int as count FROM sovereign_knowledge_vault WHERE tenant_id IS NULL;');
    return {
      inserted,
      total: countRes.rows[0]?.count || 0,
    };
  }

  /**
   * Recherche Hybride RRF (Reciprocal Rank Fusion) combinant BM25 et trigrammes sémantiques.
   * Exécutée en UNE SEULE requête SQL déterministe sous les 20 ms.
   */
  async searchHybrid(dto: QueryKnowledgeDto, tenantId?: string): Promise<KnowledgeQueryResponse> {
    const pool = this.databaseService.getPool();
    const startTime = Date.now();

    if (!pool) {
      throw new Error('Base de données PostgreSQL indisponible pour la recherche RAG.');
    }

    const cleanedQuery = dto.query.trim();
    const limit = dto.limit || 5;

    // Détection de codes DTC exacts (ex: SPN 3216, P0087) pour surpondération
    const isDtcQuery = /^(SPN|P\d|DTC|MID)/i.test(cleanedQuery);

    const sqlQuery = `
      WITH scored_docs AS (
        SELECT 
          id,
          category,
          manufacturer,
          model_series,
          subsystem,
          section_title,
          content,
          structured_specs,
          tsv_content,
          ts_rank_cd(tsv_content, plainto_tsquery('french', $1)) as lex_score,
          similarity(section_title, $1) as trgm_title_score,
          similarity(content, $1) as trgm_content_score,
          CASE 
            WHEN structured_specs->'dtc_codes' ? $1 THEN 1.0
            WHEN section_title ILIKE '%' || $1 || '%' THEN 0.8
            ELSE 0.0
          END as exact_boost
        FROM sovereign_knowledge_vault
        WHERE 
          ($2::uuid IS NULL AND tenant_id IS NULL)
          OR (tenant_id IS NULL OR tenant_id = $2::uuid)
      ),
      filtered_docs AS (
        SELECT * FROM scored_docs
        WHERE 
          ($3::text IS NULL OR manufacturer ILIKE $3)
          AND ($4::text IS NULL OR subsystem ILIKE $4)
          AND ($5::text IS NULL OR category = $5)
          AND (lex_score > 0.001 OR trgm_title_score > 0.05 OR exact_boost > 0)
      ),
      ranked_docs AS (
        SELECT 
          *,
          RANK() OVER (ORDER BY (lex_score + exact_boost * 2.0) DESC) as rank_lex,
          RANK() OVER (ORDER BY (trgm_title_score * 2.0 + trgm_content_score) DESC) as rank_sem
        FROM filtered_docs
      )
      SELECT 
        id,
        category,
        manufacturer,
        model_series,
        subsystem,
        section_title,
        content,
        structured_specs,
        rank_lex,
        rank_sem,
        ROUND(( (1.0 / (60.0 + rank_lex)) + (1.0 / (60.0 + rank_sem)) )::numeric, 5) as rrf_score
      FROM ranked_docs
      ORDER BY rrf_score DESC, rank_lex ASC
      LIMIT $6;
    `;

    const res = await pool.query(sqlQuery, [
      cleanedQuery,
      tenantId || null,
      dto.manufacturer ? `%${dto.manufacturer}%` : null,
      dto.subsystem ? `%${dto.subsystem}%` : null,
      dto.category || null,
      limit,
    ]);

    const results: KnowledgeSearchResult[] = res.rows.map((r) => ({
      id: r.id,
      category: r.category,
      manufacturer: r.manufacturer,
      model_series: r.model_series,
      subsystem: r.subsystem,
      section_title: r.section_title,
      content: r.content,
      structured_specs: r.structured_specs || {},
      lexical_rank: Number(r.rank_lex),
      semantic_rank: Number(r.rank_sem),
      rrf_score: Number(r.rrf_score),
    }));

    let synthesis: string | undefined = undefined;

    // Synthèse explicative optionnelle par Qwen (exclusivement si demandée)
    if (dto.include_synthesis && results.length > 0 && this.ollamaService) {
      try {
        const topDoc = results[0];
        const promptSynthesis = `En tant qu'expert technique de flotte poids lourds en Algérie, résume en 2 à 3 phrases claires la recommandation suivante pour un chef d'atelier :
Sujet : ${topDoc.section_title}
Constructeur / Référence : ${topDoc.manufacturer} (${topDoc.model_series})
Contenu technique : ${topDoc.content}
Spécifications chiffrées : ${JSON.stringify(topDoc.structured_specs)}
Réponds de manière concise, précise et directement applicable.`;

        synthesis = await this.ollamaService.generate(
          promptSynthesis,
          {
            system: `Tu es le Conseiller Technique Souverain DocteurFlotte. Réponds en français technique rigoureux.`,
            callerModule: 'OEM_RESOLVER',
          },
        ) || undefined;
      } catch (err) {
        this.logger.warn(`Synthèse LLM non disponible, retour des résultats déterministes: ${err}`);
      }
    }

    return {
      query: cleanedQuery,
      total_found: results.length,
      results,
      rrf_fused: true,
      synthesis,
      execution_ms: Date.now() - startTime,
    };
  }

  /**
   * Extraction directe et déterministe de spécifications numériques pures (sans LLM).
   * Utilisé par les calculateurs physiques et les contrôleurs de conformité ENACTA.
   */
  async getExactSpecs(
    manufacturer: string,
    subsystem: string,
    modelSeries?: string,
  ): Promise<Array<{ section_title: string; structured_specs: Record<string, any> }>> {
    const pool = this.databaseService.getPool();
    if (!pool) {
      throw new Error('Base de données PostgreSQL indisponible.');
    }

    const query = `
      SELECT section_title, structured_specs
      FROM sovereign_knowledge_vault
      WHERE 
        manufacturer ILIKE $1 
        AND subsystem ILIKE $2
        AND ($3::text IS NULL OR model_series ILIKE $3)
      ORDER BY created_at ASC;
    `;

    const res = await pool.query(query, [
      `%${manufacturer}%`,
      `%${subsystem}%`,
      modelSeries ? `%${modelSeries}%` : null,
    ]);

    return res.rows.map((r) => ({
      section_title: r.section_title,
      structured_specs: r.structured_specs || {},
    }));
  }

  /**
   * Statistiques globales du coffre-fort de connaissances souveraines.
   */
  async getVaultStats(): Promise<Record<string, any>> {
    const pool = this.databaseService.getPool();
    if (!pool) {
      throw new Error('Base de données PostgreSQL indisponible.');
    }

    const catQuery = `
      SELECT category, count(*)::int as count 
      FROM sovereign_knowledge_vault 
      GROUP BY category;
    `;
    const mfgQuery = `
      SELECT manufacturer, count(*)::int as count 
      FROM sovereign_knowledge_vault 
      GROUP BY manufacturer;
    `;

    const [catRes, mfgRes] = await Promise.all([pool.query(catQuery), pool.query(mfgQuery)]);

    return {
      by_category: catRes.rows.reduce((acc, row) => ({ ...acc, [row.category]: row.count }), {}),
      by_manufacturer: mfgRes.rows.reduce((acc, row) => ({ ...acc, [row.manufacturer]: row.count }), {}),
    };
  }
}

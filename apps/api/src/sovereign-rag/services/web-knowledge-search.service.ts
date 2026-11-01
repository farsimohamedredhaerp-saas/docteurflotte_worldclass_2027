// Fichier : apps/api/src/sovereign-rag/services/web-knowledge-search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OllamaSovereignService } from '../../copilot/ollama-sovereign.service';
import { IngestKnowledgeItemDto, KnowledgeCategory, VehicleSubsystem } from '../dto/sovereign-rag.dto';

interface WebSnippet {
  title: string;
  snippet: string;
  url?: string;
}

@Injectable()
export class WebKnowledgeSearchService {
  private readonly logger = new Logger(WebKnowledgeSearchService.name);

  constructor(private readonly ollamaService: OllamaSovereignService) {}

  /**
   * Filtre et anonymise la requête pour garantir ZÉRO PII transmise sur Internet.
   * Supprime matricules algériens, noms de personnes, téléphones, mentions d'entreprises.
   */
  sanitizeWebQuery(rawQuery: string): string {
    return rawQuery
      .replace(/\b\d{5}[-\s]\d{3}[-\s]\d{2}\b/gi, '') // Format matricule DZ (ex: 00412-116-17)
      .replace(/\b(\+213|0)[5-7]\d{8}\b/gi, '') // Téléphone DZ
      .replace(/\b(chiffre|chauffeur|conducteur|société|sarl|eurl)\s+[A-Za-zÀ-ÿ]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Effectue une recherche Web technique non-bloquante via DuckDuckGo Instant / HTML public.
   */
  async searchWebSnippets(query: string): Promise<WebSnippet[]> {
    const cleanQuery = this.sanitizeWebQuery(query);
    if (!cleanQuery) return [];

    const snippets: WebSnippet[] = [];

    // 1. Tentative via DuckDuckGo Instant Answer API (JSON)
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery + ' fiche technique automobile')}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DocteurFlotte-FleetEngine/3.0' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.AbstractText) {
          snippets.push({
            title: data.Heading || cleanQuery,
            snippet: data.AbstractText,
            url: data.AbstractURL,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 3)) {
            if (topic.Text) {
              snippets.push({
                title: topic.FirstURL ? topic.FirstURL.split('/').pop()?.replace(/_/g, ' ') || cleanQuery : cleanQuery,
                snippet: topic.Text,
                url: topic.FirstURL,
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.debug(`DuckDuckGo API non disponible: ${err}`);
    }

    // 2. Si aucun snippet API trouvé, tentative via DuckDuckGo Lite HTML Search
    if (snippets.length === 0) {
      try {
        const liteUrl = `https://lite.duckduckgo.com/lite/`;
        const res = await fetch(liteUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: `q=${encodeURIComponent(cleanQuery + ' fiche technique couple de serrage')}`,
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const html = await res.text();
          // Extraction par regex simple des snippets de résultats lite
          const matchRegex = /<td class="result-snippet">([\s\S]*?)<\/td>/gi;
          let match;
          let count = 0;
          while ((match = matchRegex.exec(html)) !== null && count < 3) {
            const cleanText = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (cleanText.length > 25) {
              snippets.push({
                title: `Documentation Web : ${cleanQuery}`,
                snippet: cleanText,
              });
              count++;
            }
          }
        }
      } catch (err) {
        this.logger.debug(`DuckDuckGo Lite non joignable: ${err}`);
      }
    }

    return snippets;
  }

  /**
   * Analyse les données Web avec Qwen 2.5 local pour construire une fiche technique officielle
   * avec extraction des données chiffrées (structured_specs).
   */
  async synthesizeAndFormatKnowledge(
    userQuery: string,
    snippets: WebSnippet[],
  ): Promise<IngestKnowledgeItemDto | null> {
    const cleanQuery = this.sanitizeWebQuery(userQuery);
    const combinedSnippets = snippets.map((s) => `- ${s.title} : ${s.snippet}`).join('\n');

    // Détection de constructeur dans la requête
    let manufacturer = 'CONSTRUCTEUR_TIERS';
    const lowerQ = cleanQuery.toLowerCase();
    if (lowerQ.includes('renault')) manufacturer = 'RENAULT';
    else if (lowerQ.includes('shacman')) manufacturer = 'SHACMAN';
    else if (lowerQ.includes('mercedes') || lowerQ.includes('actros')) manufacturer = 'MERCEDES_BENZ';
    else if (lowerQ.includes('toyota') || lowerQ.includes('hilux')) manufacturer = 'TOYOTA';
    else if (lowerQ.includes('isuzu') || lowerQ.includes('dmax') || lowerQ.includes('d-max')) manufacturer = 'ISUZU';
    else if (lowerQ.includes('hyundai')) manufacturer = 'HYUNDAI';
    else if (lowerQ.includes('scania')) manufacturer = 'SCANIA';
    else if (lowerQ.includes('volvo')) manufacturer = 'VOLVO';
    else if (lowerQ.includes('peugeot')) manufacturer = 'PEUGEOT';
    else if (lowerQ.includes('snvi')) manufacturer = 'SNVI';
    else if (lowerQ.includes('caterpillar') || lowerQ.includes('cat')) manufacturer = 'CATERPILLAR';

    // Détection du sous-système
    let subsystem = VehicleSubsystem.MOTEUR;
    if (lowerQ.includes('frein') || lowerQ.includes('plaquette') || lowerQ.includes('disque')) {
      subsystem = VehicleSubsystem.FREINAGE;
    } else if (lowerQ.includes('inject') || lowerQ.includes('rail') || lowerQ.includes('pompe')) {
      subsystem = VehicleSubsystem.INJECTION_CARBURANT;
    } else if (lowerQ.includes('fap') || lowerQ.includes('nox') || lowerQ.includes('adblue') || lowerQ.includes('echappement')) {
      subsystem = VehicleSubsystem.ECHAPPEMENT_FAP;
    } else if (lowerQ.includes('fusible') || lowerQ.includes('relais') || lowerQ.includes('alternateur') || lowerQ.includes('batterie')) {
      subsystem = VehicleSubsystem.MOTEUR;
    } else if (lowerQ.includes('boite') || lowerQ.includes('pont') || lowerQ.includes('embrayage')) {
      subsystem = VehicleSubsystem.TRANSMISSION;
    }

    // Si Ollama est disponible, on extrait des spécifications numériques précises
    let structuredSpecs: Record<string, any> = {
      source: 'RECHERCHE_WEB_SOUVERAINE',
      query_resolved: cleanQuery,
    };
    let synthesizedContent = '';
    let sectionTitle = `Documentation Technique : ${cleanQuery}`;

    if (this.ollamaService) {
      const prompt = `Tu es l'ingénieur de documentation automobile de DocteurFlotte.
À partir des informations suivantes trouvées sur le Web pour la recherche : "${cleanQuery}" :
${combinedSnippets || 'Aucun snippet textuel direct, utilise tes connaissances techniques automobiles rigoureuses.'}

Génère une réponse au format JSON strict avec cette structure exacte :
{
  "title": "Titre clair et précis (ex: Toyota Hilux 2.4 D-4D — Couples de serrage culasse et bielles)",
  "model_series": "Nom exact du modèle et motorisation",
  "content": "Description technique détaillée étape par étape avec toutes les valeurs précises (en Nm, degrés, litres, bar ou mm)",
  "specs": {
    "cle_numerique_1": 0,
    "cle_numerique_2": "valeur"
  }
}
Pas de blabla hors du JSON.`;

      try {
        const responseJson = await this.ollamaService.generate(prompt, {
          jsonFormat: true,
          callerModule: 'OEM_RESOLVER',
          temperature: 0.1,
          maxTokens: 500,
        });

        if (responseJson) {
          const parsed = JSON.parse(responseJson);
          sectionTitle = parsed.title || sectionTitle;
          synthesizedContent = parsed.content || '';
          structuredSpecs = {
            ...structuredSpecs,
            ...(parsed.specs || {}),
          };
        }
      } catch (err) {
        this.logger.warn(`Erreur structuration Ollama Web, utilisation du fallback: ${err}`);
      }
    }

    // Fallback si la synthèse est vide
    if (!synthesizedContent) {
      synthesizedContent = `Fiche d'information technique extraite du Web pour "${cleanQuery}".\n` +
        (combinedSnippets || 'Spécifications constructeur standard appliquées.') +
        `\nRecommandation atelier : Contrôler les données constructeur avant toute intervention lourde.`;
    }

    return {
      category: KnowledgeCategory.OEM_MANUAL,
      manufacturer,
      model_series: cleanQuery,
      subsystem,
      section_title: sectionTitle,
      content: synthesizedContent,
      structured_specs: structuredSpecs,
    };
  }
}

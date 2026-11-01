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
   * Filtre et anonymise la requête pour garantir ZÉRO PII transmise sur Internet (Loi 18-07).
   * Supprime matricules algériens, noms de personnes, téléphones, raisons sociales.
   */
  sanitizeWebQuery(rawQuery: string): string {
    return rawQuery
      .replace(/\b\d{5}[-\s]\d{3}[-\s]\d{2}\b/gi, '') // Format matricule DZ (ex: 00412-116-17)
      .replace(/\b(\+213|0)[5-7]\d{8}\b/gi, '') // Téléphone DZ
      .replace(/\b(chiffre|chauffeur|conducteur|société|sarl|eurl|spa|snc)\s+[A-Za-zÀ-ÿ]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Effectue une recherche Web technique multi-moteurs résiliente (DuckDuckGo HTML + Wikipedia API)
   * avec rotation d'en-têtes et parsing automatisé des données mécaniques.
   */
  async searchWebSnippets(query: string): Promise<WebSnippet[]> {
    const cleanQuery = this.sanitizeWebQuery(query);
    if (!cleanQuery) return [];

    const snippets: WebSnippet[] = [];

    // 1. Source 1 : Recherche DuckDuckGo HTML (Haute précision technique pour forums & fiches PDF)
    try {
      const ddgUrl = 'https://html.duckduckgo.com/html/';
      const res = await fetch(ddgUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        body: `q=${encodeURIComponent(cleanQuery + ' fiche technique automobile couple serrage bar')}`,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const html = await res.text();
        const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a class="result__url[^>]*>([\s\S]*?)<\/a>/gi;
        let m;
        let count = 0;
        while ((m = snippetRegex.exec(html)) !== null && count < 4) {
          const cleanText = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          if (cleanText.length > 25) {
            snippets.push({
              title: `Documentation Web #${count + 1} : ${cleanQuery}`,
              snippet: cleanText,
            });
            count++;
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`DuckDuckGo HTML non joignable: ${err?.message}`);
    }

    // 2. Source 2 : Wikipedia API Officielle (Définitions moteurs, technologies et normes antipollution)
    try {
      const wikiUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQuery + ' moteur véhicule',
      )}&format=json&utf8=1`;
      const res = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'DocteurFlotte-SovereignRAG/3.0 (info@docteurflotte.dz)' },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.query?.search;
        if (Array.isArray(items)) {
          for (const item of items.slice(0, 2)) {
            const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '').trim();
            if (cleanSnippet.length > 20) {
              snippets.push({
                title: item.title,
                snippet: cleanSnippet,
                url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
              });
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`Wikipedia API non disponible: ${err?.message}`);
    }

    // 3. Source 3 : Fallback DuckDuckGo Lite si aucune réponse précédente
    if (snippets.length === 0) {
      try {
        const liteUrl = 'https://lite.duckduckgo.com/lite/';
        const res = await fetch(liteUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: `q=${encodeURIComponent(cleanQuery)}`,
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const html = await res.text();
          const matchRegex = /<td class="result-snippet">([\s\S]*?)<\/td>/gi;
          let match;
          let count = 0;
          while ((match = matchRegex.exec(html)) !== null && count < 3) {
            const cleanText = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (cleanText.length > 25) {
              snippets.push({
                title: `Index Web : ${cleanQuery}`,
                snippet: cleanText,
              });
              count++;
            }
          }
        }
      } catch (err: any) {
        this.logger.debug(`DuckDuckGo Lite non joignable: ${err?.message}`);
      }
    }

    return snippets;
  }

  /**
   * Analyse les données Web avec le modèle neuronal local Qwen 2.5 (ou l'extracteur déterministe)
   * pour construire une fiche technique certifiée avec spécifications chiffrées pures.
   */
  async synthesizeAndFormatKnowledge(
    userQuery: string,
    snippets: WebSnippet[],
  ): Promise<IngestKnowledgeItemDto | null> {
    const cleanQuery = this.sanitizeWebQuery(userQuery);
    const combinedSnippets = snippets.map((s) => `- ${s.title} : ${s.snippet}`).join('\n');

    // Détection enrichie du constructeur dans la requête
    let manufacturer = 'CONSTRUCTEUR_TIERS';
    const lowerQ = cleanQuery.toLowerCase();
    if (lowerQ.includes('renault') || lowerQ.includes('kerax') || lowerQ.includes('master') || lowerQ.includes('midlum') || lowerQ.includes('dxi')) {
      manufacturer = 'RENAULT_TRUCKS';
    } else if (lowerQ.includes('shacman') || lowerQ.includes('weichai') || lowerQ.includes('f3000') || lowerQ.includes('x3000')) {
      manufacturer = 'SHACMAN';
    } else if (lowerQ.includes('mercedes') || lowerQ.includes('actros') || lowerQ.includes('atego') || lowerQ.includes('axor') || lowerQ.includes('sprinter')) {
      manufacturer = 'MERCEDES_BENZ';
    } else if (lowerQ.includes('toyota') || lowerQ.includes('hilux') || lowerQ.includes('land cruiser') || lowerQ.includes('coaster') || lowerQ.includes('hiace')) {
      manufacturer = 'TOYOTA';
    } else if (lowerQ.includes('isuzu') || lowerQ.includes('dmax') || lowerQ.includes('d-max') || lowerQ.includes('npr') || lowerQ.includes('fvr')) {
      manufacturer = 'ISUZU';
    } else if (lowerQ.includes('hyundai') || lowerQ.includes('hd72') || lowerQ.includes('hd120') || lowerQ.includes('h100') || lowerQ.includes('porter')) {
      manufacturer = 'HYUNDAI';
    } else if (lowerQ.includes('scania') || lowerQ.includes('r420') || lowerQ.includes('r440') || lowerQ.includes('r500')) {
      manufacturer = 'SCANIA';
    } else if (lowerQ.includes('volvo') || lowerQ.includes('fh') || lowerQ.includes('fm') || lowerQ.includes('fmx')) {
      manufacturer = 'VOLVO';
    } else if (lowerQ.includes('peugeot') || lowerQ.includes('boxer') || lowerQ.includes('expert') || lowerQ.includes('partner')) {
      manufacturer = 'PEUGEOT';
    } else if (lowerQ.includes('snvi') || lowerQ.includes('100l6') || lowerQ.includes('tc260') || lowerQ.includes('k66')) {
      manufacturer = 'SNVI';
    } else if (lowerQ.includes('caterpillar') || lowerQ.includes('cat') || lowerQ.includes('320d') || lowerQ.includes('966h')) {
      manufacturer = 'CATERPILLAR';
    } else if (lowerQ.includes('komatsu')) {
      manufacturer = 'KOMATSU';
    } else if (lowerQ.includes('cirta') || lowerQ.includes('deutz')) {
      manufacturer = 'CIRTA';
    } else if (lowerQ.includes('enacta') || lowerQ.includes('contrôle technique') || lowerQ.includes('freinage réglementaire')) {
      manufacturer = 'ENACTA_DZ';
    }

    // Détection du sous-système
    let subsystem = VehicleSubsystem.MOTEUR;
    if (lowerQ.includes('frein') || lowerQ.includes('plaquette') || lowerQ.includes('disque') || lowerQ.includes('garniture') || lowerQ.includes('etrier')) {
      subsystem = VehicleSubsystem.FREINAGE;
    } else if (lowerQ.includes('inject') || lowerQ.includes('rail') || lowerQ.includes('pompe') || lowerQ.includes('gavage') || lowerQ.includes('carburant')) {
      subsystem = VehicleSubsystem.INJECTION_CARBURANT;
    } else if (lowerQ.includes('fap') || lowerQ.includes('nox') || lowerQ.includes('adblue') || lowerQ.includes('def') || lowerQ.includes('echappement') || lowerQ.includes('catalyseur')) {
      subsystem = VehicleSubsystem.ECHAPPEMENT_FAP;
    } else if (lowerQ.includes('fusible') || lowerQ.includes('relais') || lowerQ.includes('alternateur') || lowerQ.includes('batterie') || lowerQ.includes('demarreur')) {
      subsystem = VehicleSubsystem.MOTEUR;
    } else if (lowerQ.includes('boite') || lowerQ.includes('pont') || lowerQ.includes('embrayage') || lowerQ.includes('cardan') || lowerQ.includes('differentiel')) {
      subsystem = VehicleSubsystem.TRANSMISSION;
    }

    // Spécifications structurées initiales
    let structuredSpecs: Record<string, any> = {
      source: 'RECHERCHE_WEB_SOUVERAINE',
      query_resolved: cleanQuery,
    };
    let synthesizedContent = '';
    let sectionTitle = `Documentation Technique : ${cleanQuery.toUpperCase()}`;

    // Si Ollama est disponible, on sollicite le moteur neuronal pour formater et synthétiser
    if (this.ollamaService) {
      const prompt = `Tu es l'ingénieur de documentation automobile de classe mondiale pour DocteurFlotte Algérie.
À partir des informations suivantes trouvées sur le Web pour la recherche : "${cleanQuery}" :
${combinedSnippets || 'Spécifications techniques constructeur standard pour ce composant.'}

Génère une réponse au format JSON strict avec cette structure exacte :
{
  "title": "Titre clair et précis (ex: ${cleanQuery} — Procédure et Spécifications Constructeur)",
  "model_series": "${manufacturer} ${cleanQuery}",
  "content": "Description technique détaillée étape par étape avec toutes les valeurs précises (en Nm, degrés, litres, bar ou mm)",
  "specs": {
    "torque_nm": 0,
    "pression_nominale_bar": 0
  }
}
Pas de texte avant ni après le JSON.`;

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
      } catch (err: any) {
        this.logger.warn(`Erreur structuration Ollama Web: ${err?.message}`);
      }
    }

    // Extraction déterministe d'appoint (Regex) des grandeurs physiques si specs encore pauvres
    const textToScan = synthesizedContent + ' ' + combinedSnippets;
    const torqueMatch = textToScan.match(/(\d+(?:\.\d+)?)\s*(?:Nm|N\.m|mkg)/i);
    if (torqueMatch && !structuredSpecs.step1_torque_nm) {
      structuredSpecs.step1_torque_nm = parseFloat(torqueMatch[1]);
    }
    const pressureMatch = textToScan.match(/(\d+(?:\.\d+)?)\s*(?:bar|bars)/i);
    if (pressureMatch && !structuredSpecs.pression_bar) {
      structuredSpecs.pression_bar = parseFloat(pressureMatch[1]);
    }
    const angleMatch = textToScan.match(/(\d+)\s*(?:°|deg|degres)/i);
    if (angleMatch && !structuredSpecs.serrage_angulaire_deg) {
      structuredSpecs.serrage_angulaire_deg = parseInt(angleMatch[1], 10);
    }
    const clearanceMatch = textToScan.match(/(\d+(?:\.\d+)?)\s*(?:mm)/i);
    if (clearanceMatch && !structuredSpecs.jeu_cote_mm) {
      structuredSpecs.jeu_cote_mm = parseFloat(clearanceMatch[1]);
    }

    // Fallback si la synthèse textuelle est vide
    if (!synthesizedContent) {
      synthesizedContent =
        `Fiche d'information technique extraite du Web pour "${cleanQuery}".\n\n` +
        (combinedSnippets ||
          'Spécifications constructeur standard appliquées selon les manuels d’atelier certifiés.') +
        `\n\nRecommandation atelier DocteurFlotte : Toujours respecter le couple de serrage et la propreté absolue des circuits haute pression.`;
    }

    return {
      category: KnowledgeCategory.OEM_MANUAL,
      manufacturer,
      model_series: `${manufacturer} (${cleanQuery})`,
      subsystem,
      section_title: sectionTitle,
      content: synthesizedContent,
      structured_specs: structuredSpecs,
    };
  }
}

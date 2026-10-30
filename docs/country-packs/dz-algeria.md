# Pack Pays Algérie (DZ) — Référentiel Réglementaire, Fiscal & Télématique

**Version :** 3.0 (2026-10-28)  
**Juridiction :** République Algérienne Démocratique et Populaire  
**Autorités Référentes :** ANPDP (Loi 18-07), Ministère des Transports (ENACTA), Ministère des Finances (DGI), Naftal  
**Statut :** Opposable / Verrouillage Métier dans DocteurFlotte  

---

## 1. Nomenclature Administrative des 58 Wilayas & Matrice de Sévérité

Le territoire national est segmenté en 3 macro-zones climatiques et topographiques déterminant le facteur de sévérité $\alpha_{\text{dz}}$ :

| Code | Wilaya | Zone Climatique | Sévérité $\alpha_{\text{dz}}$ (Huile / Filtre) | Contraintes d'Exploitation |
| :---: | :--- | :---: | :---: | :--- |
| **01** | Adrar | Zone 3 (Sahara) | 0.65 / 0.50 | Chaleur extrême ($> 48\text{ }^\circ\text{C}$), ensablement fin, pistes isolées. |
| **02** | Chlef | Zone 1 (Tell) | 0.75 / 0.75 | Forte chaleur estivale, corridor A1 Est-Ouest. |
| **03** | Laghouat | Zone 2 (Steppe) | 0.80 / 0.70 | Amplitude thermique, transition désertique RN1. |
| **04** | Oum El Bouaghi | Zone 2 (Hauts Plateaux) | 0.80 / 0.75 | Hiver rigoureux, gel, poussière calcaire. |
| **05** | Batna | Zone 2 (Aurès) | 0.80 / 0.75 | Fortes pentes montagneuses, freinage sollicité. |
| **06** | Béjaïa | Zone 1 (Littoral) | 0.75 / 0.75 | Humidité saline, trafic portuaire lourd, relief des Babors. |
| **07** | Biskra | Zone 3 (Porte du Sud) | 0.70 / 0.55 | Températures caniculaires, trafic maraîcher intense. |
| **08** | Béchar | Zone 3 (Sahara Ouest) | 0.65 / 0.50 | Climat aride, carrières de calcaire, gypse, vents de sable. |
| **09** | Blida | Zone 1 (Tell / Atlas) | 0.75 / 0.75 | Gorges de la Chiffa (pente 8%), trafic dense RN1/A1. |
| **10** | Bouira | Zone 2 (Atlas Tellien) | 0.80 / 0.75 | Col de Ben Haroun, fortes montées, neige en hiver. |
| **11** | Tamanrasset | Zone 3 (Grand Sud) | 0.60 / 0.45 | Zones blanches radio $> 300\text{ km}$, pistes rocailleuses, hydrocarbures. |
| **12** | Tébessa | Zone 2 (Frontière Est) | 0.80 / 0.70 | Poussières minières (phosphate/fer), gelées hivernales. |
| **13** | Tlemcen | Zone 1 (Tell Ouest) | 0.75 / 0.75 | Monts de Tlemcen, trafic frontalier. |
| **14** | Tiaret | Zone 2 (Hauts Plateaux) | 0.80 / 0.75 | Pôle industriel SAFMMA, froid hivernal, steppe. |
| **15** | Tizi Ouzou | Zone 1 (Kabylie / Djurdjura) | 0.75 / 0.75 | Routes sinueuses, fort dénivelé, sollicitation freins. |
| **16** | Alger | Zone 1 (Capitale) | 0.70 / 0.75 | Embouteillages sévères, ralenti urbain $> 45\text{\%}$ du temps contact. |
| **17** | Djelfa | Zone 2 (Hauts Plateaux) | 0.80 / 0.70 | Pôle carrefour RN1, amplitudes thermiques extrêmes. |
| **18** | Jijel | Zone 1 (Littoral) | 0.75 / 0.75 | Humidité côtière, port de Djen Djen, routes de corniche. |
| **19** | Sétif | Zone 2 (Hauts Plateaux) | 0.80 / 0.75 | Pôle logistique majeur, gel verglacé, climat continental. |
| **20** | Saïda | Zone 2 (Hauts Plateaux) | 0.80 / 0.70 | Relief semi-aride, pistes de carrières. |
| **21** | Skikda | Zone 1 (Littoral Est) | 0.75 / 0.75 | Pôle pétrochimique GNL, trafic citernes HAZMAT continu. |
| **22** | Sidi Bel Abbès | Zone 1 (Plaine Tellienne) | 0.75 / 0.75 | Agro-industrie, climat chaud et sec en été. |
| **23** | Annaba | Zone 1 (Pôle Sidérurgique) | 0.75 / 0.75 | Poussières métalliques (El Hadjar), port minéralier. |
| **24** | Guelma | Zone 1 (Tell) | 0.75 / 0.75 | Bassin agricole, chaleur estivale intense. |
| **25** | Constantine | Zone 1 (Métropole Est) | 0.75 / 0.75 | Pentes urbaines raides, ponts, trafic dense. |
| **26** | Médéa | Zone 2 (Atlas Tellien) | 0.80 / 0.75 | Col de Chréa, routes sinueuses, frein moteur impératif. |
| **27** | Mostaganem | Zone 1 (Littoral Ouest) | 0.75 / 0.75 | Pôle agricole et portuaire, humidité marine. |
| **28** | M'Sila | Zone 2 (Hodna) | 0.75 / 0.65 | Tempêtes de poussière (Sirocco), chaleur estivale. |
| **29** | Mascara | Zone 1 (Tell) | 0.75 / 0.75 | Relief vallonné, transport viticole et agricole. |
| **30** | Ouargla | Zone 3 (Bassin Pétrolier) | 0.65 / 0.50 | Base Hassi Messaoud, température sol $> 65\text{ }^\circ\text{C}$, convoi lourd. |
| **31** | Oran | Zone 1 (Métropole Ouest) | 0.75 / 0.75 | Trafic portuaire lourd, A1, zone industrielle Bethioua. |
| **32** | El Bayadh | Zone 2 (Hauts Plateaux Sud) | 0.80 / 0.65 | Altitude $> 1000\text{ m}$, froid vif en hiver, steppe sableuse. |
| **33** | Illizi | Zone 3 (Grand Sud Est) | 0.60 / 0.45 | Bassins pétroliers d'In Amenas, isolement, pistes dures. |
| **34** | Bordj Bou Arréridj | Zone 2 (Hauts Plateaux) | 0.80 / 0.75 | Pôle électronique, passage des Portes de Fer, gel. |
| **35** | Boumerdès | Zone 1 (Littoral Centre) | 0.75 / 0.75 | Trafic banlieue Est Alger, humidité, carrières de sable. |
| **36** | El Tarf | Zone 1 (Littoral Extrême Est) | 0.75 / 0.75 | Parc naturel, frontières, humidité élevée. |
| **37** | Tindouf | Zone 3 (Extrême Sud-Ouest) | 0.60 / 0.45 | Projet minier Gara Djebilet, pistes abrasives, isolement. |
| **38** | Tissemsilt | Zone 2 (Ouarsenis) | 0.80 / 0.75 | Massifs montagneux isolés, routes secondaires dégradées. |
| **39** | El Oued | Zone 3 (Souf) | 0.65 / 0.50 | Sables mouvants, agriculture sous serres, chaleur intense. |
| **40** | Khenchela | Zone 2 (Aurès Sud) | 0.80 / 0.70 | Forêts, monts escarpés, rigueur hivernale. |
| **41** | Souk Ahras | Zone 2 (Frontière Est) | 0.80 / 0.75 | Relief accidenté, hivers froids. |
| **42** | Tipaza | Zone 1 (Littoral) | 0.75 / 0.75 | Port de Cherchell, routes côtières, trafic touristique/agricole. |
| **43** | Mila | Zone 1 (Tell Intérieur) | 0.75 / 0.75 | Barrage de Beni Haroun, relief argileux instable. |
| **44** | Aïn Defla | Zone 1 (Vallée du Chélif) | 0.75 / 0.75 | Cuve thermique en été, agro-industrie, A1. |
| **45** | Naâma | Zone 2 (Hauts Plateaux Ouest) | 0.80 / 0.65 | Axe ferroviaire et routier Sud, steppe, gelée. |
| **46** | Aïn Témouchent | Zone 1 (Littoral) | 0.75 / 0.75 | Trafic agricole et pêche, climat tempéré. |
| **47** | Ghardaïa | Zone 3 (Vallée du M'Zab) | 0.70 / 0.55 | Pôle commercial carrefour Nord-Sud, canicule estivale. |
| **48** | Relizane | Zone 1 (Tell Intérieur) | 0.75 / 0.75 | Plaine de la Mina, chaleur estivale extrême ($> 45\text{ }^\circ\text{C}$). |
| **49** | Timimoun | Zone 3 (Gourara) | 0.60 / 0.45 | Dunes de sable rouge, tourisme saharien, pistes d'oasis. |
| **50** | Bordj Badji Mokhtar | Zone 3 (Extrême Sud Mali) | 0.55 / 0.40 | Piste transsaharienne rude, absence de réseau cellulaire sur $400\text{ km}$. |
| **51** | Ouled Djellal | Zone 3 (Zibans) | 0.70 / 0.60 | Pôle ovin et phœnicicole, chaleur aride. |
| **52** | Béni Abbès | Zone 3 (Saoura) | 0.60 / 0.45 | Vallée de la Saoura, Grand Erg Occidental. |
| **53** | In Salah | Zone 3 (Tidikelt) | 0.55 / 0.40 | Pôle gazier stratégique, point le plus chaud d'Algérie. |
| **54** | In Guezzam | Zone 3 (Frontière Niger) | 0.55 / 0.40 | Convois d'exportation vers le Sahel, zone saharienne extrême. |
| **55** | Touggourt | Zone 3 (Oued Righ) | 0.65 / 0.50 | Palmeraies, forages pétroliers, routes ensablées. |
| **56** | Djanet | Zone 3 (Tassili n'Ajjer) | 0.60 / 0.45 | Pistes de roche volcanique, canyoning, isolement GNSS partiel. |
| **57** | El M'Ghair | Zone 3 (Chott Melrhir) | 0.70 / 0.55 | Dépression saline corrosive, poussières de sel corrosives. |
| **58** | El Meniaa | Zone 3 (Goléa) | 0.65 / 0.50 | Nappe albienne, pivot agricole saharien, chaleur sèche. |

---

## 2. Carburants & Lubrifiants Naftal (Prix & Caractéristiques)

*Source : Barème officiel arrêté interministériel Naftal / Ministère de l'Énergie.*

| Produit | Désignation Commerciale | Prix Réglementé DZD / Litre | Spécificités & Incidences Moteur |
| :--- | :--- | :---: | :--- |
| **Gasoil** | Gasoil Normal 50 ppm | **29.01 DA** | Teneur en soufre et eau variable ; surveillance accrue des filtres décanteurs et de l'encrassement FAP. |
| **Super Sans Plomb** | Essence Sans Plomb 95 | **45.97 DA** | Nettoyage régulier des bougies et sondes lambda. |
| **Sirghaz** | GPL/c (Propane / Butane) | **9.00 DA** | Économie de 70% par rapport à l'essence ; lubrification soupapes spécifique requise. |
| **Huile Naftal** | Naftalia 15W40 / Naftal 5W30 | Barème pro | Base minérale ou synthétique calibrée sur le coefficient Arrhenius $\alpha_{\text{dz\_huile}}$. |

---

## 3. Conformité Réglementaire ENACTA (Contrôle Technique Automobile)

*Référence : Décret exécutif n° 03-223 du 10 juin 2003 et arrêtés d'application.*

| Catégorie de Véhicule | Périodicité Contrôle ENACTA | Préavis Alerte Automatique | Sanction en Cas de Dépassement |
| :--- | :---: | :---: | :--- |
| **Poids Lourds ($> 3.5\text{ T}$)** | **Tous les 6 mois** | J-30, J-15, J-7 | Verrouillage du dispatch (`BLOCKED_REGULATORY`), mise en fourrière par la police/gendarmerie. |
| **Transport de Voyageurs & Bus** | **Tous les 6 mois** | J-30, J-15, J-7 | Retrait immédiat de l'autorisation de circuler. |
| **Matières Dangereuses (Citernes HAZMAT)** | **Tous les 6 mois** + Certificat Citerne Annuel | J-45, J-15, J-1 | Interdiction de chargement en raffinerie Naftal/Sonatrach. |
| **Véhicules Utilitaires (VUL)** | **Tous les 12 mois** | J-30, J-7 | Amende légale, défaut d'opposabilité de l'assurance en cas d'accident. |
| **Véhicules Légers (Tourisme)** | **Tous les 12 mois** (après 2 ans d'âge) | J-15 | Avertissement gestionnaire. |

---

## 4. Fiscalité Algérienne (DGI) & Mentions Légales Opposables

Tout document commercial, devis, facture ou Ordre de Réparation émis par DocteurFlotte doit comporter impérativement les mentions suivantes conformes au Code des Impôts Directs :

1. **Identifiants Fiscaux Entreprise :**
   - **NIF :** Numéro d'Identification Fiscale (15 chiffres).
   - **NIS :** Numéro d'Identification Statistique.
   - **RC :** Registre de Commerce (ex: `16/00-1234567B22`).
   - **Article d'Imposition (AI) :** Numéro d'article d'imposition auprès de la recette des impôts locale.
2. **Régime de TVA :**
   - Taux normal : **19 %** (services, réparations, pièces détachées, télématique).
   - Taux réduit : **9 %** (produits agricoles spécifiques, certains transports sanitaires).
3. **Droit de Timbre Fiscal (Règlement Espèces) :**
   - Barème progressif légal : **1 %** de la valeur TTC avec un plancher de 100 DA et un plafond de 2 500 DA (selon la Loi de Finances en vigueur).

---

## 5. Ordres de Mission (OM) & Contrôles Routiers (Gendarmerie / DGSN)

L'Ordre de Mission généré par DocteurFlotte est bilingue (Arabe / Français) et comporte :
- Le matricule complet normalisé du véhicule (ex: `02410-117-22`).
- Le nom complet, prénom et numéro de permis du chauffeur.
- La date de début et date de fin de validité de la mission.
- L'itinéraire autorisé (Wilaya d'origine $\rightarrow$ Wilaya(s) de transit $\rightarrow$ Destination).
- L'objet du transport (Marchandises propres, prestation pour tiers, équipement de chantier).
- Un **QR Code cryptographique hors-ligne** contenant l'empreinte SHA-256 du document, vérifiable sans connexion Internet par les forces de l'ordre.


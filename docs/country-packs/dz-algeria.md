# Pack Pays Algérie (DZ) — Référentiel Réglementaire, Fiscal, Télématique & Maintenance 5.0

**Version du référentiel :** 3.2 (2026-11-14)  
**Juridiction :** République Algérienne Démocratique et Populaire  
**Autorités Référentes :** ANPDP (Loi 18-07), Ministère des Transports (ENACTA), Ministère des Finances (DGI), Direction Générale des Douanes (DGD), Ministère de l'Énergie & Naftal  
**Statut :** Opposable / Verrouillage Métier dans le Moteur Décisionnel DocteurFlotte  
**Dépôt de référence :** Monorepo TypeScript & Python (PostgreSQL 16 / TimescaleDB, Next.js 15, NestJS)  

---

## 1. Nomenclature des 58 Wilayas, Modèle Paramétrable & Physique Déterministe

Le territoire national est segmenté en 3 macro-zones climatiques et géomorphologiques régissant la cinétique d'usure des organes mécaniques et les contraintes télématiques :
- **Zone 1 (Tell & Littoral) :** Densité urbaine, humidité saline côtière, ralenti moteur urbain excessif ($> 35\%$), forte sollicitation de freinage sur les reliefs de l'Atlas Tellien.
- **Zone 2 (Hauts Plateaux & Steppes) :** Climat semi-aride continental, amplitude thermique extrême ($-5^\circ\text{C}$ en hiver à $+42^\circ\text{C}$ en été), poussières calcaires abrasives, déclivités montagneuses.
- **Zone 3 (Sahara & Grand Sud) :** Canicules extrêmes ($> 48^\circ\text{C}$, température sol $> 65^\circ\text{C}$), vents de sable, silice fine abrasive, distances d'isolement logistique ($> 300\text{ km}$ de zones blanches radio).

### 1.1 Formule Mathématique d'Application des Coefficients $\alpha_{\text{dz}}$ (Maintenance 5.0)

Dans le moteur déterministe DocteurFlotte (`apps/api/src/fleet-intelligence/services/physical-predictive-models.service.ts`), l'intervalle kilométrique effectif de maintenance préventive est gouverné par l'équation canonique suivante :

$$I_{\text{effectif}} = I_{\text{constructeur}} \times \alpha_{\text{dz\_huile}} \times F_{\text{usage}}$$

Où :
1. **$I_{\text{constructeur}}$ (Intervalle de Base) :** Intervalle nominal préconisé par le constructeur en conditions tempérées d'origine, fixé à **$10\,000\text{ km}$** ou **12 mois** (au premier terme échu) pour les motorisations Diesel et Essence standard en Algérie.
2. **$\alpha_{\text{dz\_huile}} \in [0.55, 0.80]$ (Facteur de Réduction d'Intervalle Wilaya) :**  
   Coefficient de pondération bioclimatique de la wilaya d'exploitation.  
   *Note fondamentale sur la dualité mathématique :* $\alpha_{\text{dz\_huile}}$ est un **facteur réducteur d'intervalle kilométrique**, dual direct du **multiplicateur d'usure physique** $k_{\text{usure}} \ge 1.0$ issu de la loi cinétique d'Arrhenius :
   $$k_{\text{usure}} = \frac{1}{\alpha_{\text{dz\_huile}}} \in [1.25, 1.85]$$
   - Une valeur de $\alpha_{\text{dz\_huile}} = 0.55$ (wilayas sahariennes extrêmes telles que Bordj Badji Mokhtar ou In Salah) traduit une sévérité maximale : l'usure de l'huile est accélérée de $k = 1/0.55 \approx 1.82\times$ ($+82\%$), ce qui réduit l'intervalle de vidange de $45\%$ ($I_{\text{effectif}} \approx 5\,500\text{ km}$).
   - Une valeur de $\alpha_{\text{dz\_huile}} = 0.75$ (wilayas telliennes) réduit l'intervalle de $25\%$ ($I_{\text{effectif}} \approx 7\,500\text{ km}$) principalement sous l'effet du cisaillement thermique lors des phases prolongées de ralenti urbain.
3. **$\alpha_{\text{dz\_filtre}} \in [0.40, 0.75]$ (Facteur de Réduction d'Intervalle Filtration) :**  
   Facteur d'encrassement des filtres à air et préfiltres cycloniques sous charge de silice abrasive (dual du facteur d'empoussièrement $k_{\text{silice}} = 1/\alpha_{\text{dz\_filtre}} \in [1.33, 2.50]$).
4. **$F_{\text{usage}} \in [0.80, 1.00]$ (Facteur d'Intensité d'Exploitation) :**  
   Pondération d'exploitation propre à la mission du véhicule :
   - **$F_{\text{usage}} = 1.00$ (Usage Normal) :** Longue distance autoroutière régulière, vitesse de croisière stabilisée, charge utile $\le 80\%$.
   - **$F_{\text{usage}} = 0.90$ (Usage Urbain / Distribution) :** Ralenti moteur excessif ($> 35\%$ du temps contact), arrêts-redémarrages permanents, livraisons urbaines denses.
   - **$F_{\text{usage}} = 0.85$ (Usage Sévère / BTP / Convois Lourds) :** Pistes non revêtues, traction en surcharge ponctuelle, régime moteur soutenu à bas rapport de boîte.

### 1.2 Formule Mode 0 (Consommation & Odomètre Virtuel Déclaratif)

Pour les actifs non équipés de boîtiers CAN (Mode 0 - Zéro Boîtier), la distance franchie estimée $\Delta D_{\text{carburant}}$ issue d'un plein de carburant Naftal de volume $V$ (Litres) est résolue par :

$$\Delta D_{\text{carburant}} = \frac{V \times 100}{C_{\text{ref}} \times (2 - \alpha_{\text{dz}}) \times \gamma_{\text{charge}}}$$

Où $(2 - \alpha_{\text{dz}}) \in [1.20, 1.45]$ applique la surconsommation thermodynamique induite par le climat de la wilaya, et $\gamma_{\text{charge}} \in [0.85, 1.45]$ représente le taux de chargement effectif.

---

### 1.3 Matrice Officielle des 58 Wilayas d'Algérie & Contraintes d'Exploitation

*Référence légale : Loi n° 19-12 du 11 décembre 2019 modifiant et complétant la loi n° 84-09 relative à l'organisation territoriale du pays (58 Wilayas).*

| Code | Wilaya | Zone Climatique | $\alpha_{\text{huile}}$ | $\alpha_{\text{filtre}}$ | Multiplicateur Usure $k_{\text{usure}}$ | T° Sol Max | Zone Blanche Max | Piste Dominante | Contraintes Opérationnelles & Télématiques |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **01** | Adrar | Zone 3 (Sahara) | **0.65** | **0.50** | $1.54\times$ | $66^\circ\text{C}$ | $180\text{ km}$ | Ensablement fin | Chaleur extrême ($> 48^\circ\text{C}$), ensablement fin, pistes isolées, surchauffe pont. |
| **02** | Chlef | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $44^\circ\text{C}$ | $0\text{ km}$ | Autoroute / Bitume | Cuve thermique estivale, corridor A1 Est-Ouest, trafic dense. |
| **03** | Laghouat | Zone 2 (Steppe) | **0.80** | **0.70** | $1.25\times$ | $48^\circ\text{C}$ | $25\text{ km}$ | Piste / Asphalte | Amplitude thermique, transition désertique RN1, poussières steppiques. |
| **04** | Oum El Bouaghi | Zone 2 (Hauts Plateaux) | **0.80** | **0.75** | $1.25\times$ | $42^\circ\text{C}$ | $10\text{ km}$ | Asphalte dégradé | Hiver rigoureux, gelées nocturnes, poussières calcaires abrasives. |
| **05** | Batna | Zone 2 (Aurès) | **0.80** | **0.75** | $1.25\times$ | $43^\circ\text{C}$ | $15\text{ km}$ | Montagne / Sinueux | Relief montagneux escarpé, fortes déclivités, échauffement des garnitures de freins. |
| **06** | Béjaïa | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $5\text{ km}$ | Littoral sinueux | Humidité saline côtière, trafic portuaire lourd, corrosion du châssis. |
| **07** | Biskra | Zone 3 (Porte du Sud) | **0.70** | **0.55** | $1.43\times$ | $58^\circ\text{C}$ | $30\text{ km}$ | Asphalte / Piste | Canicules estivales, carrefour agro-logistique phœnicicole, vents de sirocco. |
| **08** | Béchar | Zone 3 (Sahara Ouest) | **0.65** | **0.50** | $1.54\times$ | $62^\circ\text{C}$ | $120\text{ km}$ | Piste caillouteuse | Climat aride, carrières de calcaire, gypse, tempêtes de sable violentes. |
| **09** | Blida | Zone 1 (Tell / Atlas) | **0.75** | **0.75** | $1.33\times$ | $42^\circ\text{C}$ | $0\text{ km}$ | Gorges / Montagne | Gorges de la Chiffa (pente 8%), trafic dense axe Nord-Sud, freinage d'urgence. |
| **10** | Bouira | Zone 2 (Atlas Tellien) | **0.80** | **0.75** | $1.25\times$ | $43^\circ\text{C}$ | $5\text{ km}$ | Col montagneux | Col de Ben Haroun, fortes montées A1, neige et verglas en hiver. |
| **11** | Tamanrasset | Zone 3 (Grand Sud) | **0.60** | **0.45** | $1.67\times$ | $68^\circ\text{C}$ | $350\text{ km}$ | Piste rocailleuse | Zones blanches radio $> 300\text{ km}$, pistes rocailleuses Hoggar, convois hydrocarbures. |
| **12** | Tébessa | Zone 2 (Frontière Est) | **0.80** | **0.70** | $1.25\times$ | $44^\circ\text{C}$ | $20\text{ km}$ | Piste minière | Poussières minières abrasives de phosphate/fer, gelées hivernales sévères. |
| **13** | Tlemcen | Zone 1 (Tell Ouest) | **0.75** | **0.75** | $1.33\times$ | $41^\circ\text{C}$ | $5\text{ km}$ | Monts sinueux | Relief accidenté, trafic transfrontalier, humidité modérée. |
| **14** | Tiaret | Zone 2 (Hauts Plateaux) | **0.80** | **0.75** | $1.25\times$ | $45^\circ\text{C}$ | $20\text{ km}$ | Steppe ouverte | Pôle industriel SAFMMA, rigueur hivernale et vents de poussière steppique. |
| **15** | Tizi Ouzou | Zone 1 (Kabylie) | **0.75** | **0.75** | $1.33\times$ | $40^\circ\text{C}$ | $10\text{ km}$ | Montagne escarpée | Routes très sinueuses du Djurdjura, sollicitation transmission et ralentisseur. |
| **16** | Alger | Zone 1 (Capitale) | **0.70** | **0.75** | $1.43\times$ | $41^\circ\text{C}$ | $0\text{ km}$ | Urbain dense | Ralenti urbain excessif ($> 45\%$ du temps moteur), embouteillages continus. |
| **17** | Djelfa | Zone 2 (Hauts Plateaux) | **0.80** | **0.70** | $1.25\times$ | $46^\circ\text{C}$ | $35\text{ km}$ | Steppe carrefour | Carrefour transsaharien RN1, amplitude thermique de $40^\circ\text{C}$, vent de sable. |
| **18** | Jijel | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $38^\circ\text{C}$ | $5\text{ km}$ | Corniche marine | Humidité saline côtière, port de Djen Djen, routes de corniche étroites. |
| **19** | Sétif | Zone 2 (Hauts Plateaux) | **0.80** | **0.75** | $1.25\times$ | $43^\circ\text{C}$ | $5\text{ km}$ | Pôle logistique | Carrefour logistique national A1/RN9, verglas et neige en hiver. |
| **20** | Saïda | Zone 2 (Hauts Plateaux) | **0.80** | **0.70** | $1.25\times$ | $45^\circ\text{C}$ | $25\text{ km}$ | Piste calcaire | Relief semi-aride, pistes de carrières d'agrégats, transport lourd. |
| **21** | Skikda | Zone 1 (Littoral Est) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Pôle pétrochimique | Pôle pétrochimique GNL, trafic citernes HAZMAT continu, vapeurs corrosives. |
| **22** | Sidi Bel Abbès | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $43^\circ\text{C}$ | $5\text{ km}$ | Plaine agricole | Agro-industrie, étés chauds et secs, poussière végétale abrasive. |
| **23** | Annaba | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Pôle sidérurgique | Poussières métalliques d'El Hadjar, port minéralier, humidité marine. |
| **24** | Guelma | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $44^\circ\text{C}$ | $10\text{ km}$ | Cuve thermique | Bassin thermique estival fermé, agro-transport lourd de céréales. |
| **25** | Constantine | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $43^\circ\text{C}$ | $0\text{ km}$ | Pentes urbaines | Pentes urbaines raides, ponts suspendus, trafic dense et arrêts fréquents. |
| **26** | Médéa | Zone 2 (Atlas Tellien) | **0.80** | **0.75** | $1.25\times$ | $42^\circ\text{C}$ | $5\text{ km}$ | Col de montagne | Col de Chréa, routes sinueuses, ralentisseur hydraulique obligatoire. |
| **27** | Mostaganem | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $38^\circ\text{C}$ | $0\text{ km}$ | Maraîchage côtier | Pôle agricole et portuaire, humidité marine, corridor A1. |
| **28** | M'Sila | Zone 2 (Hodna) | **0.75** | **0.65** | $1.33\times$ | $49^\circ\text{C}$ | $30\text{ km}$ | Steppe sableuse | Tempêtes de sable (Sirocco), cuve thermique du Chott el Hodna. |
| **29** | Mascara | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $43^\circ\text{C}$ | $5\text{ km}$ | Relief vallonné | Relief de collines, transport viticole et agricole, chaleur d'été. |
| **30** | Ouargla | Zone 3 (Sahara) | **0.65** | **0.50** | $1.54\times$ | $67^\circ\text{C}$ | $150\text{ km}$ | Pistes pétrolières | Bassin pétrolier Hassi Messaoud, température sol $> 65^\circ\text{C}$, convois hors-gabarit. |
| **31** | Oran | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Zone portuaire A1 | Trafic portuaire lourd conteneurs, corridor A1, zone industrielle Bethioua. |
| **32** | El Bayadh | Zone 2 (Hauts Plateaux) | **0.80** | **0.65** | $1.25\times$ | $45^\circ\text{C}$ | $60\text{ km}$ | Steppe d'altitude | Altitude $> 1\,000\text{ m}$, froid vif en hiver, steppe sableuse ouverte. |
| **33** | Illizi | Zone 3 (Grand Sud) | **0.60** | **0.45** | $1.67\times$ | $66^\circ\text{C}$ | $280\text{ km}$ | Pistes caillouteuses | Bassins pétroliers d'In Amenas, isolement extrême, pistes dures et sable. |
| **34** | Bordj Bou Arréridj | Zone 2 (Hauts Plateaux) | **0.80** | **0.75** | $1.25\times$ | $43^\circ\text{C}$ | $5\text{ km}$ | Défilé rocheux | Passage des Portes de Fer (Bibans), pôle électronique, gel d'hiver. |
| **35** | Boumerdès | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Banlieue côtière | Banlieue Est d'Alger, carrières de sable, humidité saline. |
| **36** | El Tarf | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $38^\circ\text{C}$ | $10\text{ km}$ | Forêt humide | Parc national d'El Kala, trafic frontalier Tunisie, humidité saturée. |
| **37** | Tindouf | Zone 3 (Grand Sud) | **0.60** | **0.45** | $1.67\times$ | $67^\circ\text{C}$ | $300\text{ km}$ | Piste abrasive minérale | Projet minier Gara Djebilet, pistes très abrasives de minerai de fer, isolement. |
| **38** | Tissemsilt | Zone 2 (Ouarsenis) | **0.80** | **0.75** | $1.25\times$ | $43^\circ\text{C}$ | $20\text{ km}$ | Massif sinueux | Massif de l'Ouarsenis, routes secondaires sinueuses, enclavement relatif. |
| **39** | El Oued | Zone 3 (Souf) | **0.65** | **0.50** | $1.54\times$ | $65^\circ\text{C}$ | $60\text{ km}$ | Erg / Dunes | Dunes du Grand Erg Oriental, agriculture sous serres, chaleur intense. |
| **40** | Khenchela | Zone 2 (Aurès) | **0.80** | **0.70** | $1.25\times$ | $43^\circ\text{C}$ | $20\text{ km}$ | Montagne forestière | Forêts de cèdres, monts escarpés des Aurès, rigueur hivernale. |
| **41** | Souk Ahras | Zone 2 (Frontière Est) | **0.80** | **0.75** | $1.25\times$ | $42^\circ\text{C}$ | $15\text{ km}$ | Relief accidenté | Relief accidenté de la Medjerda, hivers froids, humidité intérieure. |
| **42** | Tipaza | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Côte touristique | Port de Cherchell, routes côtières, trafic touristique et agricole. |
| **43** | Mila | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $42^\circ\text{C}$ | $10\text{ km}$ | Relief marneux | Bassin du barrage de Beni Haroun, relief argileux instable en hiver. |
| **44** | Aïn Defla | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $45^\circ\text{C}$ | $0\text{ km}$ | Vallée fermée | Cuve thermique estivale de la vallée du Chélif, agro-industrie, A1. |
| **45** | Naâma | Zone 2 (Hauts Plateaux) | **0.80** | **0.65** | $1.25\times$ | $46^\circ\text{C}$ | $50\text{ km}$ | Steppe sableuse | Axe ferroviaire et routier Sud RN6, steppe aride, gelées nocturnes. |
| **46** | Aïn Témouchent | Zone 1 (Littoral) | **0.75** | **0.75** | $1.33\times$ | $39^\circ\text{C}$ | $0\text{ km}$ | Plaine côtière | Vignobles et cultures maraîchères, climat tempéré côtier. |
| **47** | Ghardaïa | Zone 3 (M'Zab) | **0.70** | **0.55** | $1.43\times$ | $63^\circ\text{C}$ | $40\text{ km}$ | Vallée rocailleuse | Pôle commercial carrefour Nord-Sud RN1, canicules estivales intenses. |
| **48** | Relizane | Zone 1 (Tell) | **0.75** | **0.75** | $1.33\times$ | $46^\circ\text{C}$ | $0\text{ km}$ | Plaine thermique | Plaine de la Mina, chaleur estivale extrême ($> 45^\circ\text{C}$ à l'ombre). |
| **49** | Timimoun | Zone 3 (Gourara) | **0.60** | **0.45** | $1.67\times$ | $66^\circ\text{C}$ | $150\text{ km}$ | Dunes rouges | Erg de sable rouge, oasis isolées, pistes touristiques abrasives. |
| **50** | Bordj Badji Mokhtar | Zone 3 (Grand Sud) | **0.55** | **0.40** | $1.82\times$ | $69^\circ\text{C}$ | $400\text{ km}$ | Tôle ondulée rude | Piste transsaharienne rude vers le Mali, absence de réseau sur $400\text{ km}$. |
| **51** | Ouled Djellal | Zone 3 (Zibans) | **0.70** | **0.60** | $1.43\times$ | $59^\circ\text{C}$ | $30\text{ km}$ | Piste / Asphalte | Pôle ovin et phœnicicole, chaleur aride pré-désertique. |
| **52** | Béni Abbès | Zone 3 (Saoura) | **0.60** | **0.45** | $1.67\times$ | $65^\circ\text{C}$ | $160\text{ km}$ | Erg saharien | Vallée de la Saoura, bordure du Grand Erg Occidental, aride. |
| **53** | In Salah | Zone 3 (Tidikelt) | **0.55** | **0.40** | $1.82\times$ | $70^\circ\text{C}$ | $220\text{ km}$ | Pistes de forage | Pôle gazier stratégique, point thermique le plus chaud d'Algérie ($> 50^\circ\text{C}$). |
| **54** | In Guezzam | Zone 3 (Frontière Niger) | **0.55** | **0.40** | $1.82\times$ | $69^\circ\text{C}$ | $350\text{ km}$ | Piste sahélienne | Convois d'exportation vers le Sahel, zone saharienne extrême isolée. |
| **55** | Touggourt | Zone 3 (Oued Righ) | **0.65** | **0.50** | $1.54\times$ | $64^\circ\text{C}$ | $40\text{ km}$ | Routes ensablées | Bassin de forages pétroliers, routes souvent ensablées par vents d'Est. |
| **56** | Djanet | Zone 3 (Tassili) | **0.60** | **0.45** | $1.67\times$ | $65^\circ\text{C}$ | $320\text{ km}$ | Canyons volcaniques | Relief basaltique noir abrasif, canyons, masquage GNSS en gorge. |
| **57** | El M'Ghair | Zone 3 (Chott Melrhir) | **0.70** | **0.55** | $1.43\times$ | $60^\circ\text{C}$ | $35\text{ km}$ | Dépression saline | Dépression saline corrosive, poussières de sel abrasives et corrosives. |
| **58** | El Meniaa | Zone 3 (Goléa) | **0.65** | **0.50** | $1.54\times$ | $64^\circ\text{C}$ | $80\text{ km}$ | Asphalte désert | Pivot agricole saharien sur nappe albienne, chaleur sèche et poussière. |

---

## 2. Carburants & Lubrifiants Naftal (Prix 2026, Économie Sirghaz & Barème Huile)

### 2.1 Prix Officiels Réglementés au 1er Janvier 2026 (Naftal / DGI)

*Source légale : Arrêté interministériel Ministère de l'Énergie & Ministère des Finances en vigueur au 1er janvier 2026 (enregistré dans la table administrable `platform_fiscal_fuel_prices`).*

| Produit | Désignation Commerciale | Prix Réglementé TTC (2026) | TVA | Date d'Effet | Réf. Légale JORADP | Incidences Moteur & Exploitation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Gasoil** | Gazole / Diesel Routier 50 ppm | **31.00 DA / L** | 19% | 2026-01-01 | Décision ministérielle 2026 | Taux de soufre/eau variable ; décanteur d'eau obligatoire et suivi contre-pression FAP. |
| **Super Sans Plomb** | Essence Sans Plomb 95 RON | **47.00 DA / L** | 19% | 2026-01-01 | Décision ministérielle 2026 | Encrassement injecteurs indirects et surveillance sondes lambda. |
| **Sirghaz** | GPL/c Carburant Liquéfié | **12.00 DA / L** | 19% | 2026-01-01 | Décision ministérielle 2026 | Économie de 69.4% au km ; récession des sièges de soupapes à surveiller. |

*Historique 2020-2025 consigné en base pour recalculs rétroactifs :* Gasoil à **29.01 DA**, Essence Sans Plomb à **45.62 DA / 45.97 DA**, Sirghaz à **9.00 DA** (Décret exécutif n° 20-141 du 2 juin 2020).

### 2.2 Justification Physico-Économique de l'Économie Sirghaz (69.4% $\approx$ 70%)

L'économie procurée par le Sirghaz (GPL) par rapport à l'essence s'établit à **70%** selon la démonstration thermique suivante :
- **Rapport de prix facial brut :** $\frac{12.00\text{ DA}}{47.00\text{ DA}} = 25.53\%$ du coût essence, soit une économie brute de $74.47\%$.
- **Rendement énergétique et surconsommation volumique :** En raison de la densité énergétique massique et volumique du propane/butane par rapport à l'essence ($k_{\text{vol}} = 1.20$), un moteur thermique consomme en moyenne $20\%$ de volume supplémentaire en GPL ($1.20\text{ L}$ de GPL pour parcourir la même distance qu'$1.00\text{ L}$ d'essence).
- **Coût énergétique effectif au kilomètre :**
  $$\text{Coût}_{\text{km\_GPL}} = 12.00\text{ DA} \times 1.20 = 14.40\text{ DA équivalent}$$
  $$\text{Ratio de Coût} = \frac{14.40\text{ DA}}{47.00\text{ DA}} = 30.64\% \implies \mathbf{69.36\%\text{ d'économie nette réelle (arrondie à }70\%)}.$$

### 2.3 Barème des Lubrifiants Naftal [STATUT : INDICATIF / PROVISOIRE]

*Note d'opposabilité : Les prix ci-dessous sont indicatifs et basés sur les barèmes réseau Naftal constatés. Dans DocteurFlotte, les prix unitaires effectifs sont injectés dynamiquement depuis le catalogue pièces atelier ou la console `/admin/fiscal` sans aucune valeur codée en dur.*

| Lubrifiant Naftal | Viscosité & Norme | Conditionnement | Prix Indicatif HT (DZD) | Prix Indicatif TTC (DZD) | Application Recommandée |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Naftalia Diesel** | 15W-40 (API CH-4 / CI-4) | Litre vrac / 5L | ~ 235 DA / L | **~ 280 DA / L** (1 350 DA / 5L) | Poids Lourds, Engins BTP, VUL forte charge. |
| **Naftal Synthèse** | 5W-40 (API SN / CF) | Bidon 5L | ~ 630 DA / L | **~ 750 DA / L** (3 650 DA / 5L) | Véhicules légers récents, VUL urbains injection directe. |
| **Naftal Trans** | 80W-90 (API GL-5) | Litre vrac | ~ 260 DA / L | **~ 310 DA / L** | Boîtes de vitesses manuelles et ponts différentiels lourds. |

---

## 3. Conformité Réglementaire ENACTA (Contrôle Technique Automobile)

*Cadre réglementaire consolidé : Décret exécutif n° 03-223 du 10 juin 2003 (Art. 7, 8, 9, 16, 18) complété par le Décret exécutif n° 17-255 du 18 septembre 2017.*

### 3.1 Matrice des Périodicités et Détermination de l'Âge du Véhicule

| Catégorie d'Actif | Périodicité Légale | Condition d'Âge | Réf. Légale | Préavis Alerte | Sanction Immédiate |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Poids Lourds ($> 3.5\text{ T}$)** | **Tous les 6 mois** | Sans condition | Décret 03-223 Art. 7 | J-30, J-15, J-7 | `BLOCKED_REGULATORY`, mise en fourrière administrative. |
| **Transport de Voyageurs & Bus** | **Tous les 6 mois** | Sans condition | Décret 03-223 Art. 8 | J-30, J-15, J-7 | Retrait immédiat de l'autorisation de circuler. |
| **Matières Dangereuses (Citernes HAZMAT)** | **Tous les 6 mois** | + Épreuve citerne annuelle | Art. 21 Décret 03-223 | J-45, J-15, J-1 | Interdiction absolue de chargement en raffinerie Naftal. |
| **Véhicules Utilitaires Légers (VUL $\le 3.5\text{ T}$)** | **Tous les 2 ans (24 mois)** | **Moins de 4 ans d'âge** | Décret 03-223 Art. 16 & Décret 17-255 | J-30, J-15, J-7 | `BLOCKED_REGULATORY` à échéance, défaut d'assurance. |
| **Véhicules Utilitaires Légers (VUL $\le 3.5\text{ T}$)** | **Tous les 12 mois** | **4 ans d'âge et plus** | Décret 03-223 Art. 16 | J-30, J-15, J-7 | `BLOCKED_REGULATORY`, amende légale. |
| **Véhicules Légers (Tourisme / VP)** | **Exempté** | Moins de 2 ans d'âge | Décret 17-255 | N/A | Aucune visite requise avant 2 ans de circulation. |
| **Véhicules Légers (Tourisme / VP)** | **Tous les 2 ans (24 mois)** | Entre 2 ans et 6 ans | Décret 17-255 | J-15, J-7 | Avertissement gestionnaire. |
| **Véhicules Légers (Tourisme / VP)** | **Tous les 12 mois** | Plus de 6 ans d'âge | Décret 17-255 | J-15, J-7 | Défaut d'opposabilité assurance. |

### 3.2 Règle de Résolution Logicielle de l'Âge du Véhicule

Pour éviter les rejets indus de certificats de 24 mois sur les VUL neufs, le moteur résout l'âge du véhicule par :
1. **Source Prioritaire (Exacte) :** Le champ `firstRegistrationDate` ou `manufacturingYear` de la fiche actif.
   $$\text{Âge}_{\text{années}} = \frac{\text{DateCourante} - \text{DatePremièreImmatriculation}}{365.25 \times 24 \times 3600 \times 1000}$$
2. **Source Secondaire de Repli (Fallback documenté) :** Extraction des 2 derniers chiffres du 2e groupe du matricule algérien (ex: `02410-117-22` $\rightarrow$ code série `17` = année 2017 ; $\text{Âge} = 2026 - 2017 = 9\text{ ans} \ge 4\text{ ans}$ ; `00123-324-16` $\rightarrow$ code série `24` = année 2024 ; $\text{Âge} = 2026 - 2024 = 2\text{ ans} < 4\text{ ans}$).

### 3.3 Grille des Tarifs Officiels ENACTA vs Provisions TCO Internes

*Source légale : Arrêté interministériel du 6 mai 2004 fixant les tarifs des prestations du contrôle technique automobile.*

| Catégorie ENACTA | Tarif Réglementaire Officiel HT | Tarif Réglementaire Officiel TTC (19%) | Provision TCO Interne DocteurFlotte | Justification de la Provision TCO |
| :--- | :---: | :---: | :---: | :--- |
| **Voiture Particulière (VP)** | 1 268.84 DA | **1 510.00 DA** | 3 500.00 DA | Tarif ENACTA + pré-visite atelier + immobilisation (1h). |
| **Véhicule Utilitaire Léger (VUL)** | 1 802.90 DA | **2 145.45 DA** | 5 500.00 DA | Tarif ENACTA + banc freinage/suspension + chauffeur (2h). |
| **Taxi Léger** | 1 359.49 DA | **1 617.79 DA** | 4 000.00 DA | Tarif ENACTA + vérification taximètre et équipements. |
| **Poids Lourd Porteur ($> 3.5\text{ T}$)** | 2 450.00 DA | **2 915.50 DA** | 8 500.00 DA | Tarif ENACTA + essai de freinage pneumatique + demi-journée. |
| **Tracteur Routier & Semi-Remorque** | 2 800.00 DA | **3 332.00 DA** | 11 000.00 DA | Visite tracteur + sellette + visite remorque / essieux. |
| **Citerne Matières Dangereuses** | 2 800.00 DA | **3 332.00 DA** | 18 500.00 DA | Contrôle ENACTA + épreuve d'étanchéité citerne annuelle. |

---

## 4. Fiscalité Algérienne (DGI), Identifiants & Taxe Transfrontalière

### 4.1 Identifiants Fiscaux Légaux & Règles de Validation Stricte (Zod Regex)

Tout dossier commercial, facture d'atelier ou Ordre de Réparation émis par DocteurFlotte est validé contre les schémas Zod contractuels suivants :
1. **NIF (Numéro d'Identification Fiscale) :** Exactement **15 chiffres** (`/^[0-9]{15}$/`).
2. **NIS (Numéro d'Identification Statistique) :** Identifiant statistique officiel de l'ONS.
3. **RC (Registre de Commerce) :** Format normalisé `/^[0-9]{2}\/[0-9]{2}-[0-9]{7}[A-Z][0-9]{2}$/` (ex: `16/00-1234567B22`).
4. **Article d'Imposition (AI) :** Exactement **11 chiffres** (`/^[0-9]{11}$/`).
5. **Matricule Véhicule Algérien :** Format officiel à 3 groupes `/^[0-9]{4,6}-[0-9]{3}-(0[1-9]|[1-4][0-9]|5[0-8])$/` (ex: `02410-117-22`).

### 4.2 Régime de TVA et Droit de Timbre Fiscal

*Références : Code des Taxes sur le Chiffre d'Affaires (TCA) et Code du Timbre.*
- **Taux de TVA :** 
  - Taux normal : **19 %** (prestations de transport, entretien mécanique, télématique, pièces de rechange).
  - Taux réduit : **9 %** (produits agricoles stratégiques, transport frigorifique sanitaire homologué).
- **Droit de Timbre Fiscal (Règlements en Espèces uniquement) :**
  - **1 %** de la valeur TTC de la quittance avec un minimum de **100 DA** et un plafond de **2 500 DA** (selon la Loi de Finances en vigueur). Règle d'arrondi légal à la dizaine de dinars supérieure.
  - *Exonération :* Tout règlement effectué par virement bancaire, chèque ou prélèvement est totalement exempté de droit de timbre.

### 4.3 Taxe Carburant Transfrontalière (Sortie des Frontières Terrestres)

*Base légale : Article 81 de la Loi de Finances pour 2020 (Loi n° 19-14 du 11 décembre 2019) modifiant l'art. 58 de la LFC 2008, et Circulaire de la Direction Générale des Douanes n° 02/DGD/SP/D110/2020.*

Cette taxe est exigible pour toute mission transfrontalière franchissant une frontière terrestre nationale (Tunisie, Niger, Mali, Mauritanie) et doit être provisionnée dans le coût de mission du dispatch :
- **Véhicules de Tourisme (VP) :** **500 DZD**.
- **Véhicules Utilitaires Légers (VUL) et Camions $< 10\text{ tonnes}$ :** **3 500 DZD**.
- **Camions de $10\text{ tonnes}$ et plus, et Autocars / Bus :** **12 000 DZD**.

---

## 5. Ordres de Mission (OM), Cryptographie Ed25519 & Conformité ANPDP (Loi 18-07)

### 5.1 Architecture Cryptographique Asymétrique de l'Ordre de Mission (Ed25519)

*Implémentation : `apps/api/src/fleet-intelligence/services/regulatory-mission-order.service.ts`.*

L'Ordre de Mission réglementaire généré par DocteurFlotte est bilingue (Arabe / Français) et garantit une opposabilité juridique totale en cas de contrôle routier par la Gendarmerie Nationale ou la DGSN :
1. **Signature Numérique Asymétrique Ed25519 :**  
   Le document est signé au moyen de la clé privée de l'infrastructure On-Premise souveraine (`keyId: ed25519-dz-om-2026-v1`).
2. **Jeton Anti-Rejeu JTI :**  
   Chaque ordre comporte un identifiant unique universel (UUIDv4) empêchant la duplication frauduleuse de missions.
3. **Vérification Hors-Ligne Zéro Dépendance :**  
   Le QR Code compact embarque la charge utile signée :
   $$\text{Payload} = \text{DZOM} \mid \text{OrderNumber} \mid \text{Matricule} \mid \text{DriverNIN} \mid \text{Origine} \mid \text{Destination} \mid \text{ValidUntil} \mid \text{Cargo} \mid \text{JTI} \mid \text{SignatureToken}$$
   Les terminaux mobiles de contrôle routier vérifient la signature au moyen de la clé publique embarquée sans requérir de connectivité Internet dans les zones blanches sahariennes.

### 5.2 Gouvernance & Conformité Loi 18-07 (ANPDP)

*Autorité référente : Autorité Nationale de Protection des Données à Caractère Personnel (ANPDP).*

Conformément à la Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, DocteurFlotte applique les règles souveraines suivantes :

1. **Minimisation des Données Chauffeurs (Art. 7) :**
   - Seuls les identifiants strictement nécessaires au contrôle de police/gendarmerie (Nom, prénom, matricule véhicule, catégorie de permis et numéro BPC) sont reportés sur l'Ordre de Mission.
   - Les données sensibles de santé et biométrie sont strictement prohibées.
2. **Durée de Conservation Justifiée (Art. 8) :**
   - *Choix de politique de sécurité interne DocteurFlotte :* La durée de conservation des journaux de géolocalisation et des historiques d'Ordres de Mission est **fixée à 12 mois maximum (1 an)**.
   - *Justification enregistrée au registre ANPDP :* Cette durée correspond strictement au délai légal de prescription en matière de constatation d'infractions d'exploitation, d'audit de sinistralité auprès des compagnies d'assurance (SAA, CAAT, CASH) et de réconciliation fiscale des frais réels de transport.
   - Au-delà de 12 mois, purge automatique ou pseudonymisation irréversible des traces GPS.
3. **Coupe-Feu Applicatif Souverain (In-Flight PII Firewall) :**
   - Le middleware `Law1807SanitizerMiddleware` et le pare-feu `ExternalFailoverFirewallService` interceptent tout flux sortant vers des passerelles matérielles externes. Seul l'identifiant matériel pseudonymisé (`device_uuid`) est toléré ; les noms de chauffeurs, numéros de téléphone et coordonnées directes sont masqués en mémoire.
4. **Sécurité du Stockage au Repos (At-Rest Security) :**
   - Les bases de données PostgreSQL 16 / TimescaleDB, les journaux d'audit immuables (`platform_audit_logs`) et les volumes de sauvegarde résident exclusivement sur le territoire national algérien.
   - Le chiffrement au repos des volumes de stockage physique est opéré par le sous-système hôte Linux souverain (LUKS / dm-crypt avec algorithme AES-256-XTS).

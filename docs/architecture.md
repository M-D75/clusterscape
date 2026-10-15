# Décisions d’architecture

Un dépôt, un ensemble de dépendances et un compilateur TypeScript : les répertoires sont des frontières logiques sans publication de packages, pour éviter une complexité inutile.

- `apps/web` : React, Three.js, React Three Fiber et contrôles de caméra. Panneau, sélection et zoom sémantique.
- `apps/simulator` : processus Node distinct, états complets WebSocket toutes les deux secondes.
- `packages/contracts` : schéma Zod et validation sémantique des capacités et relations.
- `packages/cluster-model` : agrégations pures, sans React ni moteur 3D.
- `packages/connectors` : validation, ordre des messages et reconnexion.
- `packages/world` : placement stable ; le rendu des bâtiments reste dans l’application web.
- `fixtures/scenarios` : générateur déterministe des deux topologies.
- `assets` : emplacement réservé aux futurs modèles, textures et matériaux.

Les nœuds ont plusieurs identifiants de partitions. L’agrégat global parcourt les identités de nœuds une seule fois ; les capacités de partitions partagées ne s’additionnent jamais. Le serveur d’accès possède un type distinct et est exclu des totaux et des allocations.

Une barre de partition mesure l’allocation sur les nœuds auxquels elle a accès, y compris les tâches d’autres partitions partageant ces nœuds. Le nombre de tâches actives compte celles soumises à cette partition. Ces deux informations ont donc des périmètres différents, volontairement.

Les allocations CPU, mémoire et GPU sont distinctes des mesures CPU. Les jobs en attente n’occupent aucune ressource. Les réservations futures sont des créneaux distincts, référencés par job en attente, et ne sont jamais ajoutées aux allocations actuelles. Le simulateur en émet un par cycle dans chaque topologie, avec états futur/actif/terminé. L’interface affiche leurs ressources, créneaux et état du job associé ; une réservation active non utilisée protège la capacité, sans créer une consommation. Un job peut rester en attente malgré un créneau actif.

Zoom : distance < 22 pour les partitions, < 14 pour les nœuds et tâches ; retour à > 17 puis > 25. Cette hystérésis évite l’oscillation près des seuils. Les positions ne dépendent ni des mesures ni de la caméra.

La couche données est portable. La caméra, matériaux, événements et composants du rendu sont spécifiques à Three.js ; changer de moteur nécessitera de réécrire cette couche. Des modèles GLTF et animations peuvent remplacer les cubes sans modifier le contrat.

## Commandes futures

Aucune commande réelle aujourd’hui. Une extension devra utiliser un canal distinct et authentifié : identifiant de commande et clé d’idempotence, accusé de réception validé par le serveur, état d’exécution, résultat final ou erreur. Réception ne signifie pas exécution réussie. Ajouter autorisations, audit, délai, annulation et état « résultat inconnu » en cas de coupure. Ne pas déduire la réussite d’un changement visuel.

## Lisibilité progressive du monde

Le bouton « Étudier Express » cadre les nœuds de la première partition standard représentative (Express sur Atlas, Science sur Aurore). Les boutons Vue globale / Partition / Nœuds placent la caméra ; les mêmes seuils avec hystérésis restent actifs à la molette. Les positions sont stables pendant les changements de mesure. Un seul bâtiment représente chaque identité ; le filtre atténue les autres nœuds et ne crée aucune copie.

À distance, le cartouche de la partition donne libres/occupés/maintenance, allocation CPU, moyenne mesurée et nombre de mesures inconnues, tâches soumises et file. Les ressources partagées restent explicitement non additionnables. Au niveau intermédiaire : nom et état par nœud. Au niveau proche : ordonnanceur, allocation, consommation et relations de partition séparés.

Indices redondants : cercle sur toit et symbole ○ pour prêt libre ; plaque de toit proportionnelle aux CPU alloués et ■ pour prêt occupé ; croix géométrique sur toit, × et texte Maintenance. Les formes de bâtiment restent simples. Les changements viennent uniquement du snapshot ; aucune animation ne crée de charge. L’inconnu est affiché « ? inconnue » ; le bandeau de péremption conserve sa priorité sur le paysage.

La sélection d’un bâtiment affiche les tâches allouées et les réservations associées (futures, actives ou terminées). La frise et les liens de file restent disponibles. Le cartouche mondial se concentre volontairement sur une seule partition représentative ; la comparaison de toutes les partitions demeure dans le panneau.

## Correction de densité des étiquettes

La passe précédente déployait les détails de tous les nœuds au niveau proche, avec mise à l’échelle des étiquettes par distance. Le résumé du titre énumérait aussi toutes les partitions. La sélection d’un nœud ne déplaçait pas la caméra ; seuls les cadrages explicites (ou la molette) la modifiaient. Le lien de réservation réinitialisait cependant le filtre à toutes les partitions, élargissant les informations affichées.

Désormais : texte fixe en pixels, nom et symbole uniquement pour les nœuds non sélectionnés ; une seule fiche enrichie pour le nœud sélectionné, détails complets au panneau. Vue globale sans étiquettes individuelles sauf sélection ; niveau partition au plus trois, niveau proche au plus six, budget réduit selon la largeur. Une priorité à la sélection puis à la maintenance et un rejet des rectangles qui se chevauchent limitent la densité. Des marges réservent le titre et la frise. Les bâtiments restent tous cliquables même si leur nom est masqué.

La sélection ne touche jamais à la commande de caméra. Un lien de tâche conserve la partition courante si compatible, sinon choisit celle de la tâche ; il ne rétablit plus toutes les partitions. Les panneaux 3D de partition et de file ont été remplacés par un résumé bref et un bouton « Voir la file » dans la zone fixe du titre, pour éviter leur superposition aux bâtiments. La frise reste indépendante et accessible.

Limite : les rectangles de collision utilisent une taille prudente prédéfinie, pas une mesure DOM exacte de chaque texte ; un nom très long peut nécessiter un ajustement. Le budget peut masquer même l’étiquette sélectionnée si elle sort de la zone sûre ; le panneau conserve les détails. Le placement 3D reste inchangé.

## Désélection

Le filtre de partition, le nœud inspecté et le job suivi sont explicitement distincts. La sortie du focus (`leaveFocus`) remet la partition à all et le nœud à null, en conservant le job suivi. Second clic sur une partition active, bouton « Afficher tous les nœuds », bouton de panneau, Échap hors saisie et clic vide empruntent cette règle. Un second clic sur un nœud ferme seulement son inspection. Seul un arrêt explicite ferme le suivi. Le fond et les clics sans intersection ne ferment qu’après un geste primaire de moins de quatre pixels sur tout le trajet ; panneau, commandes et frise ne déclenchent pas cette fermeture.

Le changement de filtre ne recadre plus implicitement : seules une nouvelle demande de cadrage (révision de vue), une topologie modifiée ou un redimensionnement du canevas déclenchent le calcul de caméra. Entrer dans une partition demande explicitement un cadrage ; sortir du focus conserve la caméra et retire immédiatement toutes les atténuations. Le bandeau de contexte réserve une hauteur stable par format.

## Cadrage et périmètre corrigés après revue visuelle

La zone Canvas est désormais un espace distinct entre titre/commandes et frise/légende, plutôt qu’un fond sous les panneaux superposés. Le cadrage calcule une sphère englobant les bâtiments du périmètre et une distance tenant compte de l’angle vertical, du rapport largeur/hauteur et d’une marge. Les boutons gardent trois échelles relatives ; le zoom sémantique est normalisé par la distance de cadrage pour rester stable entre topologies et tailles d’écran. Un zoom manuel peut toujours sortir des limites : le cadrage sûr s’applique aux boutons et au redimensionnement.

Vue globale rétablit `all` et montre les totaux uniques du cluster. Partition/Nœuds choisissent la première partition si aucune n’est active ; le filtre reste autrement conservé. Scène, compteurs, file, frise et cartes utilisent le même périmètre. Réservations filtrées par partition de soumission, comme les tâches ; les nœuds partagés continuent à montrer l’allocation physique de toutes les tâches qui les occupent, sans duplications de capacité. L’inspection individuelle annonce explicitement toutes les relations du nœud, y compris les autres partitions.

Légende en trois lignes : état par symbole et toit, allocation/réservation par marqueur, type par forme (tour mémoire, bloc large GPU, bas accès, cube standard). La couleur ne sert plus à annoncer un type dans la légende. À faible largeur, les détails ont un panneau défilant et un bouton d’accès depuis la sélection ; les bâtiments restent dans une zone 3D fixe de 380 pixels de haut.

## Recherche et suivi d’un job ordonnanceur

La recherche locale porte sur ID/utilisateur du snapshot complet (pas sur le filtre de partition), sans requêtes scheduler ni analyse de script. La fiche de suivi est indépendante des listes filtrées et annonce explicitement un suivi hors filtre. Choisir un résultat ne change pas la caméra ; le bouton « Voir sa partition » demande explicitement le cadrage.

Un suivi conserve l’identité cluster/époque/ID/soumission et la dernière observation validée de ce job. Il se met à jour pour les états queued/running/finished/failed ; une disparition conserve la dernière observation avec état actuel inconnu. Une nouvelle soumission sous le même ID ou une nouvelle époque fige le suivi jusqu’à une nouvelle sélection volontaire. Le changement de topologie efface recherche/sélection/suivi. Ce stockage en mémoire est limité au job suivi ; ce n’est pas un historique persistant.

Le monde calcule les liens depuis les allocations actuelles et les réservations non terminées. Contour violet plein pour une allocation au job, pointillé pour une réservation non allouée ; les mesures du nœud partagé sont étiquetées comme telles et jamais attribuées exclusivement au job. Après fin/échec, aucune ancienne affectation n’est inventée. Les repères de suivi restent perceptibles hors du filtre (nœuds concernés non atténués), mais le cadrage reste celui du périmètre choisi : le bouton explicite permet de retrouver la partition du job.

## Évolution v3 et complexes de ressources

Le profil par défaut est désormais `slurm30`, établi à partir de la liste détaillée fournie : 30 identités sans zéro ajouté, sept partitions long/short/normal/supermem/global/highmem/gpu. L’ancienne hypothèse de 31 nœuds est un historique archivé. Le générateur sépare résumé de capacités, noms/appartenances/états source et chronologie de jobs synthétiques. Aucun job réel ni configuration inconnue par nœud n’est déduit du relevé.

V3 distingue invalid/down/non réponse de maintenance et rejette toute allocation/démarrage sur ces états. La durée global illimitée a limitHours=null avec limitUnlimited=true. La mémoire de référence est en Mio, la capacité/mesure de simulation en Gio. Les minima + ne deviennent pas des totaux matériels connus : capacityBasis et le panneau source explicitent les capacités représentatives.

Le rendu d’un nœud est délégué à `ResourceComplex.tsx` ; les mappings bornés et lectures allocation/mesure sont purs dans `packages/world/resources.ts`. La géométrie utilise des ressources partagées. Les CPU animent un groupe de turbine et au plus trois petits volumes de vapeur selon la mesure CPU, les silos ont un remplissage mesuré, et le GPU conserve un signal fixe neutre en l’absence de mesure. La quantité de détail dépend de la taille projetée, sans déplacer les identités ou fusionner une partition. La préférence de mouvement réduit et la péremption coupent les effets.

## Placement en éventail

Le rangement par rangées est remplacé par un plan en éventail à zones orientées. `packages/world/fan.ts` gère géométrie, séparation et mémoire d’emplacements par cluster ; `scene-config.ts` expose ouverture, pas et marges. Le centre est fixe à l’origine, devant les groupes selon la caméra initiale. Les liens aboutissent aux entrées des groupes à tous les niveaux. [Algorithme, stabilité et limites](placement-eventail.md).


## Compteurs d’états courants

`packages/cluster-model/node-states.ts` définit les catégories exclusives : libre, partiellement alloué, alloué, maintenance, invalide, down/non répondant, inconnu. La priorité respecte la lecture existante du nœud : invalide, down ou non réponse, maintenance, puis allocation CPU. Les mesures CPU/RAM nulles ne changent pas un état connu. Le schéma v3 exige un état scheduler connu ; « inconnu » est une garde pour une identité absente ou un état non reconnu, normalement zéro pour un snapshot validé. L’absence de mesure GPU ne crée donc aucun compteur inconnu artificiel.

Les compteurs opèrent sur les identités uniques de calcul dans le périmètre ; une appartenance compte une fois dans chaque partition et une fois dans le global. Le centre logique et l’accès sont exclus. L’interface utilise les données simulées courantes, jamais `referenceState`. Les compteurs nuls sont masqués mais annoncés dans le libellé complet et le titre du badge. Couleur + symbole + nom accessible évitent de dépendre de la couleur. Les compteurs du panneau couvrent aussi les partitions sans zone de placement propre, pour les nœuds partagés.

`placeGroupLabels` sépare les badges de 110×40 pixels avec une marge de six pixels, à l’intérieur du canevas. Les offsets sont recalculés au plus dix fois par seconde pendant une orbite. Cette disposition peut déplacer le badge par rapport à son entrée géométrique pour éviter un chevauchement. Les très petits canevas ou de très nombreux groupes peuvent dépasser le budget spatial ; aucune garantie d’étiquetage illimité.

## Zones d’attente et agents

`packages/cluster-model/agents.ts` rassemble regroupement des pending, identités d’occurrence, badges utilisateur, sélection bornée d’instances et transitions de présentation. `WaitingPanel.tsx` fournit la recherche par zone et les utilisateurs regroupés ; `Agents.tsx` dessine les figurines proches. Aucun changement du contrat v3, connecteur réel ou historique n’est nécessaire. Le suivi existant reste la référence d’identité et de fiche. La zone sélectionnée est explicite dans le contexte et se ferme avec les mêmes sorties de focus ; elle ne crée pas automatiquement de filtre. [Règles et limites](agents-attente.md).

## Réservations d’étiquettes et capsules

La passe d’affinage utilise `packages/world/overlays.ts` pour les collisions des repères agents et la réservation des fiches prioritaires. Les groupes et compteurs proches respectent ces réservations. Le suivi courant utilise ◎/halo/trait clair, l’identité utilisateur une palette distincte. `packages/world/capsules.ts` fixe une échelle absolue et un cap de huit capsules ; `WaitingCapsules.tsx` partage ses géométries simples, sans animation ni interprétation de ressources. Aucun changement de contrat, de topologie ou de connecteur. Voir `lisibilite-capsules.md`.

## Générateur vivant

`fixtures/scenarios/lively.ts` ajoute un moteur déterministe d’arrivées et de backfill à capacités libres, distinct des fixtures simples préservées. États actifs exhaustifs, 160 états terminaux maximum, identités uniques par époque. Le producteur émet ce scénario chaque seconde au temps ×10 ; les fixtures simples gardent deux secondes/×1. Métadonnées optionnelles de cycle dans clock pour la frise/phase, fraîcheur toujours réelle. Le client affiche la population déclarée et l’activité globale dédupliquée. Aucun changement du moteur 3D ni du connecteur réel ; [règles et limites](simulation-vivante.md).

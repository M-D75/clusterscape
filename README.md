# ClusterScape

Observatoire HPC local en paysage 3D. **Simulation uniquement** : aucune connexion à Slurm, aucun lancement/arrêt de job, aucune analyse de script. Interface et documentation en français.

## Démarrer

Node.js 20+ et navigateur WebGL requis.

```sh
cd /Users/ekko-vi/Documents/5-GIT/work-with-codex/clusterscape
npm install
npm run dev
```

Ouvrir http://127.0.0.1:5173. Le simulateur séparé écoute ws://127.0.0.1:8787 ; arrêter avec Ctrl+C. Les services peuvent aussi être lancés séparément avec `npm run simulator` et `npm run web`.

## Profil affiché par défaut

**Activité vivante** est le scénario par défaut : 100 utilisateurs fictifs, vagues hétérogènes sur 120 secondes réelles, temps simulé ×10 et mises à jour chaque seconde. Les ressources disponibles régulent les démarrages ; les files se résorbent lorsque les jobs finissent. Les profils simples restent disponibles dans Configuration. [Règles et limites](docs/simulation-vivante.md).

Le **profil fourni** contient 30 nœuds distincts, noms exacts sans zéro ajouté, et sept partitions : `long`, `short`, `normal` (défaut), `supermem`, `global`, `highmem`, `gpu`. `node6` et `node19` sont absents. `node26` est l’unique nœud GPU, avec sept GPU configurés. Les noms/appartenances et états initiaux viennent du relevé utilisateur, qui n’est pas temps réel. Les jobs, allocations et mesures évolutives sont fictifs.

Les CPU/mémoires marqués `+` sont des minima de groupes hétérogènes, pas les configurations exactes de chaque nœud. Des capacités représentatives cohérentes sont utilisées pour la simulation et explicitement étiquetées. La mémoire Slurm en Mio est convertie en Gio par division par 1024. Node31 (global) et node26 (gpu) conservent les CPU/RAM exacts fournis. Le panneau « Résumé Slurm fourni » sépare les valeurs de référence de la simulation.

Voir [profil et hypothèses](docs/profil-fourni.md). Atlas et Aurore restent disponibles. L’ancienne hypothèse Cluster 31 est archivée et n’est plus proposée comme profil fidèle.

## Lire le paysage

Chaque nœud est un petit complexe régulier : **CPU à gauche**, **mémoire à l’arrière**, **GPU à droite uniquement s’il existe**. Les tours, silos et blocs angulaires restent reconnaissables sans couleur. Les formes sont simples et ne décrivent pas un site physique.

- Capacité : modules/paliers bornés ; `+` indique que le nombre de modules est plafonné. Les valeurs exactes représentées sont dans la fiche. Pas d’équivalence CPU=GPU=RAM ni de promesse cœurs=performance.
- Allocation : contours verts et petite barre CPU. Réservation : contour bleu/ambre distinct. Job suivi courant : contour clair, halo et symbole ◎.
- Mesure CPU connue : turbine et vapeur légère en vue proche. Mesure mémoire : remplissage du silo. GPU : mesure non fournie, signal neutre fixe.
- Inconnu : hachure, réservoir filaire et texte `?`, jamais assimilé à zéro. Maintenance, invalide et down sont distincts. Les effets s’arrêtent si les données sont périmées ou si le mouvement réduit est préféré.
- Au dézoom, les positions et complexes demeurent ; seuls les détails disparaissent progressivement. Aucun regroupement en une centrale unique.

`◎` est un centre de communication **logique**, hors ressources de calcul. Ses liens pointillés sont schématiques, sans trafic mesuré : un lien par entrée de groupe, à tous les niveaux de zoom. Le centre est fixe devant un éventail calculé ; les bâtiments restent uniques et les groupes grandissent vers l’extérieur. Voir [le placement](docs/placement-eventail.md).

## Navigation et sélection

Glisser : orbite ; molette : zoom ; boutons : cadrages sûrs. « Étudier normal » cadre la partition la plus peuplée/default. Vue globale rétablit le cluster entier. Filtre, compteurs, frise et panneaux partagent le même périmètre ; les nœuds partagés ne sont jamais dupliqués.

Le bandeau distingue **Filtre**, **Sélection** et **Suivi job**. Un clic de partition active son filtre ; un second clic sur son étiquette le retire. « Afficher tous les nœuds », Échap hors saisie ou clic vide retirent filtre et sélection sans déplacer la caméra. Les nœuds retrouvent leur opacité ; « Vue globale » reste la commande de recadrage. Le second clic sur un nœud ferme seulement son inspection. Les gestes de caméra ne ferment pas le focus. Le suivi du job est indépendant et reste actif jusqu’à « Arrêter le suivi ».

Au dézoom, chaque étiquette de partition montre le total et les compteurs d’états courants non nuls, avec symbole et couleur. Le panneau donne ces compteurs pour toutes les partitions, y compris les appartenances partagées. Les catégories sont exclusives ; le total global déduplique les nœuds et exclut accès/centre. « Alloué » désigne une allocation CPU complète, jamais une saturation mesurée. Les mesures inconnues ne rendent pas inconnu un état d’allocation connu. Les textes accessibles et le survol exposent aussi les zéros. Les badges sont séparés en pixels dans le canevas.

## Rechercher et suivre un job

« Chercher un job » accepte ID ou utilisateur, sur le cluster entier. La fiche distingue demande totale/par nœud, allocation actuelle, attente, réservation, état, utilisateur et partition. Elle reste visible hors filtre. Le bouton « Voir sa partition » cadre explicitement ; une recherche ne rapproche pas automatiquement la caméra.

Scénario simple du profil fourni : `t3` est multi-nœuds sur node4/node8 ; `t9` attend puis utilise un créneau sur node0 à 16–24 s du cycle ; `t10` attend une maintenance de node3 puis démarre à 40 s et finit à 56 s ; `t8` utilise les ressources GPU de node26 ; `t18` illustre un échec. Ce ne sont pas les jobs du relevé réel.

Une réservation n’est pas une allocation ni une garantie de démarrage. Un pending sans nœud ne reçoit aucun bâtiment fictif. Aucune allocation passée n’est inventée après fin/échec ; consommation propre au job non fournie. Le suivi se fige si l’identifiant est réutilisé avec une autre soumission ou si le producteur redémarre. « Arrêter le suivi » ferme la fiche et ses repères.

## Vérifications

```sh
npm run typecheck
npm test
npm run build
npm run examples
# Contrôle réseau optionnel avec simulateur démarré (~80 s) :
npm run test:stream
```

Le build est dans `apps/web/dist` ; il nécessite toujours le simulateur WebSocket. Le contrôle réseau shell peut être bloqué par le bac à sable (`EPERM`) même quand le navigateur accède au flux.

## Limites

Capacités représentatives sur les groupes hétérogènes, source statique non temps réel, activité fictive. Pas de mesures GPU ni de consommation individuelle des jobs. Pas d’authentification/TLS, historique persistant, plan matériel réel ou commandes d’administration. Services et ports localhost fixes. Bundle 3D encore au-dessus du seuil de taille conseillé par Vite.

[Grammaire visuelle](docs/grammaire-ressources.md) · [Contrat v3](docs/contrat.md) · [Architecture](docs/architecture.md) · [Vérifications](docs/verification.md)

## Attente et agents symboliques

Les zones d’attente comptent séparément jobs et utilisateurs uniques ; clic pour ouvrir une recherche limitée à la partition et des listes complètes regroupées par utilisateur. Aucun ordre FIFO ou nœud cible n’est déduit. Au niveau Nœuds, des agents simples représentent les jobs en cours : deux par nœud au maximum, 18 instances au total (10 en format étroit), avec regroupements `+N jobs`. Les badges ordinaires sont discrets ; identifiant au survol ou au suivi, avec réservation de la fiche nœud et masquage des repères qui ne tiennent pas. « Tous les jobs » conserve une liste exhaustive. Un agent ouvre la fiche existante ; les autres jobs du même utilisateur peuvent être révélés séparément. La consommation reste portée par les bâtiments. [Identités, transitions, limites](docs/agents-attente.md).

Les zones d’attente portent aussi des capsules : une par job jusqu’à huit, puis surplus regroupé en lot. L’échelle est absolue pour toutes les partitions et le compteur reste exact. [Badges et capsules](docs/lisibilite-capsules.md).

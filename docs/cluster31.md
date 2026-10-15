> **Historique remplacé** : l’utilisateur a fourni ensuite une liste exacte de 30 nœuds. Le profil actif est décrit dans [Profil fourni](profil-fourni.md). Les hypothèses ci-dessous ne sont plus présentées comme fidèles.

# Cluster 31 — configuration provisoire

Simulation locale affichée par défaut, sans connexion Slurm. 31 nœuds de calcul exactement, nommés `node00` à `node30`, et sept partitions. Aucun bâtiment de serveur d’accès supplémentaire dans cette fixture ; Atlas et Aurore conservent leurs configurations existantes.

| Partition | Nœuds inclus | Nombre | Profil synthétique |
| --- | --- | ---: | --- |
| normal | node00–node14 | 15 | standard |
| short | node15–node18 | 4 | standard |
| long | node19–node22 | 4 | standard |
| allmem | node23–node25 | 3 | allmem |
| supermem | node26–node27 | 2 | supermem |
| global | node28–node29 | 2 | standard |
| GPU | node30 | 1 | gpu |

`GPU` conserve les majuscules. `global` désigne seulement ses deux nœuds : ce nom ne signifie pas qu’elle contient le cluster entier. Les appartenances sont disjointes par choix provisoire de cette fixture, sans imposer cette règle au contrat ni aux autres topologies.

## Capacités entièrement fictives et configurables

Les caractéristiques réelles restent à définir. Les valeurs ci-dessous ne décrivent aucun matériel réel ; elles servent uniquement à une simulation cohérente avec le contrat.

| Profil | CPU logiques par nœud | Mémoire Gio par nœud | GPU par nœud |
| --- | ---: | ---: | ---: |
| standard | 32 | 128 | 0 |
| allmem | 64 | 256 | 0 |
| supermem | 64 | 512 | 0 |
| gpu | 32 | 128 | 1 |

Total synthétique : 1152 CPU, 5120 Gio et un GPU physique sur un seul nœud. Les limites de durée de partition sont également des valeurs de démonstration (2, 24, 48 ou 72 heures), sans attendre ces durées dans le cycle court.

Modifier la répartition et les profils dans `fixtures/scenarios/cluster31-config.ts`. Les plages couvrent actuellement 0–30 sans trou ni recouvrement, vérifiées par tests. Les capacités et profils visuels définitifs viendront plus tard ; le monde utilise toujours des formes simples.

## Activité du cycle (60 secondes)

Douze utilisateurs fictifs, dix-huit jobs : au départ huit actifs, sept en attente, deux terminés et un échec. Un job actif est placé dans chaque partition, avec un second calcul dans normal.

- `t1` finit sur node00 à 12 s ; `t9` attend un créneau normal sur node00 à 16–24 s, puis finit et libère.
- `t2` finit sur node15 à 24 s ; maintenance de node15 à 28–40 s. `t10` attend puis démarre à 40 s si les contraintes sont satisfaites, et finit à 56 s.
- `t3` est multi-nœuds sur node01 et node02.
- `t4/t5/t6/t7/t8` illustrent respectivement long/allmem/supermem/global/GPU ; `t18` est en échec dans GPU.
- Mesure manquante sur node00 à 20–30 s ; coupure/reconnexion simulée inchangée à 44–52 s.

Demandes et allocations : 8 CPU / 32 Gio par nœud pour ces jobs, plus un GPU pour ceux qui le demandent. Le contrôle de capacité et de disponibilité reste le même. Les noms de jobs sont des libellés fictifs, sans script ni commande réelle. Le suivi protège toujours les occurrences via `submittedAt`.

## Placement

Le placement regroupe chaque nœud une seule fois par sa première appartenance de partition. Des limites discrètes et des noms/compteurs rendent les sept groupes identifiables. Cliquer un nom cadre son périmètre ; « Étudier normal » choisit la partition la plus peuplée, règle générique et indépendante des noms. Une appartenance supplémentaire resterait visible dans les relations sans créer de bâtiment supplémentaire. Ce paysage est une organisation logique, pas un plan physique du matériel.

## Centre de communication abstrait

Un repère hexagonal `◎` représente le **Centre de communication**, origine logique de liens schématiques. La scène contient 31 bâtiments de calcul **plus** ce point logique : le compteur reste 31 et les partitions restent sept. Ce repère n’a aucune capacité ni allocation/réservation et n’est pas un serveur maître, contrôleur ou login physique. La modélisation détaillée de plusieurs serveurs d’accès/contrôleurs est reportée.

La métadonnée optionnelle `topology.communication` contient seulement identité, nom et description. Elle n’est émise que par Cluster 31 ; Atlas et Aurore restent inchangés sur ce point. Le placement est calculé dans le couloir entre groupes ; les décalages, rayon et hauteur sont configurables dans `packages/world/scene-config.ts`. Le cadrage global inclut ce repère.

À distance : un lien par groupe visible. En vue rapprochée : lien vers le nœud sélectionné, ou un aperçu d’au plus six nœuds du périmètre (priorité aux nœuds du job suivi). Tous les liens sont fixes et pointillés, sans débit ni animation de trafic. L’icône ouvre une explication dans le panneau ; une nouvelle sélection ou la fermeture habituelle la retire.

Les noms des groupes sont affichés à distance ; en vue partition/nœuds, le nom du périmètre reste dans le titre et les limites au sol restent visibles, pour ne pas superposer le nom de groupe aux étiquettes des bâtiments.

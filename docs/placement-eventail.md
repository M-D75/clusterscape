# Placement en éventail

Le placement est calculé dans `packages/world/fan.ts`, indépendamment des mesures et du rendu des complexes. Le profil fourni reste composé de 30 nœuds et 7 partitions. Le centre de communication est un repère logique séparé, sans capacité ni transit physique implicite. Atlas et Aurore conservent leur absence de centre explicite ; leur éventail utilise la même origine virtuelle.

## Géométrie

L’origine du monde est l’ancre du centre, à l’avant selon la projection XZ de la caméra initiale (.48, .72, .5). Le demi-plan arrière est fixe : tourner la caméra ne tourne pas la carte. Les entrées des groupes sont réparties sur une ouverture de 145°. La part angulaire initiale dépend de la largeur occupée et des chemins, pas d’un secteur égal par partition. Aucun nom de partition n’est codé en dur. Le tri naturel des identifiants détermine l’ordre initial.

Chaque groupe est un rectangle orienté selon son rayon. Les bâtiments gardent leur orientation locale CPU/RAM/GPU et sont espacés de 3,8 unités, assez pour leur dalle de 2,52 × 2,3 et sa diagonale dans une grille tournée. Les marges latérales de 2 unités et les marges avant/arrière de 3,2/2 incluent l’encombrement des complexes et l’entrée où figure le nom du groupe. Jusqu’à quatre colonnes sont fixées à la création du groupe ; les nouvelles lignes poussent vers l’extérieur. La zone normal (13 nœuds) est la plus grande dans le profil fourni.

Le rayon initial dépend de la somme des largeurs et de l’ouverture, avec un minimum de 9. Le test de séparation des rectangles orientés exige 2,5 unités de chemin entre zones. En cas de collision, le groupe à placer est repoussé par pas d’une unité sur son rayon. Les liens pointillés vont uniquement du centre aux entrées des groupes visibles, quel que soit le zoom. Ils n’impliquent ni câblage ni trafic mesuré. Les liens entre allocations multi-nœuds restent distincts.

Le cadrage projette les coins des zones, les bâtiments et le centre dans le repère de la caméra. Le titre et la frise occupent des zones séparées du canevas. Le sol et la grille s’adaptent à l’étendue de la carte.

## Stabilité et évolution

Le plan conserve une mémoire locale par identité de cluster pendant la session. Sa signature utilise seulement identités, types, appartenances et noms de groupes : activité, allocations, réservations, états et zoom ne déplacent rien. Un même relevé initial donne le même placement, même si les tableaux arrivent dans un ordre différent. Les ticks de topologie identique réutilisent le plan.

Un nœud partagé a un seul bâtiment. À sa première apparition, sa première appartenance selon le tri naturel choisit son groupe ; ce choix est conservé tant qu’il reste valide. Le panneau conserve toutes ses relations, et un filtre inclut le bâtiment partagé sans créer de copie ni additionner deux fois ses ressources.

Les nouveaux nœuds prennent des cases après les cases déjà attribuées. Les cases retirées restent réservées dans cette session : retirer un nœud ne compacte pas les autres. Un groupe qui grandit conserve son angle et ses colonnes. S’il rencontre un voisin, seul ce groupe est repoussé vers l’extérieur ; ses propres bâtiments peuvent alors se déplacer ensemble. Les autres zones servent d’obstacles fixes. Un nouveau groupe prend le plus grand intervalle angulaire encore disponible, puis cherche sa place vers l’extérieur. Retirer un groupe ne redistribue pas les autres.

## Limites

La stabilité est locale à la session et déterministe pour une même suite d’évolutions, pas une disposition canonique identique entre toutes les histoires possibles. Recharger une topologie modifiée recalcule sa répartition initiale. Des retraits répétés laissent des trous ; une croissance importante peut éloigner un groupe. Si une appartenance de placement disparaît, le nœud rejoint un autre groupe. Aucun optimum global de surface ou de déplacement n’est garanti.

Les marges réservent l’entrée des étiquettes usuelles ; des noms arbitrairement longs peuvent toujours se recouvrir en projection. La vue globale présente la structure ; le clic de partition rapproche les détails. Tests géométriques sur 1, 4, 12, 30 et 83 nœuds, jusqu’à 11 partitions ; aucune promesse pour des milliers de nœuds. Réglages dans `scene-config.ts`, sans paramètres UI supplémentaires.

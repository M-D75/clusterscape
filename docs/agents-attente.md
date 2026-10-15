# Attente, utilisateurs et agents symboliques

Les données restent des snapshots simulés v3, sans changement du contrat ni connexion scheduler réelle. Aucune session humaine, présence physique, consommation propre au job ou cible d’attente n’est déduite.

## Zones d’attente

Chaque partition a un regroupement des jobs actuellement `queued`. Deux compteurs distincts donnent le nombre de jobs et le nombre d’utilisateurs uniques. Un utilisateur peut avoir plusieurs jobs. Les compteurs sont calculés par identité du job, pas par allocations ou instances graphiques. Ce regroupement n’est pas une file FIFO et ne représente pas un ordre de passage.

Un disque discret marque la zone à l’entrée de chaque partition. Les appartenances partagées utilisent des disques distincts devant leur groupe physique, sans recopier les bâtiments. Au niveau global, chaque badge de groupe de placement associe son résumé d’états à un bouton d’attente. Pour les partitions partagées sans groupe propre (Atlas), tous les regroupements restent accessibles dans le panneau des partitions et le marqueur du filtre choisi.

Le clic ouvre un panneau de zone, sans filtrer ni déplacer automatiquement la caméra. Il présente les utilisateurs regroupés, puis les jobs de chaque utilisateur. Sa recherche porte uniquement sur les jobs en attente de cette partition, par utilisateur, identifiant ou nom. Liste complète et défilante, sans limitation silencieuse. Un job qui commence quitte immédiatement cette liste ; une recherche peut donc ne plus le trouver dans la zone. Sa fiche de suivi globale continue à montrer son état courant.

## Agents proches

Un agent représente l’activité d’un job en cours sur un nœud alloué, pas une personne ou une connexion réelle. Un job multi-nœuds possède plusieurs instances liées par la même identité d’occurrence ; le job est compté une fois. Les bâtiments restent le support des mesures CPU/RAM ; le nombre d’agents n’est jamais une mesure de consommation.

Les agents n’apparaissent qu’au niveau Nœuds, quand la taille projetée du complexe permet ses détails (environ 26 pixels ou plus). Maximum 18 instances (10 sur un canevas de moins de 700 pixels), et deux par nœud. Le job suivi, puis ses relations utilisateur explicitement révélées, ont priorité. Les débordements sont regroupés en `+N jobs` par nœud ; clic pour inspecter la liste exhaustive de ses allocations. Toutes les recherches globales sont également complètes et défilantes. Les corps sont simples, avec badge utilisateur stable en forme et couleur ; le nom reste fourni au survol et dans le texte accessible. Par défaut les agents portent un petit symbole utilisateur ; leur identifiant apparaît au survol, quand leur échelle suffit, ou pour le job suivi. Le suivi porte ◎ et un double trait clair, avec 1/2, 2/2 pour ses instances multi-nœuds. Les repères sont placés hors des fiches et se masquent s’ils ne tiennent pas ; la liste « Tous les jobs » reste complète.

Cliquer un agent ouvre la fiche de job existante. Un second clic sur ce même job arrête son suivi. Le bouton « Voir les autres jobs de … » révèle la liste complète des autres jobs observés du même utilisateur, leurs partitions et leurs allocations actuelles. Ceux-ci sont explicitement distincts du job suivi. Contours bleus pointillés sur leurs nœuds, jusqu’à six liens schématiques proches ; les allocations du job suivi utilisent le halo et le double trait clair ◎. Un changement d’occurrence ou un suivi figé désactive ces relations courantes. Sortir du focus garde le suivi explicite ; arrêter le suivi retire aussi ses relations utilisateur.

## État et mouvement

L’identité est cluster + époque du producteur + ID de job + soumission quand fournie ; chaque instance ajoute l’ID du nœud. La dernière observation acceptée suffit : aucun historique ni file d’événements n’est ajouté.

Au premier affichage, les agents sont directement à leur poste selon le snapshot. Seul un passage `queued` → `running` observé sur deux séquences consécutives de la même occurrence déclenche un déplacement symbolique de 0,65 unité pendant 0,7 seconde, juste devant le poste. L’allocation et la fiche sont mises à jour immédiatement ; elles n’attendent jamais l’animation. Après un saut de séquence, un redémarrage ou un ID recyclé, aucun trajet manqué n’est inventé. Une fin/échec supprime immédiatement l’instance et annule son mouvement ; la fiche affiche la fin. En données périmées, la progression est gelée. Le mouvement réduit affiche directement la position finale.

## Limites

Les formes/couleurs sont une palette déterministe limitée : plusieurs utilisateurs peuvent partager un badge ; leurs noms restent la référence. Les agents sont symboliques et sans trajectoire physique ni évitement d’obstacles. La vue proche d’une grande partition peut encore être dense ; zoom, regroupements et panneau servent à lire les détails. Les limites portent sur les instances dessinées, pas sur les listes de données. Pas d’historique persistant ni reconstitution des anciens nœuds d’un job terminé.

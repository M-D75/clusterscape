# Affinage des repères et capsules d’attente

## Hiérarchie des repères

Les silhouettes restent les agents. Leur badge ordinaire ne dessine qu’un petit signe utilisateur dans une cible transparente de 24×24 pixels. L’identifiant est fourni par l’infobulle au survol ; il apparaît dans le badge au focus clavier, pour le job suivi, ou si le corps dépasse environ 22 pixels et que six instances au plus sont présentes. Le nom complet, le job et le nœud restent au survol et dans les textes accessibles. Le suivi ne dépend plus du violet : ◎, double trait clair et halo au pied, cohérents avec le contour de bâtiment et le lien multi-nœuds. Les badges utilisateur utilisent une palette distincte sans violet/jaune de suivi. Un job multi-nœuds affiche 1/2 et 2/2 sur ses repères suivis, sans compter deux jobs.

`packages/world/overlays.ts` place les cibles en pixels. Les fiches nœuds sont réservées d’abord, puis les groupes/compteurs et le centre logique ; les agents suivis et survolés ont priorité sur les repères ordinaires et les +N. Les candidats restent dans le canevas, séparé des commandes et de la frise. Un repère peut se décaler légèrement, avec un trait discret vers son agent. Faute de place il est masqué ; le corps reste cliquable et la liste défilante « Tous les jobs » est exhaustive. Les allocations de la fiche de job permettent aussi d’inspecter explicitement un nœud courant.

Une ancienne occurrence figée reste dans la fiche avec son avertissement, mais n’alimente ni halo, ni contour, ni lien courant. Les calculs d’étiquettes utilisent les projections de caméra et sont recalculés pendant les mouvements. Leurs dimensions CSS sont bornées. Limites : un repère sélectionné peut aussi manquer de place, notamment en bord d’écran ; les informations restent dans le panneau. Les traits de rappel sont schématiques ; aucun optimum global de placement ou masquage des bâtiments par les textes n’est garanti.

## Capsules et lots

`capsuleLayout` utilise le nombre entier de jobs queued, pas le nombre d’utilisateurs, les allocations ou les ressources. Zéro : disque vide et compteur zéro. Un à quatre : capsules séparées sur palette. Cinq à huit : seconde couche, deux couches au maximum. Plus de huit : huit capsules et un lot distinct pour le surplus ; le compteur exact et la mention de lot restent affichés. Exemple : 500 jobs = huit capsules + lot de 492, jamais 500 objets. La géométrie et la hauteur sont bornées par zone, identiques pour toutes les partitions, sans normalisation locale. Un petit effectif dans une zone ne prend pas la même géométrie qu’un gros effectif sous prétexte de proportion locale.

La palette reste dans le disque d’entrée, hors des complexes. Les couleurs sont calmes et neutres ; une attente longue ne déclenche ni rouge ni alarme. Le survol annonce aussi les utilisateurs uniques et le clic garde le panneau existant, avec recherche locale et listes complètes regroupées par utilisateur. Les compteurs proches sont placés avec les autres réservations écran ; les zones partagées sans îlot propre ont leur propre compteur. Les chiffres exacts restent aussi disponibles directement dans la liste des partitions. Un compteur hors champ ou sans place ne peut naturellement pas être forcé devant une fiche prioritaire.

L’état visuel suit le snapshot sans animation inventée d’arrivée ; en données périmées il conserve le dernier état avec l’avertissement commun. Aucun trajet FIFO ou nœud cible n’est déduit. La géométrie est simple et partagée, au plus huit capsules, une palette et un lot par partition ; pas de promesse de performance pour des milliers de partitions.

## Contrôle reproductible

`/capsules-check.html` est une page de contrôle locale, hors du parcours de la démo. Elle réutilise `WaitingCapsules` et présente 0, 1, 5, 8, 50 et 500 jobs synthétiques au même facteur d’échelle. Les titres montrent le compte exact et le surplus. Elle ne modifie ni la topologie source, ni le flux, ni les données de la démonstration.

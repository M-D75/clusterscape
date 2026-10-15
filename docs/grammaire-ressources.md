# Grammaire visuelle CPU / GPU / mémoire

Un nœud reste une identité, un emplacement et une sélection. Il devient un petit complexe sur une dalle, jamais trois nœuds ni une centrale fusionnée de partition.

## Disposition et silhouettes

CPU à gauche du repère local : socle industriel, tours étroites et turbine. Mémoire à l’arrière : silos cylindriques transparents. GPU à droite seulement si `gpus > 0` : socle carré bas angulaire, blocs et cœur fixe. La gauche/droite est relative au repère du complexe ; une orbite de caméra change naturellement son orientation à l’écran. Le centre logique reste une forme hexagonale séparée sans ressources.

La capacité ne déforme pas tout le bâtiment. Les modules sont bornés et comparables uniquement **dans la même ressource** :

| Ressource | Paliers |
| --- | --- |
| CPU | une tour par tranche de 16 CPU logiques, arrondie au-dessus ; quatre tours maximum, signe + au-delà de 64 |
| Mémoire | un à quatre silos : ≤64, ≤128, ≤256, ≤512 Gio ; + au-delà de 512 |
| GPU | un bloc par GPU configuré jusqu’à quatre blocs ; + au-delà, donc sept GPU ne deviennent pas sept gros bâtiments |

Les valeurs numériques de la fiche priment sur le nombre de modules. Ces paliers ne comparent ni performance CPU/GPU ni puissance électrique. Les capacités provisoires ou partielles sont explicitement signalées.

## Allocation versus mesure

Contre-marques au sol vertes et petite barre devant le CPU indiquent des ressources allouées aux jobs running. Les réservations restent des contours distincts bleu/ambre ; elles ne remplissent pas les silos et ne font pas tourner les turbines. Le contour violet de suivi conserve son sens : nœud lié au job, allocation ou réservation différenciée.

La turbine tourne selon `usage` CPU connue et fraîche. Trois petits volumes de vapeur au maximum apparaissent en détail proche pour une mesure CPU positive ; c’est une métaphore informatique sans mesure d’énergie ou d’émission réelle. Le remplissage des silos représente `memoryUsed / memory`, mesure globale au nœud en Gio, distincte de la mémoire allouée et non attribuable à un job seul. Une faible mémoire système de fond peut être mesurée sur un nœud sans job.

La simulation ne fournit aucune mesure GPU : cœur et bandes restent **neutres fixes**, sans animation attribuée à une utilisation inventée. L’allocation GPU reste connue et peut être signalée par son contour.

`null` ou mémoire absente : état inconnu, hachure/fil de fer et `?` dans les détails ; jamais réservoir vide ou turbine « inactive donc zéro » sans indication. Un zéro connu reste une mesure nulle. Sur maintenance/inval/down/non réponse, aucun mouvement d’activité. Données périmées : les effets s’arrêtent, le dernier remplissage connu reste visible sous avertissement.

## Zoom et performance

Les positions et silhouettes restent stables. La taille projetée d’un complexe fait varier progressivement la transparence des anneaux, turbine et détails ; les formes restent présentes au dézoom. À très faible détail, deux tours au maximum restent pleinement visibles ; les tours supplémentaires et petits détails se fondent progressivement avec la taille projetée. Les valeurs exactes restent dans les résumés/fiche. Ce fondu est une simplification visuelle, sans transition de charge inventée.

Géométries simples partagées, pas de textures lourdes, pas de lumières ponctuelles par nœud, pas d’ombres ou de post-traitement ajouté. Vapeur limitée à trois volumes par complexe et uniquement en détail proche. Le mouvement réduit du navigateur supprime turbine/vapeur ; les mesures restent lisibles statiquement. Les liens du centre logique demeurent schématiques, sans animation de trafic.

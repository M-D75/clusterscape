# Scénarios

Atlas : 8 nœuds standards de 32 CPU / 128 Gio partagés entre Express (2 h), Production (24 h), Longue durée (72 h), 2 nœuds mémoire de 64 CPU / 512 Gio, 2 GPU de 32 CPU / 128 Gio / 4 GPU. Un serveur d’accès distinct. Total 448 CPU, 2304 Gio et 8 GPU. Douze utilisateurs fictifs et dix-huit jobs : huit actifs, sept en attente, deux terminés, un échec au début du cycle.

Aurore : 3 standards et 1 GPU, partitions Science et Image, 4 utilisateurs et 6 jobs. Noms, tailles et relations proviennent du même générateur, pas du rendu.

Séquence modulo 30 ; un pas vaut 2 secondes. Les transitions sont déterministes, l’heure d’observation reste l’heure courante du serveur.

| Pas | Événement |
| --- | --- |
| 0 | État initial ; transport multi-nœuds actif |
| 6 | Fin de t1, libération intégrale |
| 8 | Démarrage d’une tâche en attente sur le nœud libéré |
| 10–14 | Mesure CPU absente sur n0 |
| 12 | Fin de t2 avant maintenance |
| 14–19 | n1 en maintenance, aucune allocation |
| 22–25 | Coupure WebSocket, tentatives de reconnexion rejetées |
| 26 | Flux disponible et récupération d’un état complet |
| 30 | Nouveau cycle de démonstration |

La boucle remet volontairement les jobs à leur état initial ; elle représente un scénario de démonstration répétable, pas un historique de jobs réel. L’état complet pendant la coupure n’est pas envoyé aux clients.

## Parcours vivants v2

Une réservation existe dans **les deux topologies** dès le début du cycle. Elle concerne `t9` sur Atlas, `t4` sur Aurore, sur n0 : 8 CPU, 32 Gio, 0 GPU. Avant le pas 8, le job est queued avec le motif « Créneau réservé pas encore ouvert ». Au pas 8 (16 secondes), le créneau devient active et le job démarre si `canStart` accepte la proposition ; au pas 12 (24 secondes), le créneau finit, le job est terminé et ses ressources sont libérées. Ce parcours remplace l’ancien job démarré indéfiniment au pas 8.

Une autre tâche (`t10` / `t5`) n’a **aucune réservation**. Elle attend d’abord une priorité du scénario, puis la fin de la maintenance de n1 (pas 14 à 19). Au pas 20 (40 secondes), disponibilité et capacité sont contrôlées avant démarrage ; au pas 28 (56 secondes), elle finit et libère ses ressources. Les autres tâches queued restent en file sans heure de démarrage annoncée.

Les listes affichent demande par nœud, motif d’attente, créneau, état et ressources réservées. Un anneau bleu signale un créneau futur ; un anneau ambre signale un créneau actif. La bande verte sur le toit reste une allocation de job running. Au zoom cluster : résumé ; au zoom groupes : attente et créneaux par partition ; au zoom nœuds : relation au créneau et détails dans le panneau. L’horloge simulée est affichée en UTC et reste distincte de la fraîcheur réelle.

## Lecture graphique

La frise affiche les 60 secondes du cycle courant : bleu futur, ambre actif, gris terminé, avec une ligne « maintenant ». Elle dérive des dates du snapshot et se fige si le flux est périmé. Cliquer une barre ou le marqueur de bâtiment sélectionne le nœud et ouvre/surligne la carte correspondante. Les nœuds réservés portent un contour et une étiquette explicite.

La zone ambre « File sans créneau » compte uniquement les jobs queued sans réservation future ou active, dans le filtre de partition courant. Son clic ouvre le premier job concerné ; aucune ressource ne lui est dessinée comme attribuée. Les jobs queued avec créneau restent visibles dans la liste d’attente mais ne sont pas ajoutés au compteur de cette zone. Au zoom groupes, le résumé par partition complète la zone globale. Les capacités globales restent fondées sur les identités de nœuds uniques.

## Profil fourni v3 (actif par défaut)

Les données détaillées dans [Profil fourni](profil-fourni.md) remplacent l’hypothèse Cluster31. À l’origine du cycle, 16 jobs running synthétiques occupent 17 nœuds du relevé alloc/mix ; les idle restent sans allocation, inval et down restent exclus. Cinq jobs sont en attente et un en échec. Ils ne décrivent aucun job réel.

T3 alloue node4 et node8. T1 sur node0 finit au pas6 ; t9 réserve node0 de8 à12, démarre si contraintes remplies puis finit. T2 sur node1 finit au pas12. Node3, idle dans la référence, passe en maintenance simulée de14 à20 ; t10 y démarre de20 à28. Les jobs mémoire synthétiques peuvent demander 60% de la capacité représentative afin d’illustrer les silos et le remplissage, sans déduire ces demandes des états Slurm. La mémoire utilisée simulée reste distincte de l’allocation et inclut une faible charge de fond.

Node10 inval et node11 down/non répondant restent sans mesures CPU/mémoire ; node0 perd temporairement les deux mesures de10 à14. Aucune mesure GPU n’est produite, même sur node26 avec sept GPU alloués. L’interruption réseau et la boucle de60s restent identiques. Les IDs de jobs changent d’occurrence via submittedAt à chaque cycle.

## Activité vivante (défaut)

Le nouveau scénario `lively` utilise le même profil fourni, avec moteur d’arrivées/allocation déterministe, 100 utilisateurs déclarés et cadence d’une seconde au temps ×10. Les exemples simples décrits ci-dessus restent disponibles. Vagues sur deux minutes, backfill par ressources libres, identités uniques et fenêtre terminale bornée : [simulation vivante](simulation-vivante.md). Les exemples `lively-peak.json` et `lively-calm.json` sont générés avec les autres snapshots.

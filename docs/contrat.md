# Contrat partagé v3

Schéma exécutable : `packages/contracts/index.ts`. Simulateur et client importent ce même module, indépendant du scheduler, de React et de Three.js. Chaque message est un snapshot complet JSON, jamais un delta. Les exemples dans `fixtures/scenarios/examples` sont générés par `npm run examples`.

## Enveloppe

`version: 3`, `cluster: {id,name}`, `stream: {epoch}`, `sequence` entier croissant dans la portée `(cluster.id, epoch)`, `observedAt` ISO UTC réel, `clock: {mode:"simulated",now,rate}`, `units`, `topology`, `state`.

`rate` est un multiplicateur réel fini positif ≤60 (1 dans les fixtures simples, 10 dans la vivante). Champs optionnels de présentation : `cycleSteps`, `cycleStep` (strictement inférieur au nombre de pas), `windowSeconds`, `phase`. Les anciens snapshots v3 à rate=1 restent acceptés. Le scénario vivant est une nouvelle clé distincte et nécessite le client actualisé.

Les temps de réservation/soumission utilisent `clock.now`, pas l’horloge réelle. La fraîcheur utilise `observedAt`. Les unités sont CPU logiques (`logical-cpu`), mémoire en Gio (`GiB`), GPU configurés (`device`), utilisation CPU en pourcentage de capacité du nœud (`percent-cpu-capacity`). Un pourcentage CPU n’est pas une mesure électrique.

## Nœuds et mesures

Un nœud contient identité stable, nom, `kind` (standard/memory/gpu/access), `cpus`, `memory`, `gpus`, `partitions` sans doublon, `status`, `usage` et éventuellement `memoryUsed`, `responding`, `capacityBasis`, `referenceState`.

- `status` : ready, maintenance, invalid ou down. Invalide et down ne sont pas ramenés à maintenance.
- `responding` : booléen ou null, optionnel. false empêche toute allocation/démarrage, quel que soit le statut.
- `usage` : pourcentage CPU 0–100 ou null. Champ obligatoire ; null signifie inconnu, zéro connu signifie mesure nulle.
- `memoryUsed` : mesure globale de mémoire utilisée au nœud en Gio, nombre fini 0–capacité ou null ; champ optionnel, absence équivalente à inconnu. Distincte de la mémoire allouée.
- Aucune mesure GPU ni consommation individuelle par job n’est fournie ; ne pas les déduire des allocations.
- `capacityBasis` : source-exact ou representative, optionnel. Dans le profil fourni, les minima hétérogènes servent à des capacités de travail représentatives fictives, pas à une déclaration de matériel exact.
- `referenceState: {scheduler,responding}` conserve l’état source statique idle/alloc/mix/inval/down. Il n’est pas un suivi réel et ne remplace pas l’état courant simulé.

Le serveur d’accès éventuel est de type access et sans capacité calcul/partition. Le centre logique facultatif est dans `topology.communication`, pas dans les nœuds : aucune ressource, allocation ou réservation ne peut le référencer.

## Partitions et référence fournie

Partitions : `id`, `name`, `limitHours` (heures ou null), `limitUnlimited` optionnel, `isDefault` optionnel. Une durée null exige `limitUnlimited: true`. Les IDs ne contiennent pas l’astérisque de présentation du scheduler.

`reference` optionnelle conserve le résumé fourni : `memberships`, `cpus`, `cpuMinimum`, `memoryMiB`, `memoryMinimum`, `gpus`. Ces champs ne sont pas additionnés pour produire une capacité globale réelle. Le suffixe + source est représenté par le drapeau minimum. La conversion Mio→Gio divise par 1024. `topology.referenceNotice` explique la provenance statique et la séparation de l’activité simulée.

Un nœud peut appartenir à plusieurs partitions. Le profil fourni actuel a des appartenances disjointes ; le contrat ne généralise pas cette propriété. Les utilisateurs sont des identifiants fictifs uniques dans le cluster.

## Jobs, allocations, réservations

Job : `id`, `name`, `user`, `partition` de soumission, `status` running/queued/finished/failed, `waitingReason` nullable, `request: {cpus,memory,gpus,nodeCount}`, `allocations`, `submittedAt` optionnel.

La demande exprime des ressources par nœud ; le total est multiplié par nodeCount. Un job running possède une allocation pour chaque nœud demandé ; aucune duplication de nodeId. Les autres statuts n’allouent aucune ressource. Une allocation contient `nodeId`, `cpus`, `memory`, `gpus`. Plusieurs nœuds représentent une tâche multi-nœuds. Aucun script, commande interne ou historique d’allocation n’est ajouté.

Réservation : `id`, `jobId`, `startsAt`, `endsAt`, `status` planned/active/finished, `allocations`. Intervalle semi-ouvert `[début, fin[`, état cohérent avec l’horloge simulée. Planned : job queued ; active : job queued ou running ; finished : job non running. L’ouverture du créneau ne garantit pas l’exécution. Si le job utilise le créneau actif, les ressources doivent correspondre exactement et ne sont comptées qu’une fois. Sinon la réservation active protège la capacité sans devenir une allocation ou une mesure.

## Validation

Types, unités, dates, version et bornes ; IDs uniques ; références utilisateur/partition/nœud ; compatibilité partition de soumission/nœud ; demande/allocation cohérentes ; pas d’allocation sur accès, centre logique, maintenance, invalid, down ou non répondant. Sommes CPU/mémoire/GPU des allocations et réservations actives inutilisées ≤ capacité de chaque nœud. Réservations simultanées vérifiées à leurs frontières ; deux créneaux simultanés pour le même job sont rejetés. Mesure mémoire ≤ capacité représentée, soumission ≤ temps simulé, motif d’attente absent hors queued.

La planification future ne projette pas les allocations présentes sans dates de fin. Le producteur doit publier un état cohérent à l’activation. Un snapshot invalide est rejeté en totalité. Les champs supplémentaires sont ignorés ; une évolution incompatible exige un nouveau numéro majeur.

## Agrégation et représentation

Chaque identité de nœud compte une seule fois dans le total global, hors accès et centre logique. Les capacités des partitions partagées ne s’additionnent pas. Le compteur de jobs est celui de la partition de soumission ; la barre d’allocation d’une partition décrit les ressources physiques des nœuds accessibles, y compris les autres jobs partageant ces nœuds.

Moyenne CPU sur les seules mesures connues, avec compteur d’inconnus, sans pondération par capacité. Un remplissage de silo utilise seulement memoryUsed/memory ; une réservation ne le remplit pas. L’allocation GPU ne prouve aucune utilisation GPU mesurée.

## Ordre, reconnexion, fraîcheur et suivi

Une époque opaque par démarrage producteur ; nouvelle époque autorise une séquence repartant à zéro. Une époque retirée, une séquence ancienne/égale ou un autre cluster est ignoré. Une erreur de validation ne modifie pas l’ordre accepté. Reconnexion après 1,5 seconde ; réception d’un état complet courant, sans replay de deltas. Changer de cluster réinitialise la sélection/recherche/filtre.

Après 6 secondes sans observation fraîche, les données sont périmées et le dernier état reste affiché. Les effets d’activité se figent. En production il faudrait synchroniser les horloges, authentifier le producteur et gérer la dérive ; ces fonctions ne sont pas simulées comme garanties existantes.

Identité suivie : cluster, époque, ID de job et submittedAt. Les fixtures simples réutilisent les IDs courts au cycle suivant avec une nouvelle soumission ; le suivi se fige plutôt que de se rattacher au nouveau job. Sans submittedAt, le producteur doit garantir l’unicité de l’ID par époque. Un job disparu reste affiché comme dernière observation, état actuel inconnu.

## Évolution et commandes futures

V3 remplace v2 à cause des états invalid/down et des durées illimitées nullable. Client et producteur ont été mis à jour ensemble, anciennes versions rejetées. memoryUsed, responding, referenceState et métadonnées de source sont explicités ci-dessus. Les notes v2/Cluster31 des anciens comptes rendus sont historiques.

Aucune commande n’est envoyée. Un futur canal devra séparer demande identifiée/idempotente, accusé de réception, exécution et résultat. Un état observé ou une socket ouverte ne prouve jamais le succès d’une demande. Authentification, autorisations et audit seraient nécessaires avant toute action réelle.

Le scénario vivant emploie des identifiants de jobs uniques dans l’époque, sans réutilisation à la frontière de vague. Les jobs actifs sont exhaustifs ; les 160 états terminaux les plus récents restent dans la fenêtre. Un suivi ouvert conserve sa dernière observation, y compris terminale, après sortie de cette fenêtre.

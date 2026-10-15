# Activité vivante simulée

Scénario `lively`, sélectionné par défaut. La topologie, les 30 noms, les sept appartenances, les capacités de travail représentatives et les limites fournies sont repris sans modification du profil simple. Les états de référence restent statiques et séparés des états courants fictifs. Node10 invalide et node11 down/non répondant ne reçoivent jamais d’allocation. Node26 reste l’unique nœud GPU avec sept dispositifs.

## Rythme

Un snapshot par seconde réelle ; dix secondes simulées par seconde réelle. Les vagues d’arrivées suivent une période de 120 pas (deux minutes réelles, vingt minutes simulées). Phase et multiplicateur sont affichés. La fenêtre de frise s’adapte ; ce scénario ne prédit pas de réservations ni d’heure de démarrage : sa frise reste vide. Les exemples simples conservent leur cadence de deux secondes, leur temps ×1, leurs réservations et leurs cycles de 60 secondes.

- Normal : deux vagues principales, demandes CPU/mémoire et jobs multi-nœuds, puis fond léger pendant l’accalmie.
- Short : rafales courtes, contraintes CPU ou mémoire, résorption rapide.
- Long : peu d’arrivées mais durées plus longues, souvent un job en fond.
- Highmem/supermem : demandes de 192 à 896 Gio par nœud, charge CPU relativement faible et pression mémoire distincte.
- GPU : vagues de demandes de 1, 2, 4 ou 7 GPU, contraintes réelles du nœud simulé.
- Global : un petit job intermittent ; cette faible activité est un choix de démonstration, pas une propriété du cluster réel.

Les jobs courants durent généralement 2–11 pas sur short/normal, davantage pour certains utilisateurs récurrents, 10–19 pas en grande mémoire et 28–44 pas sur long. Ce sont des durées de démonstration, toujours très inférieures aux limites de partition fournies. Les phases ne synchronisent pas les fins : chaque démarrage fixe la fin selon la durée propre du job.

## Population et allocation

100 identités fictives déclarées ; les identités 001–080 produisent des jobs, 081–100 restent inactives. Un utilisateur peut avoir plusieurs jobs et plusieurs partitions. Chercheur-001 fournit notamment un calcul normal multi-nœuds, une analyse courte et un lot GPU récurrents pour tester les relations utilisateur. Le nombre actif affiché déduplique les utilisateurs ayant un job queued ou running ; il n’est pas le nombre de personnes connectées.

Arrivées et demandes sont reproductibles par identifiant et pas, sans hasard global. Le moteur essaie les anciens jobs en premier et laisse passer des demandes compatibles si une grosse demande est bloquée (backfill simple, sans promesse d’équité ni FIFO). Un job ne commence que si tous ses nœuds peuvent fournir simultanément CPU, mémoire et GPU. Les ressources sont soustraites dès le démarrage et libérées avant le placement au pas de fin. Un pending ne reçoit aucune affectation anticipée. Motifs : CPU, mémoire, GPU alloués, ou fragmentation des capacités compatibles par nœud.

Aucune surallocation, aucune attribution aux nœuds invalides/down. Les demandes sont hétérogènes et ne dérivent pas des mesures. Les mesures CPU synthétiques sont calculées comme fractions d’utilisation des CPU alloués, rapportées à la capacité du nœud ; la RAM utilisée est une fraction de la RAM allouée. Zéro à vide, null pour indisponibilité et une brève perte CPU de node0. Certains jobs CPU intensifs atteignent effectivement 100 % mesurés ; des jobs mémoire peuvent approcher la capacité RAM en consommant peu de CPU. Les GPU restent sans mesure d’activité inventée. Allocation complète, forte mesure et longue file sont trois faits distincts.

## Identité et fenêtre

Les IDs v1-…, v2-… incluent le numéro de vague et un numéro de soumission monotone ; `submittedAt` ne change pas pendant le job. Une frontière de vague ne supprime ni les jobs actifs ni les files. Les arrivées varient selon les identifiants, donc les détails changent d’une vague à l’autre tout en restant déterministes.

Tous les jobs queued/running restent dans les snapshots. Les 160 jobs terminés/échoués les plus récents sont conservés ; ce n’est pas un historique complet. La recherche annonce cette portée. Le suivi ouvert retient sa dernière observation après éviction, et ne réassocie jamais automatiquement une occurrence après redémarrage. La fraîcheur reste mesurée en secondes réelles ; l’accélération ne l’affecte pas. Une coupure réseau de huit secondes est prévue pendant l’accalmie (pas 104–111), sans rejouer les événements manqués.

## Limites

Ordonnanceur pédagogique, sans priorités Slurm, fair-share, délai d’E/S, préemption, prédiction ni soumission réelle. Pas de calibrage sur une charge de production. Le générateur conserve un état borné et sait reconstruire une séquence par rejeu déterministe ; un accès direct à une séquence très lointaine coûte un rejeu depuis zéro. La visualisation conserve son plafond de 18 agents (10 en petit canevas), deux par nœud, huit capsules par zone puis lots ; les listes de jobs actifs restent complètes.

Tests sur trois périodes complètes : 100 utilisateurs déclarés, 80 rencontrés, maximum 49 actifs distincts, 37 jobs en cours et 37 en attente, au plus 232 jobs dans la fenêtre observée. Ces nombres décrivent les trois premières périodes et ne constituent pas une garantie de performance ou de maxima pour toutes les périodes futures.

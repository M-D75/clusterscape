# Profil fourni — 30 nœuds, sept partitions

Ce relevé utilisateur est une **référence statique**, sans date d’observation fournie et sans interrogation du cluster. Il remplace l’hypothèse antérieure de 31 nœuds `node00…`. La liste détaillée établit 30 identités distinctes : node0 à node31 sauf node6 et node19. Les appartenances sont disjointes dans ce relevé ; le modèle reste plusieurs-à-plusieurs.

| Partition | Nœuds et états du relevé | Nombre | Limite |
| --- | --- | ---: | --- |
| long | node10 inval ; node12,node13,node22,node23 idle | 5 | 45 jours |
| short | node18 mix ; node3,node14,node15,node16 idle | 5 | 1 jour |
| normal (défaut) | node11 down* ; node4,node8,node9,node17,node20,node24 mix ; node0,node1,node5,node7,node21,node27 alloc | 13 | 14 jours |
| supermem | node2 mix ; node25 idle | 2 | 14 jours |
| global | node31 mix | 1 | illimitée |
| highmem | node30 mix ; node28,node29 idle | 3 | 45 jours |
| gpu | node26 alloc | 1 | 21 jours |

`*` sur normal marque la partition par défaut et ne fait pas partie du nom. `down*` combine état down et drapeau non répondant ; il ne signifie pas maintenance. `inval` est aussi distinct de la maintenance. L’unique nœud GPU est node26 ; `gpu:7` signifie sept GPU configurés sur ce nœud, pas sept nœuds.

## Capacités de référence

| Partition | CPU par nœud | Mémoire par nœud (Mio) | GPU configurés |
| --- | ---: | ---: | ---: |
| long | ≥12 | ≥48255 | 0 |
| short | ≥12 | ≥64355 | 0 |
| normal | ≥12 | ≥48255 | 0 |
| supermem | ≥40 | ≥1031771 | 0 |
| global | 112 | 513930 | 0 |
| highmem | 112 | ≥514443 | 0 |
| gpu | 24 | 192045 | 7 |

Le suffixe `+` indique un minimum parmi des configurations hétérogènes. Il ne permet pas d’attribuer ce minimum exactement à chaque nœud ni de calculer une capacité totale réelle. Conversion : 1024 Mio = 1 Gio. Node31 et node26 conservent exactement les CPU/RAM fournis, convertis sans arrondi dans les données ; l’affichage peut arrondir à deux décimales.

## Capacités de travail et activité synthétiques

Pour vérifier la cohérence d’une simulation, les autres nœuds reçoivent un profil **représentatif fictif ≥ minima** : CPU minimum du groupe ; mémoire arrondie à une puissance de deux supérieure en Gio. Quelques variantes dans normal illustrent les différences : node0 24 CPU/128 Gio, node1 48 CPU/256 Gio, node4 12 CPU/128 Gio. Elles ne sont pas déclarées comme configurations réelles. Les totaux représentés (876 CPU, environ 6065,43 Gio) sont ceux de cette hypothèse de travail, pas des totaux matériels observés.

À l’instant initial du cycle, les jobs synthétiques remplissent les CPU des nœuds source alloc, n’occupent qu’une partie de ceux source mix et ne sont pas placés sur les idle, inval ou down. La mémoire allouée est distincte de sa mesure synthétique ; une allocation complète CPU n’implique pas mémoire pleine ni CPU mesuré à 100%.

Les états du relevé restent dans `referenceState`. Le scénario évolutif les distingue de l’état courant simulé : node3, idle dans le relevé, passe par une maintenance simulée à 28–40 s. Node10 inval et node11 down/non répondant restent inéligibles aux allocations. Les jobs t1/t2 finissent, t9 réserve puis utilise node0 à 16–24 s, t10 démarre sur node3 à 40 s et finit à 56 s. T3 est multi-nœuds (node4/node8), t8 alloue les sept GPU de node26, t18 est un échec fictif. Aucun ID de job réel n’est déduit du relevé.

Configuration : `fixtures/scenarios/slurm-summary.ts` contient le résumé fourni ; `source30-config.ts` contient noms/états et variantes de simulation ; `source30.ts` produit la chronologie. Les anciennes fixtures Cluster31 sont conservées comme texte d’archive, sans profil actif ni noms ajoutés au relevé fidèle.

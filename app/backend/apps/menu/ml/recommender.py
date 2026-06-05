from collections import defaultdict
from itertools import combinations


def compute_similarities(command_lines):
    """Build a simple co-occurrence map from order lines.

    The input is expected to be an iterable of dicts containing at least
    ``commande_id`` and ``plat_id`` keys, as returned by ``values()`` on
    ``CommandeLigne``.
    """

    commandes = defaultdict(set)
    for line in command_lines:
        commande_id = line.get('commande_id')
        plat_id = line.get('plat_id')
        if commande_id is None or plat_id is None:
            continue
        commandes[commande_id].add(plat_id)

    similarities = defaultdict(lambda: defaultdict(int))
    for plats in commandes.values():
        if len(plats) < 2:
            continue
        for plat_a, plat_b in combinations(sorted(plats), 2):
            similarities[plat_a][plat_b] += 1
            similarities[plat_b][plat_a] += 1

    return {plat_id: dict(neighbors) for plat_id, neighbors in similarities.items()}

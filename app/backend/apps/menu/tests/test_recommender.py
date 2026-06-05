from apps.menu.ml.recommender import compute_similarities


def test_compute_similarities_builds_symmetric_cooccurrence_map():
    data = [
        {'commande_id': 1, 'plat_id': 10, 'quantite': 2},
        {'commande_id': 1, 'plat_id': 20, 'quantite': 1},
        {'commande_id': 1, 'plat_id': 10, 'quantite': 1},
        {'commande_id': 2, 'plat_id': 10, 'quantite': 1},
        {'commande_id': 2, 'plat_id': 30, 'quantite': 1},
        {'commande_id': 3, 'plat_id': 40, 'quantite': 1},
    ]

    similarities = compute_similarities(data)

    assert similarities == {
        10: {20: 1, 30: 1},
        20: {10: 1},
        30: {10: 1},
    }

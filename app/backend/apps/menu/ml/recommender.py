import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

def compute_similarities(commande_lignes_data):
    if not commande_lignes_data:
        return {}
        
    df = pd.DataFrame(commande_lignes_data)
    
    if 'commande_id' not in df.columns or 'plat_id' not in df.columns or 'quantite' not in df.columns:
        return {}
        
    if df['plat_id'].nunique() < 2:
        return {}
        
    matrix = df.pivot_table(index='commande_id', columns='plat_id', values='quantite', fill_value=0)
    
    item_matrix = matrix.T
    
    n_components = min(10, item_matrix.shape[1], item_matrix.shape[0]) - 1
    if n_components < 1:
        sim_matrix = cosine_similarity(item_matrix)
    else:
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        item_factors = svd.fit_transform(item_matrix)
        sim_matrix = cosine_similarity(item_factors)
        
    plats = item_matrix.index.tolist()
    
    similarities = {}
    for i, plat_id in enumerate(plats):
        sim_scores = sim_matrix[i]
        similar_indices = sim_scores.argsort()[::-1]
        
        # Exclude itself
        similar_plats = [plats[idx] for idx in similar_indices if idx != i]
        
        # Keep top 5
        similarities[plat_id] = similar_plats[:5]
        
    return similarities

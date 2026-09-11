from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from backend.ingestion.srishti_reference_data import get_lulc_change_stats

def run_lulc_clustering() -> List[Dict[str, Any]]:
    """
    Performs unsupervised K-Means clustering (k=3) on the 11 real LULC classes
    for the Srikakulam IWMP-24 Chinnagora AOI obtained from get_lulc_change_stats().

    Features: [t0_area_sqkm, t1_area_sqkm, change_pct] (Standardized via StandardScaler)

    Clusters are dynamically labeled as 'declining', 'stable', and 'expanding' based on
    the sorted mean change_pct values of each cluster's member classes.
    """
    stats = get_lulc_change_stats()
    changes = stats.get("changes", [])

    if not changes:
        return []

    # Prepare feature matrix: [t0_area_sqkm, t1_area_sqkm, change_pct]
    features = []
    for item in changes:
        features.append([
            float(item.get("t0_area_sqkm", 0.0)),
            float(item.get("t1_area_sqkm", 0.0)),
            float(item.get("change_pct", 0.0))
        ])

    X = np.array(features)

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Run K-Means with k=3
    k = 3
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_indices = kmeans.fit_predict(X_scaled)

    # Calculate average change_pct for each cluster to rank them dynamically
    cluster_mean_changes = {}
    for cluster_id in range(k):
        member_indices = np.where(cluster_indices == cluster_id)[0]
        if len(member_indices) > 0:
            avg_change = np.mean([changes[idx]["change_pct"] for idx in member_indices])
        else:
            avg_change = 0.0
        cluster_mean_changes[cluster_id] = avg_change

    # Sort cluster IDs by average change_pct ascending: lowest -> declining, mid -> stable, highest -> expanding
    sorted_cluster_ids = sorted(cluster_mean_changes.keys(), key=lambda cid: cluster_mean_changes[cid])
    
    label_names = ["declining", "stable", "expanding"]
    cluster_to_label = {
        cid: label_names[rank] for rank, cid in enumerate(sorted_cluster_ids)
    }

    # Format result structure for all 11 classes
    results = []
    for idx, item in enumerate(changes):
        cid = cluster_indices[idx]
        assigned_label = cluster_to_label[cid]
        results.append({
            "class": item["class"],
            "cluster_label": assigned_label,
            "change_pct": item["change_pct"],
            "t0_area_sqkm": item["t0_area_sqkm"],
            "t1_area_sqkm": item["t1_area_sqkm"],
            "change_sqkm": item["change_sqkm"],
            "cluster_id": int(cid)
        })

    return results

if __name__ == "__main__":
    clusters = run_lulc_clustering()
    print(f"LULC Clustering Results (Total Classes: {len(clusters)}):")
    for c in sorted(clusters, key=lambda x: x["change_pct"], reverse=True):
        print(f"  * {c['class']:<30} | {c['cluster_label']:<10} | Change: {c['change_pct']:>6.2f}% ({c['change_sqkm']:>6.2f} km²)")

import pytest
from backend.ml.lulc_clustering import run_lulc_clustering

def test_lulc_clustering_returns_three_distinct_labels_for_all_11_classes():
    """
    Test asserting that K-Means unsupervised clustering on the real Bhuvan LULC data:
    1. Returns all 11 classes for the Chinnagora AOI.
    2. Groups classes into exactly 3 distinct cluster labels ('declining', 'stable', 'expanding').
    3. Every class has valid cluster_label and numeric change_pct.
    """
    results = run_lulc_clustering()

    # Must return all 11 classes
    assert isinstance(results, list), "Clustering result must be a list"
    assert len(results) == 11, f"Expected exactly 11 classes, got {len(results)}"

    # Check structure of returned objects
    for item in results:
        assert "class" in item and len(item["class"]) > 0
        assert "cluster_label" in item
        assert "change_pct" in item
        assert isinstance(item["change_pct"], (int, float))
        assert item["cluster_label"] in {"declining", "stable", "expanding"}

    # Exactly 3 distinct cluster labels must be present across the dataset
    distinct_labels = {item["cluster_label"] for item in results}
    assert distinct_labels == {"declining", "stable", "expanding"}, (
        f"Expected exactly 3 distinct cluster labels ('declining', 'stable', 'expanding'), got {distinct_labels}"
    )

    # Validate that expanding classes have higher average change_pct than declining classes
    declining_pcts = [item["change_pct"] for item in results if item["cluster_label"] == "declining"]
    expanding_pcts = [item["change_pct"] for item in results if item["cluster_label"] == "expanding"]

    assert len(declining_pcts) > 0, "Expected at least 1 class in 'declining' cluster"
    assert len(expanding_pcts) > 0, "Expected at least 1 class in 'expanding' cluster"
    assert max(declining_pcts) < min(expanding_pcts) or sum(declining_pcts)/len(declining_pcts) < sum(expanding_pcts)/len(expanding_pcts), (
        "Expanding cluster should have higher mean change_pct than declining cluster"
    )

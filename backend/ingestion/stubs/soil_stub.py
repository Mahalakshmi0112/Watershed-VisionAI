from typing import Dict, Any

class SoilDataIngestionStub:
    """
    Pluggable interface for SoilGrids / NBSS&LUP soil texture, slope, and organic carbon data.
    Future extension: Source 4.
    """
    def fetch(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch static soil properties for a structure location."""
        return {
            "latitude": lat,
            "longitude": lon,
            "soil_type": "Clay Loam",
            "organic_carbon_g_kg": 12.5,
            "slope_percentage": 4.2,
            "source": "SoilGrids_Stub"
        }

    def validate(self, data: Dict[str, Any]) -> bool:
        return "soil_type" in data and "slope_percentage" in data

    def persist(self, db_session, data: Dict[str, Any]) -> bool:
        return True

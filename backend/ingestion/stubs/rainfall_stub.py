from typing import Dict, Any, List
import datetime

class RainfallDataIngestionStub:
    """
    Pluggable interface for ingesting gridded rainfall data from IMD (India Meteorological Dept) or ERA5 via GEE.
    Future extension: Source 4.
    """
    def __init__(self, source_name: str = "IMD_Gridded"):
        self.source_name = source_name

    def fetch(self, lat: float, lon: float, start_date: datetime.date, end_date: datetime.date) -> List[Dict[str, Any]]:
        """Fetch daily rainfall mm for given bounding coordinates."""
        # Stub implementation returning baseline historical daily rainfall
        days = (end_date - start_date).days + 1
        return [
            {
                "date": (start_date + datetime.timedelta(days=i)).isoformat(),
                "rainfall_mm": round(5.0 + (i % 7) * 2.5, 2),
                "source": self.source_name
            }
            for i in range(days)
        ]

    def validate(self, records: List[Dict[str, Any]]) -> bool:
        return all("rainfall_mm" in r and r["rainfall_mm"] >= 0 for r in records)

    def normalize(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return records

    def persist(self, db_session, records: List[Dict[str, Any]]) -> int:
        # Stub persist action
        return len(records)

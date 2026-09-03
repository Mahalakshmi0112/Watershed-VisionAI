export type PriorityTier = 'Healthy' | 'Monitor' | 'Urgent';
export type UserRole = 'officer' | 'admin';

export interface StructureSummary {
  id: number;
  code: string;
  name: string;
  structure_type: string;
  watershed_name: string;
  latitude: number;
  longitude: number;
  construction_year: number;
  is_synthetic: boolean;  // CRITICAL REQUIREMENT: Returned on list endpoint
  composite_score: number;
  priority_tier: PriorityTier;
  updated_at: string;
}

export interface SatelliteObservation {
  id: number;
  observation_date: string;
  ndvi: number;
  ndwi: number;
  data_source: 'real' | 'synthetic';
}

export interface FieldPhoto {
  id: number;
  photo_url: string;
  gradcam_url: string;
  captured_at: string;
  predicted_type: string;
  predicted_condition: string;
  condition_score: number;
}

export interface StructureDetail extends StructureSummary {
  scores: {
    condition_score: number;
    satellite_trend_risk: number;
    forecast_risk: number;
    composite_score: number;
    priority_tier: PriorityTier;
  };
  summary_report: string;
  satellite_series: SatelliteObservation[];
  photos: FieldPhoto[];
}

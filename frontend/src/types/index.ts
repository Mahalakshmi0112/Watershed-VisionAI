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

export interface ThematicLayerResponse {
  layer_name: string;
  wms_layer: string;
  source: 'live' | 'cached_fallback';
  data_source: string;
  data_provenance: string;
  bbox: [number, number, number, number];
  content_type: string;
  image_base64: string;
  image_url: string;
}

export interface LulcChangeItem {
  class: string;
  t0_area_sqkm: number;
  t1_area_sqkm: number;
  change_sqkm: number;
  change_pct: number;
}

export interface LulcChangeResponse {
  data_provenance: string;
  source: 'live' | 'cached_fallback';
  data_source: {
    '2005_06': string;
    '2018_19': string;
    [key: string]: string;
  };
  t0_year: string;
  t1_year: string;
  changes: LulcChangeItem[];
  raw_data?: Record<string, any>;
}

export interface LulcClusterItem {
  class: string;
  cluster_label: 'expanding' | 'stable' | 'declining';
  change_pct: number;
  t0_area_sqkm?: number;
  t1_area_sqkm?: number;
  change_sqkm?: number;
  cluster_id?: number;
}

export interface LulcClusterResponse {
  data_provenance: string;
  clusters: LulcClusterItem[];
  total_classes: number;
}




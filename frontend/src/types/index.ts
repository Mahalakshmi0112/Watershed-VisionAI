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

// ──────────────────────────────────────────────────────────────
//  Secondary Evidence — Cauvery / Trichy Types
// ──────────────────────────────────────────────────────────────

export interface WbisCategory {
  area_code: string;
  category_label: string;
  total_water_bodies: number;
  current_water_bodies: number;
  total_max_area_sqkm: number;
  current_actual_area_sqkm: number;
  current_max_area_sqkm: number;
  capacity_utilization_pct: number;
  month: string;
}

export interface WbisResponse {
  basin: string;
  month: string;
  source: 'live' | 'cached_fallback';
  data_provenance: string;
  total_water_bodies: number;
  current_water_bodies: number;
  water_bodies_active_pct: number;
  total_max_area_sqkm: number;
  current_actual_area_sqkm: number;
  overall_capacity_utilization_pct: number;
  categories: WbisCategory[];
  raw_response?: any[];
}

export interface TnLulcClass {
  class_name: string;
  color: string;
  area_sqkm: number;
  percent_of_total: number;
}

export interface TnLulcResponse {
  state_code: string;
  year: string;
  title: string;
  total_area_sqkm: number;
  classes: TnLulcClass[];
  top_classes: TnLulcClass[];
  total_classes_count: number;
  chart_image_base64?: string;
  chart_url: string;
  stats_url: string;
  chart_error?: string;
  stats_error?: string;
  data_provenance: string;
  source: string;
}

export interface CvPredictionOutput {
  predicted_type: string;
  type_confidence_pct: number;
  type_probabilities: Record<string, number>;
  predicted_condition: string;
  condition_confidence_pct: number;
  condition_probabilities: Record<string, number>;
  condition_score: number;
  expected_condition_score: number;
}

export interface DrishtiSampleResponse {
  title: string;
  filename: string;
  source_url: string;
  data_provenance: string;
  is_synthetic: boolean;
  is_genuine_nrsc_field_asset: boolean;
  taxonomy_breakdown: Record<string, string>;
  file_size_bytes: number;
  perceptual_hash: string;
  cv_prediction: CvPredictionOutput;
  photo_url: string;
  gradcam_url: string;
}

export interface TrichyPhotoItem {
  id: string;
  title: string;
  filename: string;
  original_upload_name: string;
  latitude: number;
  longitude: number;
  location_name: string;
  captured_at: string;
  structure_context: string;
  data_provenance: string;
  is_synthetic: boolean;
  perceptual_hash: string;
  cv_prediction: CvPredictionOutput;
  photo_url: string;
  gradcam_url: string;
}

export interface TrichyPhotosResponse {
  region: string;
  data_provenance: string;
  total_photos: number;
  photos: TrichyPhotoItem[];
}

export interface SecondaryEvidenceSummary {
  region: string;
  wbis_water_spread: WbisResponse;
  tn_lulc: TnLulcResponse;
  drishti_sample: DrishtiSampleResponse;
  trichy_field_photos: TrichyPhotoItem[];
  total_trichy_photos: number;
  data_provenance_summary: Record<string, string>;
}




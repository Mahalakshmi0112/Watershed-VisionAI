export type Language = 'en' | 'ta';

export interface Translations {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const translations: Translations = {
  // Brand & Navigation
  'app.title': {
    en: 'WatershedVision AI',
    ta: 'வாட்டர்ஷெட்விஷன் AI'
  },
  'app.subtitle': {
    en: 'AI Monitor',
    ta: 'AI கண்காணிப்பு'
  },
  'nav.overview': {
    en: 'Overview',
    ta: 'மேலோட்டம்'
  },
  'nav.map_view': {
    en: 'Map View',
    ta: 'வரைபடக் காட்சி'
  },
  'nav.alerts': {
    en: 'Predictions & Alerts',
    ta: 'முன்னறிவிப்புகள் & எச்சரிக்கைகள்'
  },
  'nav.watershed_validation': {
    en: 'Watershed Validation',
    ta: 'நீர்ப்பிடிப்பு சரிபார்ப்பு'
  },
  'nav.secondary_evidence': {
    en: 'Cauvery/Trichy Evidence',
    ta: 'காவிரி/திருச்சி சான்றுகள்'
  },
  'nav.inspect': {
    en: 'Inspect',
    ta: 'ஆய்வு செய்'
  },
  'nav.back_to_map': {
    en: '← Back to Map View',
    ta: '← வரைபடக் காட்சிக்குத் திரும்பு'
  },
  'theme.light_mode': {
    en: 'Light Mode',
    ta: 'வெளிச்சப் பயன்முறை'
  },
  'theme.dark_mode': {
    en: 'Dark Mode',
    ta: 'இருண்ட பயன்முறை'
  },
  'role.viewing_as': {
    en: 'Viewing as',
    ta: 'பார்வையாளர் நிலை'
  },
  'role.admin': {
    en: 'Admin',
    ta: 'நிர்வாகி'
  },
  'role.field_officer': {
    en: 'Field Officer',
    ta: 'கள அதிகாரி'
  },
  'role.switch': {
    en: 'Switch',
    ta: 'மாற்று'
  },
  'demo.mode_notice': {
    en: 'Demo mode — synthetic satellite data active (GEE not configured)',
    ta: 'டெமோ முறை — செயற்கைக்கோள் மாதிரி தரவு பயன்பாட்டில் உள்ளது'
  },
  'lang.toggle': {
    en: 'தமிழ்',
    ta: 'English'
  },
  'lang.current': {
    en: 'English',
    ta: 'தமிழ்'
  },

  // Overview Page
  'overview.title': {
    en: 'Watershed Executive Dashboard',
    ta: 'நீர்ப்பிடிப்பு நிர்வாக கட்டுப்பாட்டு அறை'
  },
  'overview.subtitle': {
    en: 'Real-time condition monitoring, failure risk forecasting, and priority inspection queues for rural check dams and bunds.',
    ta: 'கிராமப்புற தடுப்பணைகள் மற்றும் வரப்புகளுக்கான நேரடி நிலை கண்காணிப்பு, கட்டமைப்பு தோல்வி முன்னறிவிப்பு மற்றும் முன்னுரிமை ஆய்வுகள்.'
  },
  'overview.demo_chip': {
    en: 'Demo — Synthetic satellite data',
    ta: 'டெமோ — மாதிரி செயற்கைக்கோள் தரவு'
  },
  'overview.total_structures': {
    en: 'Total Structures',
    ta: 'மொத்த கட்டமைப்புகள்'
  },
  'overview.healthy': {
    en: 'Healthy',
    ta: 'நல்ல நிலை (ஆரோக்கியம்)'
  },
  'overview.monitor_needed': {
    en: 'Monitor Needed',
    ta: 'கண்காணிப்பு தேவை'
  },
  'overview.urgent_action': {
    en: 'Urgent Action',
    ta: 'அவசர நடவடிக்கை தேவை'
  },
  'overview.priority_split_title': {
    en: 'Structure Priority Tier Split',
    ta: 'கட்டமைப்பு முன்னுரிமைப் பிரிவு பங்கீடு'
  },
  'overview.high_priority_targets': {
    en: 'High Priority Inspection Targets',
    ta: 'உயர் முன்னுரிமை கள ஆய்வு இலக்குகள்'
  },
  'overview.score': {
    en: 'Score',
    ta: 'மதிப்பெண்'
  },
  'overview.ml_models_active': {
    en: 'ML Models Active: Dual-Head ResNet18 (CV) + XGBoost Degradation Forecaster',
    ta: 'செயலில் உள்ள ML மாதிரிகள்: இரட்டை-தலை ResNet18 (CV) + XGBoost சிதைவு முன்னறிவிப்பாளர்'
  },
  'overview.open_gis_map': {
    en: 'Open Interactive GIS Map →',
    ta: 'ஊடாடும் GIS வரைபடத்தைத் திறக்கவும் →'
  },
  'overview.type': {
    en: 'Type',
    ta: 'வகை'
  },
  'overview.demo_data_badge': {
    en: 'Demo data',
    ta: 'மாதிரி தரவு'
  },

  // Predictions & Alerts Page
  'alerts.title': {
    en: 'Forward-Looking Failure Risk Predictions',
    ta: 'எதிர்கால கட்டமைப்பு தோல்வி இடர் முன்னறிவிப்புகள்'
  },
  'alerts.subtitle': {
    en: 'Predictive alerts produced by the trained XGBoost time-series degradation model, forecasting likely failure within 3–12 months.',
    ta: 'பயிற்சி பெற்ற XGBoost நேரத் தொடர் மாதிரி மூலம் 3-12 மாதங்களுக்குள் ஏற்படக்கூடிய சாத்தியமான சேதங்களின் முன்னறிவிப்பு எச்சரிக்கைகள்.'
  },
  'alerts.xgboost_active': {
    en: 'XGBoost Degradation Forecaster Active',
    ta: 'XGBoost சிதைவு முன்னறிவிப்பு மாதிரி செயல்பாட்டில் உள்ளது'
  },
  'alerts.features_desc': {
    en: 'Engineered features: NDVI/NDWI slope velocity, structural age, condition trend, soil slope, and climate stubs.',
    ta: 'உருவாக்கப்பட்ட பண்புகள்: NDVI/NDWI சரிவு வேகம், கட்டமைப்பின் வயது, நிலை மாற்ற போக்கு, மண் சாய்வு மற்றும் காலநிலை காரணிகள்.'
  },
  'alerts.feedback_loop': {
    en: 'Continuous Feedback Loop: Ground-truth inspection logs update model weights',
    ta: 'தொடர் பின்னூட்டம்: கள ஆய்வு பதிவுகள் மூலம் மாதிரி எடைகள் புதுப்பிக்கப்படுகின்றன'
  },
  'alerts.risk_alert': {
    en: 'Risk Alert',
    ta: 'இடர் எச்சரிக்கை'
  },
  'alerts.watershed': {
    en: 'Watershed',
    ta: 'நீர்ப்பிடிப்பு'
  },
  'alerts.age': {
    en: 'Age',
    ta: 'வயது'
  },
  'alerts.years': {
    en: 'years',
    ta: 'ஆண்டுகள்'
  },
  'alerts.ndvi_declining': {
    en: 'NDVI Declining (-0.08/mo)',
    ta: 'NDVI குறைகிறது (-0.08/மாதம்)'
  },
  'alerts.forecast_horizon': {
    en: 'Forecast Horizon: 3–6 Months',
    ta: 'முன்னறிவிப்பு காலவரம்பு: 3–6 மாதங்கள்'
  },
  'alerts.predicted_risk': {
    en: 'Predicted Failure Risk',
    ta: 'கணிக்கப்பட்ட தோல்வி ஆபத்து'
  },
  'alerts.investigate': {
    en: 'Investigate',
    ta: 'விசாரிக்கவும்'
  },

  // Map View Page
  'map.spatial_map_title': {
    en: 'Spatial Watershed Structure Map',
    ta: 'இடஞ்சார்ந்த நீர்ப்பிடிப்பு கட்டமைப்பு வரைபடம்'
  },
  'map.structures_loaded': {
    en: 'structures loaded',
    ta: 'கட்டமைப்புகள் ஏற்றப்பட்டன'
  },
  'map.demo_fallback': {
    en: 'Demo Fallback',
    ta: 'மாதிரி தரவு'
  },
  'map.view_details_gradcam': {
    en: 'View Full Structure Details & Grad-CAM →',
    ta: 'முழு விவரங்கள் & Grad-CAM ஐக் காண்க →'
  },
  'map.thematic_layers': {
    en: 'Thematic Layers',
    ta: 'கருப்பொருள் அடுக்குகள்'
  },
  'map.drainage_network_label': {
    en: 'Drainage Network',
    ta: 'வடிகால் பாதை அமைப்பு'
  },
  'map.land_use_label': {
    en: 'Land Use (LULC)',
    ta: 'நில பயன்பாடு (LULC)'
  },
  'map.lulc_btn': {
    en: 'Land Use Change (2005-06 vs 2018-19)',
    ta: 'நில பயன்பாட்டு மாற்றம் (2005-06 vs 2018-19)'
  },
  'map.focus_srikakulam': {
    en: 'Focus Srikakulam AOI',
    ta: 'ஸ்ரீகாகுளம் பகுதிக்குச் செல்'
  },
  'map.reset_view': {
    en: 'Reset Structures View',
    ta: 'கட்டமைப்புக் காட்சிக்கு மீட்டமை'
  },
  'map.largest_expansion': {
    en: 'Largest Expansion',
    ta: 'அதிகபட்ச விரிவாக்கம்'
  },
  'map.largest_reduction': {
    en: 'Largest Reduction',
    ta: 'அதிகபட்ச குறைவு'
  },
  'map.area_comparison': {
    en: 'Area Comparison by Class (Sorted by |Change|)',
    ta: 'வகை வாரியாக பரப்பளவு ஒப்பீடு (|மாற்றம்| வரிசைப்படுத்தப்பட்டது)'
  },
  'map.unit_sqkm': {
    en: 'Unit: Sq. Km',
    ta: 'அலகு: ச.கி.மீ'
  },
  'map.class_breakdown': {
    en: 'Class Breakdown & Statistics',
    ta: 'வகை விவரங்கள் & புள்ளிவிவரங்கள்'
  },
  'map.lulc_class': {
    en: 'LULC Class',
    ta: 'நில பயன்பாட்டு வகை'
  },
  'map.change': {
    en: 'Change',
    ta: 'மாற்றம்'
  },
  'map.pct_change': {
    en: '% Chg',
    ta: '% மாற்றம்'
  },
  'map.fetching_lulc': {
    en: 'Fetching LULC change statistics from Bhuvan...',
    ta: 'புவனில் இருந்து மாற்ற புள்ளிவிவரங்கள் பெறப்படுகின்றன...'
  },
  'map.data_provenance_label': {
    en: 'Data Provenance:',
    ta: 'தரவு மூலம்:'
  },
  'map.source_indicators_label': {
    en: 'Source Indicators:',
    ta: 'மூலக் குறிகாட்டிகள்:'
  },
  'map.area_2005': {
    en: '2005-06 Area',
    ta: '2005-06 பரப்பளவு'
  },
  'map.area_2018': {
    en: '2018-19 Area',
    ta: '2018-19 பரப்பளவு'
  },
  'map.title': {
    en: 'GIS Watershed Spatial Intelligence',
    ta: 'GIS நீர்ப்பிடிப்பு இடஞ்சார்ந்த நுண்ணறிவு'
  },
  'map.subtitle': {
    en: 'Interactive satellite telemetry, multi-spectral layers, and predictive deterioration heatmap.',
    ta: 'ஊடாடும் செயற்கைக்கோள் தொலை அளவியல், பன்முக நிறமாலை அடுக்குகள் மற்றும் முன்கணிப்பு வெப்ப வரைபடம்.'
  },
  'map.search_placeholder': {
    en: 'Search structures by name or code...',
    ta: 'பெயர் அல்லது குறியீடு மூலம் கட்டமைப்புகளைத் தேடுங்கள்...'
  },
  'map.all_types': {
    en: 'All Types',
    ta: 'அனைத்து வகைகள்'
  },
  'map.all_tiers': {
    en: 'All Tiers',
    ta: 'அனைத்து நிலைகள்'
  },
  'map.forecast_simulation': {
    en: 'Forecast Simulation (Months Ahead)',
    ta: 'முன்னறிவிப்பு உருவகப்படுத்துதல் (எதிர்கால மாதங்கள்)'
  },
  'map.now': {
    en: 'Now',
    ta: 'தற்போது'
  },
  'map.months': {
    en: 'Months',
    ta: 'மாதங்கள்'
  },
  'map.layers_toggle': {
    en: 'Thematic Layers (Srikakulam IWMP-24 Chinnagora)',
    ta: 'கருப்பொருள் அடுக்குகள் (ஸ்ரீகாகுளம் IWMP-24 சின்னகோரா)'
  },
  'map.drainage_network': {
    en: 'Drainage Line Network',
    ta: 'வடிகால் வடிகால் பாதை நெட்வொர்க்'
  },
  'map.lulc_raster': {
    en: 'LULC Land Classification Overlay',
    ta: 'LULC நில பயன்பாட்டு வகைப்பாடு அடுக்கு'
  },
  'map.srikakulam_aoi': {
    en: 'Jump to Srikakulam AOI',
    ta: 'ஸ்ரீகாகுளம் பகுதிக்குச் செல்'
  },
  'map.view_lulc_stats': {
    en: 'View LULC Change Analytics & Clusters',
    ta: 'LULC மாற்ற பகுப்பாய்வு & தொகுப்புகளைக் காண்க'
  },
  'map.structure_details': {
    en: 'Structure Details',
    ta: 'கட்டமைப்பு விவரங்கள்'
  },
  'map.composite_risk': {
    en: 'Composite Risk Score',
    ta: 'ஒருங்கிணைந்த இடர் மதிப்பீடு'
  },
  'map.physical_condition': {
    en: 'Physical Condition',
    ta: 'உடல் நிலை'
  },
  'map.satellite_trend': {
    en: 'Satellite Trend',
    ta: 'செயற்கைக்கோள் போக்கு'
  },
  'map.forecast_risk': {
    en: 'Forecast Risk',
    ta: 'முன்னறிவிப்பு ஆபத்து'
  },
  'map.view_full_report': {
    en: 'View Full Structure Report →',
    ta: 'முழு கட்டமைப்பு அறிக்கையைக் காண்க →'
  },
  'map.lulc_drawer_title': {
    en: 'Srikakulam IWMP-24 Chinnagora LULC Change (2015-16 to 2020-21)',
    ta: 'ஸ்ரீகாகுளம் IWMP-24 சின்னகோரா LULC நில பயன்பாட்டு மாற்றம் (2015-16 முதல் 2020-21 வரை)'
  },
  'map.lulc_net_expansion': {
    en: 'Net Expansion',
    ta: 'நிகர விரிவாக்கம்'
  },
  'map.lulc_net_depletion': {
    en: 'Net Depletion',
    ta: 'நிகர குறைவு'
  },
  'map.lulc_stable_area': {
    en: 'Stable Land Area',
    ta: 'நிலையான நிலப்பரப்பு'
  },
  'map.kmeans_clusters': {
    en: 'K-Means Clustering Analysis (k=3)',
    ta: 'K-Means கொத்தாக்கல் பகுப்பாய்வு (k=3)'
  },
  'map.kmeans_desc': {
    en: 'Unsupervised grouping of LULC classes by area magnitude and trajectory change percentage.',
    ta: 'பரப்பளவு மற்றும் மாற்ற சதவீதத்தின் அடிப்படையில் நில பயன்பாட்டு வகைகளின் மேற்பார்வையற்ற குழுவாக்கம்.'
  },
  'map.declining_classes': {
    en: 'Declining Trajectory',
    ta: 'குறையும் போக்கு'
  },
  'map.stable_classes': {
    en: 'Stable Trajectory',
    ta: 'நிலையான போக்கு'
  },
  'map.expanding_classes': {
    en: 'Expanding Trajectory',
    ta: 'விரிவடையும் போக்கு'
  },

  // Structure Detail Page
  'detail.back_button': {
    en: 'Back to Map',
    ta: 'வரைபடத்திற்குத் திரும்பு'
  },
  'detail.composite_priority_score': {
    en: 'Composite Priority Score',
    ta: 'ஒருங்கிணைந்த முன்னுரிமை இடர் மதிப்பீடு'
  },
  'detail.field_photo_title': {
    en: 'Field Photo & Grad-CAM Heatmap',
    ta: 'களப் புகைப்படம் & Grad-CAM வெப்ப வரைபடம்'
  },
  'detail.gradcam_on': {
    en: 'Grad-CAM ON',
    ta: 'Grad-CAM இயக்கத்தில்'
  },
  'detail.show_gradcam': {
    en: 'Show Grad-CAM',
    ta: 'Grad-CAM காட்டு'
  },
  'detail.predicted_class': {
    en: 'Predicted Class',
    ta: 'கணிக்கப்பட்ட வகை'
  },
  'detail.condition': {
    en: 'Condition',
    ta: 'நிலைமை'
  },
  'detail.condition_score': {
    en: 'Condition Score',
    ta: 'நிலை மதிப்பீடு'
  },
  'detail.officer_summary': {
    en: 'Field Officer Summary',
    ta: 'கள அதிகாரி அறிக்கைச் சுருக்கம்'
  },
  'detail.multi_criteria_title': {
    en: 'Multi-Criteria Score Decomposition',
    ta: 'பன்முக மதிப்பீட்டுப் பிரிவு பகுப்பாய்வு'
  },
  'detail.cv_damage_weight': {
    en: 'CV Structural Damage (45% weight)',
    ta: 'CV கட்டமைப்புச் சேதம் (45% எடை)'
  },
  'detail.sat_risk_weight': {
    en: 'Satellite Trend Risk (25% weight)',
    ta: 'செயற்கைக்கோள் போக்கு ஆபத்து (25% எடை)'
  },
  'detail.xgb_risk_weight': {
    en: 'XGBoost Forecast Failure Risk (30% weight)',
    ta: 'XGBoost தோல்வி முன்னறிவிப்பு ஆபத்து (30% எடை)'
  },
  'detail.satellite_series_title': {
    en: 'Rolling Satellite NDVI / NDWI Time-Series',
    ta: 'சுழலும் செயற்கைக்கோள் NDVI / NDWI நேரத் தொடர்'
  },
  'detail.synthetic_baseline': {
    en: 'Synthetic baseline',
    ta: 'மாதிரி அடிப்படைத் தரவு'
  },
  'detail.ndvi_label': {
    en: 'NDVI (Vegetation)',
    ta: 'NDVI (தாவர வளம்)'
  },
  'detail.ndwi_label': {
    en: 'NDWI (Water)',
    ta: 'NDWI (நீர் பரப்பு)'
  },
  'detail.constructed': {
    en: 'Constructed',
    ta: 'கட்டப்பட்ட ஆண்டு'
  },
  'detail.structure_id': {
    en: 'Structure ID',
    ta: 'கட்டமைப்பு எண்'
  },
  'detail.construction_year': {
    en: 'Construction Year',
    ta: 'கட்டப்பட்ட ஆண்டு'
  },
  'detail.composite_score_card': {
    en: 'Composite Risk Score',
    ta: 'ஒருங்கிணைந்த இடர் மதிப்பீடு'
  },
  'detail.field_condition': {
    en: 'Field Condition (Dual-Head ResNet18)',
    ta: 'கள நிலை (இரட்டை-தலை ResNet18)'
  },
  'detail.satellite_trend_card': {
    en: 'Satellite Trend Health',
    ta: 'செயற்கைக்கோள் போக்கு நிலை'
  },
  'detail.predicted_failure': {
    en: 'Predicted Failure Risk (XGBoost)',
    ta: 'கணிக்கப்பட்ட தோல்வி ஆபத்து (XGBoost)'
  },
  'detail.photographic_evidence': {
    en: 'Photographic Inspection & Explainable AI',
    ta: 'புகைப்பட ஆய்வு & விளக்கக்கூடிய AI (Explainable AI)'
  },
  'detail.toggle_gradcam': {
    en: 'Show Grad-CAM Heatmap',
    ta: 'Grad-CAM வெப்ப வரைபடத்தைக் காட்டு'
  },
  'detail.toggle_original': {
    en: 'Show Original Photo',
    ta: 'அசல் புகைப்படத்தைக் காட்டு'
  },
  'detail.gradcam_desc': {
    en: 'Grad-CAM highlights neural activations on the last convolutional layer of ResNet-18 showing structural spalling, cracks, or erosion.',
    ta: 'Grad-CAM ஆனது ResNet-18 இன் கடைசி அடுக்கில் விரிசல்கள், அரிப்பு மற்றும் கட்டமைப்பு சேதங்கள் உள்ள பகுதிகளைத் தெளிவாகச் சுட்டிக்காட்டுகிறது.'
  },
  'detail.satellite_telemetry_chart': {
    en: 'Multi-Temporal Satellite Telemetry (NDVI & NDWI)',
    ta: 'பன்முக கால செயற்கைக்கோள் தொலை அளவியல் (NDVI & NDWI)'
  },
  'detail.satellite_desc': {
    en: 'Time-series vegetative vigour (NDVI) and surface water presence (NDWI) extracted over 6-month historical intervals.',
    ta: '6 மாத கால இடைவெளியில் பெறப்பட்ட தாவர வளர்ச்சி குறியீடு (NDVI) மற்றும் மேற்பரப்பு நீர் இருப்பு (NDWI).'
  },
  'detail.model_inference_details': {
    en: 'Multi-Modal ML Fusion Explanations',
    ta: 'பன்முக ML மாதிரி ஒருங்கிணைப்பு விளக்கங்கள்'
  },

  // Watershed Validation Page
  'val.header_title': {
    en: 'Srikakulam IWMP-24 Chinnagora Scientific Validation',
    ta: 'ஸ்ரீகாகுளம் IWMP-24 சின்னகோரா அறிவியல் சரிபார்ப்பு'
  },
  'val.header_subtitle': {
    en: 'Rigorous ground-truthed comparison against published NRSC/ISRO Srishti & Bhuvan Geoportal watershed impact statistics.',
    ta: 'வெளியிடப்பட்ட NRSC/ISRO சிருஷ்டி மற்றும் புவன் ஜியோபோர்டல் புள்ளிவிவரங்களுடன் கூடிய கள ஒப்பீட்டு சரிபார்ப்பு.'
  },
  'val.tab_overview': {
    en: 'Overview & Summary',
    ta: 'மேலோட்டம் & அறிக்கை'
  },
  'val.tab_table': {
    en: 'LULC Change Table',
    ta: 'நில பயன்பாட்டு மாற்ற அட்டவணை'
  },
  'val.tab_clusters': {
    en: 'K-Means Clustering',
    ta: 'K-Means கொத்தாக்கல்'
  },
  'val.tab_action_points': {
    en: 'Officer Action Plan',
    ta: 'அதிகாரிகளின் கள செயல் திட்டம்'
  },
  'val.loading_text': {
    en: 'Loading Srikakulam IWMP-24 Chinnagora Validation Data...',
    ta: 'ஸ்ரீகாகுளம் IWMP-24 சின்னகோரா சரிபார்ப்புத் தரவு ஏற்றப்படுகிறது...'
  },
  'val.loading_subtext': {
    en: 'Fetching published ISRO/NRSC Bhuvan Srishti benchmarks and ground-truth structures',
    ta: 'வெளியிடப்பட்ட ISRO/NRSC புவன் சிருஷ்டி அளவுகோல்கள் பெறப்படுகின்றன'
  },

  // Cauvery / Trichy Page
  'cauvery.header_title': {
    en: 'Cauvery Basin & Trichy Sub-Watershed Secondary Evidence',
    ta: 'காவிரி வடிநிலம் & திருச்சி துணை நீர்ப்பிடிப்பு இரண்டாம் நிலை சான்றுகள்'
  },
  'cauvery.header_subtitle': {
    en: 'Multi-basin cross-validation on Tamil Nadu Cauvery delta micro-watersheds and check dam siltation benchmarks.',
    ta: 'தமிழ்நாடு காவிரி டெல்டா நுண் நீர்ப்பிடிப்புகள் மற்றும் தடுப்பணை வண்டல் படிவு அளவுகோல்களின் பல-வடிநில குறுக்கு சரிபார்ப்பு.'
  },
  'cauvery.tab_all': {
    en: 'All Evidence',
    ta: 'அனைத்து சான்றுகள்'
  },
  'cauvery.tab_wbis': {
    en: 'WBIS Water Spread',
    ta: 'WBIS நீர் பரவல்'
  },
  'cauvery.tab_drishti': {
    en: 'Drishti Geo-Tagged Photos',
    ta: 'திருஷ்டி புவி-குறிச்சொல் புகைப்படங்கள்'
  },
  'cauvery.tab_tn_lulc': {
    en: 'Tamil Nadu LULC',
    ta: 'தமிழ்நாடு நில பயன்பாடு'
  },
  'cauvery.tab_trichy': {
    en: 'Trichy Check Dam Photos',
    ta: 'திருச்சி தடுப்பணை புகைப்படங்கள்'
  },
  'cauvery.retry': {
    en: 'Retry Connection',
    ta: 'மீண்டும் முயற்சிக்கவும்'
  },
  'cauvery.loading_text': {
    en: 'Loading Secondary Evidence & Real Ground-Truth Data...',
    ta: 'இரண்டாம் நிலை சான்றுகள் மற்றும் கள உண்மைத் தரவு ஏற்றப்படுகிறது...'
  },
  'cauvery.loading_subtext': {
    en: 'Connecting to ISRO/NRSC Bhuvan WBIS & Thematic Services',
    ta: 'ISRO/NRSC புவன் WBIS & கருப்பொருள் சேவைகளுடன் இணைக்கப்படுகிறது'
  },
  'val.subtitle': {
    en: 'Rigorous ground-truthed comparison against published NRSC/ISRO Srishti & Bhuvan Geoportal watershed impact statistics.',
    ta: 'வெளியிடப்பட்ட NRSC/ISRO சிருஷ்டி மற்றும் புவன் ஜியோபோர்டல் நீர்ப்பிடிப்பு தாக்க புள்ளிவிவரங்களுடன் கூடிய கள ஒப்பீட்டு சரிபார்ப்பு.'
  },
  'val.official_source': {
    en: 'Official Geoportal Source',
    ta: 'அதிகாரப்பூர்வ ஜியோபோர்டல் மூலம்'
  },
  'val.project_name': {
    en: 'Project: Srikakulam IWMP-24 Chinnagora (Andhra Pradesh)',
    ta: 'திட்டம்: ஸ்ரீகாகுளம் IWMP-24 சின்னகோரா (ஆந்திரப் பிரதேசம்)'
  },
  'val.total_area': {
    en: 'Total Watershed Area',
    ta: 'மொத்த நீர்ப்பிடிப்பு பரப்பளவு'
  },
  'val.baseline_period': {
    en: 'Baseline Period (T0)',
    ta: 'அடிப்படை கால அளவு (T0)'
  },
  'val.assessment_period': {
    en: 'Assessment Period (T1)',
    ta: 'மதிப்பீட்டு கால அளவு (T1)'
  },
  'val.net_cropland_gain': {
    en: 'Net Cropland / Plantation Gain',
    ta: 'நிகர பயிர் நிலம் / தோட்டப் பயிர் அதிகரிப்பு'
  },
  'val.net_wasteland_reduction': {
    en: 'Net Wasteland / Degraded Land Reduced',
    ta: 'குறைக்கப்பட்ட தரிசு நிலம் / பாழடைந்த பகுதி'
  },
  'val.waterbody_increase': {
    en: 'Waterbody Surface Capacity Boost',
    ta: 'நீர்நிலைகளின் மேற்பரப்பு கொள்ளளவு அதிகரிப்பு'
  },
  'val.table_class_header': {
    en: 'LULC Category',
    ta: 'நில பயன்பாட்டு வகை'
  },
  'val.table_t0_header': {
    en: '2015-16 Area (km²)',
    ta: '2015-16 பரப்பளவு (கிமீ²)'
  },
  'val.table_t1_header': {
    en: '2020-21 Area (km²)',
    ta: '2020-21 பரப்பளவு (கிமீ²)'
  },
  'val.table_change_sqkm': {
    en: 'Change (km²)',
    ta: 'மாற்றம் (கிமீ²)'
  },
  'val.table_change_pct': {
    en: 'Change (%)',
    ta: 'மாற்றம் (%)'
  },
  'val.table_trajectory': {
    en: 'Trajectory Cohort',
    ta: 'மாற்ற போக்கு'
  },

  // Cauvery / Trichy Page
  'cauvery.title': {
    en: 'Cauvery Basin & Trichy Sub-Watershed Secondary Evidence',
    ta: 'காவிரி வடிநிலம் & திருச்சி துணை நீர்ப்பிடிப்பு இரண்டாம் நிலை சான்றுகள்'
  },
  'cauvery.subtitle': {
    en: 'Multi-basin cross-validation on Tamil Nadu Cauvery delta micro-watersheds and check dam siltation benchmarks.',
    ta: 'தமிழ்நாடு காவிரி டெல்டா நுண் நீர்ப்பிடிப்புகள் மற்றும் தடுப்பணை வண்டல் படிவு அளவுகோல்களின் பல-வடிநில குறுக்கு சரிபார்ப்பு.'
  },
  'cauvery.basin_name': {
    en: 'Cauvery Delta & Upper Micro-Catchments',
    ta: 'காவிரி டெல்டா & மேல் நுண் நீர்ப்பிடிப்புகள்'
  },
  'cauvery.structures_logged': {
    en: 'Check Dams & Farm Ponds Monitored',
    ta: 'கண்காணிக்கப்பட்ட தடுப்பணைகள் & பண்ணைக் குட்டைகள்'
  },
  'cauvery.siltation_risk_detected': {
    en: 'Structures with >40% Siltation / Scour',
    ta: '>40% வண்டல் படிவு / அரிப்பு கண்டறியப்பட்ட கட்டமைப்புகள்'
  },
  'cauvery.groundwater_recharge_gain': {
    en: 'Est. Groundwater Recharge Enhancement',
    ta: 'மதிப்பிடப்பட்ட நிலத்தடி நீர் மறுஊட்டல் அதிகரிப்பு'
  },
  'cauvery.cross_validation_tab': {
    en: 'Delta Cross-Validation',
    ta: 'டெல்டா குறுக்கு சரிபார்ப்பு'
  },
  'cauvery.siltation_index_tab': {
    en: 'Siltation Risk Index',
    ta: 'வண்டல் படிவு இடர் குறியீடு'
  },
  'cauvery.farmer_feedback_tab': {
    en: 'Farmer & Panchayati Ground Logs',
    ta: 'விவசாயிகள் & ஊராட்சி களப் பதிவுகள்'
  },

  // Dynamic values helper mappings
  'tier.healthy': {
    en: 'Healthy',
    ta: 'நல்ல நிலை'
  },
  'tier.monitor': {
    en: 'Monitor',
    ta: 'கண்காணிக்கவும்'
  },
  'tier.urgent': {
    en: 'Urgent',
    ta: 'அவசர நடவடிக்கை'
  },
  'struct.check_dam': {
    en: 'Check Dam',
    ta: 'தடுப்பணை'
  },
  'struct.farm_pond': {
    en: 'Farm Pond',
    ta: 'பண்ணைக் குட்டை'
  },
  'struct.bund': {
    en: 'Bund / Field Ridge',
    ta: 'வரப்பு / கரை'
  },
  'struct.contour_trench': {
    en: 'Contour Trench',
    ta: 'சமமட்டக் குழி'
  },
  'struct.earthen_dam': {
    en: 'Earthen Dam',
    ta: 'மண் அணை'
  },
  'struct.other': {
    en: 'Other Structure',
    ta: 'பிற கட்டமைப்பு'
  },
  'cond.intact': {
    en: 'Intact',
    ta: 'முழுமையானது (நல்ல நிலை)'
  },
  'cond.minor_damage': {
    en: 'Minor Damage',
    ta: 'சிறிய சேதம்'
  },
  'cond.major_damage': {
    en: 'Major Damage',
    ta: 'பெரும் சேதம்'
  },
  'cond.non_functional': {
    en: 'Non-Functional',
    ta: 'செயலிழந்தது'
  }
};

/**
 * Universal translation helper that accepts a key or text string.
 * If translation exists for key, returns the target language string.
 * If key is not in dictionary, returns fallback or the key itself.
 */
export const getTranslation = (key: string, lang: Language, fallback?: string): string => {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return fallback !== undefined ? fallback : key;
};

/**
 * Helper to translate structure types dynamically
 */
export const translateStructureType = (type: string, lang: Language): string => {
  const clean = type.toLowerCase().replace(/[\s-]/g, '_');
  const key = `struct.${clean}`;
  if (translations[key]) {
    return translations[key][lang];
  }
  if (lang === 'ta') {
    if (clean.includes('check_dam')) return 'தடுப்பணை';
    if (clean.includes('farm_pond')) return 'பண்ணைக் குட்டை';
    if (clean.includes('bund')) return 'வரப்பு / கரை';
    if (clean.includes('trench')) return 'சமமட்டக் குழி';
    if (clean.includes('dam')) return 'அணை';
    return type.replace(/_/g, ' ');
  }
  return type.replace(/_/g, ' ');
};

/**
 * Helper to translate condition states dynamically
 */
export const translateCondition = (cond: string, lang: Language): string => {
  const clean = cond.toLowerCase().replace(/[\s-]/g, '_');
  const key = `cond.${clean}`;
  if (translations[key]) {
    return translations[key][lang];
  }
  if (lang === 'ta') {
    if (clean.includes('intact')) return 'முழுமையானது (நல்ல நிலை)';
    if (clean.includes('minor')) return 'சிறிய சேதம்';
    if (clean.includes('major')) return 'பெரும் சேதம்';
    if (clean.includes('non_functional') || clean.includes('failed')) return 'செயலிழந்தது';
  }
  return cond.replace(/_/g, ' ');
};

/**
 * Helper to translate priority tiers dynamically
 */
export const translatePriorityTier = (tier: string, lang: Language): string => {
  const clean = tier.toLowerCase();
  const key = `tier.${clean}`;
  if (translations[key]) {
    return translations[key][lang];
  }
  if (lang === 'ta') {
    if (clean.includes('healthy')) return 'நல்ல நிலை';
    if (clean.includes('monitor')) return 'கண்காணிக்கவும்';
    if (clean.includes('urgent')) return 'அவசர நடவடிக்கை';
  }
  return tier;
};

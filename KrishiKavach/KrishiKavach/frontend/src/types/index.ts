// Shared types between frontend and backend
export interface FarmerProfile {
  id: string
  name: string
  phone: string | null
  village: string | null
  district: string | null
  state: string | null
  primary_language: string | null
}

export interface Farm {
  id: string
  farmer_id: string
  area_hectares: number | null
  primary_crop: string | null
  location_point: string | null
}

export interface PredictionResult {
  disease: string
  crop: string
  confidence: number
  severity: 'low' | 'medium' | 'high'
  uncertainty_flag: boolean
  description: string
  disease_slug: string
  recommendation_text: string
  steps: string[]
  warning: string | null
  escalate: boolean
  follow_up_days: number
  is_demo: boolean
  model_source: string
  alternatives: Array<{ disease: string; crop: string; confidence: number }>
}

export interface CaseCreateResponse {
  case_id: string
  prediction: PredictionResult
  farmer_id: string
  farm_id: string
  detected_at: string
  recommendation_given_at: string
  next_follow_up_at: string
  case_status: string
  is_demo_prediction: boolean
}

export interface CaseResponse {
  id: string
  farm_id: string
  farmer_id: string
  image_path: string | null
  predicted_disease: string | null
  predicted_crop: string | null
  confidence: number | null
  severity: string | null
  uncertainty_flag: boolean
  detected_at: string
  recommendation_given_at: string | null
  treatment_attempted_at: string | null
  next_follow_up_at: string
  last_follow_up_at: string | null
  case_status: string
  notes: string | null
}

export interface FeedbackRequest {
  attempted_intervention: boolean
  crop_improved: boolean | null
  farmer_notes: string | null
}

export interface FeedbackResponse {
  id: string
  case_id: string
  feedback_at: string
  attempted_intervention: boolean
  crop_improved: boolean | null
  farmer_notes: string | null
}

export interface DiseaseReport {
  id: string
  district: string | null
  crop_type: string | null
  disease_type: string | null
  risk_level: string | null
  affected_farms: number
  total_cases_reported: number
  valid_from: string
  valid_to: string
}

export interface HealthResponse {
  status: string
  database: string
  prediction_mode: string
  demo_time_enabled: boolean
  current_demo_date: string | null
  version: string
}

export interface VoiceConfigResponse {
  provider: string
  default_language: string
  stt_model: string | null
  tts_model: string | null
  tts_voice: string | null
  browser_fallback_supported: boolean
}

export interface DemoTimeResponse {
  current_date: string
  message: string
}

export interface ExpertInfo {
  id: string
  name: string
  specialty: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
}

export interface VoiceIntent {
  raw_text: string
  intent: 'yes' | 'no' | 'retry' | 'escalate' | 'silence' | 'unknown'
  confidence: number
  language: string
}


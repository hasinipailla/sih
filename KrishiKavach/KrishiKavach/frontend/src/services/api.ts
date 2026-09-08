// Backend API client.
// All calls go to the existing FastAPI backend via Vite proxy (/api/* → localhost:8000).

import type {
  CaseCreateResponse,
  CaseResponse,
  DemoTimeResponse,
  DiseaseReport,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  VoiceConfigResponse,
} from "../types"

const API_BASE = "" // rely on Vite dev proxy

export async function predictImage(
  file: File,
  district?: string,
  cropType?: string,
  cropStage?: string,
  farmerLanguage = "marathi",
): Promise<CaseCreateResponse> {
  const form = new FormData()
  form.append("file", file)
  if (district) form.append("district", district)
  if (cropType) form.append("crop_type", cropType)
  if (cropStage) form.append("crop_stage", cropStage)
  form.append("farmer_language", farmerLanguage)

  const res = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    let detail = `Prediction failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.detail) detail = data.detail
    } catch {
      /* noop */
    }
    throw new Error(detail)
  }
  return res.json()
}

export async function listCases(farmerId?: string, status?: string): Promise<CaseResponse[]> {
  const params = new URLSearchParams()
  if (farmerId) params.append("farmer_id", farmerId)
  if (status) params.append("status", status)
  const qs = params.toString() ? `?${params.toString()}` : ""

  const res = await fetch(`${API_BASE}/api/cases${qs}`)
  if (!res.ok) throw new Error(`Failed to load cases (${res.status})`)
  const data = await res.json()
  return data.cases as CaseResponse[]
}

export async function listDueFollowUps(): Promise<CaseResponse[]> {
  const res = await fetch(`${API_BASE}/api/cases/due-for-follow-up`)
  if (!res.ok) throw new Error(`Failed to load follow-ups (${res.status})`)
  const data = await res.json()
  return data.cases as CaseResponse[]
}

export async function submitFeedback(
  caseId: string,
  feedback: FeedbackRequest,
): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE}/api/cases/${caseId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  })
  if (!res.ok) throw new Error(`Failed to submit feedback (${res.status})`)
  return res.json()
}

export async function listOutbreaks(district?: string): Promise<DiseaseReport[]> {
  const qs = district ? `?district=${encodeURIComponent(district)}` : ""
  const res = await fetch(`${API_BASE}/api/outbreaks${qs}`)
  if (!res.ok) throw new Error(`Failed to load outbreaks (${res.status})`)
  return res.json()
}

export async function getCase(caseId: string): Promise<CaseResponse> {
  const res = await fetch(`${API_BASE}/api/cases/${caseId}`)
  if (!res.ok) throw new Error(`Case not found (${res.status})`)
  return res.json()
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`Health check failed (${res.status})`)
  return res.json()
}

export async function getVoiceConfig(): Promise<VoiceConfigResponse> {
  const res = await fetch(`${API_BASE}/api/voice/config`)
  if (!res.ok) throw new Error(`Voice config failed (${res.status})`)
  return res.json()
}

export async function advanceDemoTime(days = 1): Promise<DemoTimeResponse> {
  const res = await fetch(`${API_BASE}/api/demo/advance-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
  })
  if (!res.ok) throw new Error(`Failed to advance demo time (${res.status})`)
  return res.json()
}

export async function resetDemoTime(): Promise<DemoTimeResponse> {
  const res = await fetch(`${API_BASE}/api/demo/reset-time`, {
    method: "POST",
  })
  if (!res.ok) throw new Error(`Failed to reset demo time (${res.status})`)
  return res.json()
}

export async function getDemoTime(): Promise<DemoTimeResponse> {
  const res = await fetch(`${API_BASE}/api/demo/current-time`)
  if (!res.ok) throw new Error(`Failed to get demo time (${res.status})`)
  return res.json()
}


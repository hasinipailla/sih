// KrishiKavach — Production Agricultural AI Platform Frontend
import { useCallback, useEffect, useState } from "react"
import { AppShell } from "./components/AppShell"
import { FarmerHeader } from "./components/FarmerHeader"
import { QuickActionCard } from "./components/QuickActionCard"
import { CropUploadCard } from "./components/CropUploadCard"
import { AnalysisProgress } from "./components/AnalysisProgress"
import { DiagnosisCard } from "./components/DiagnosisCard"
import { CaseHistory } from "./components/CaseHistory"
import { FollowUpCenter } from "./components/FollowUpCenter"
import { RiskDashboard } from "./components/RiskDashboard"
import { ExpertHelpCenter } from "./components/ExpertHelpCenter"
import { VoiceAssistantWidget } from "./components/VoiceAssistantWidget"
import { useVoiceController } from "./hooks/useVoiceController"
import { usePhotoCapture } from "./hooks/usePhotoCapture"
import { getDemoTime, listCases, listDueFollowUps, predictImage } from "./services/api"
import type { CaseCreateResponse } from "./types"
import type { VoiceLanguage } from "./services/voice"
import type { TabName } from "./components/Sidebar"
import { t } from "./i18n/strings"

const DEFAULT_LANGUAGE: VoiceLanguage = "hi-IN"

export default function App() {
  const [language, setLanguage] = useState<VoiceLanguage>(DEFAULT_LANGUAGE)
  const voice = useVoiceController(language)
  const photo = usePhotoCapture()

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<TabName>("home")
  const [bannerMessage, setBannerMessage] = useState<string>("")
  const [predictError, setPredictError] = useState<string | null>(null)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [showDemoTimeBar, setShowDemoTimeBar] = useState(false)

  // API State
  const [activeCasesCount, setActiveCasesCount] = useState<number>(0)
  const [dueFollowUpsCount, setDueFollowUpsCount] = useState<number>(0)
  const [currentDemoDate, setCurrentDemoDate] = useState<string | null>(null)
  const [activeDiagnosis, setActiveDiagnosis] = useState<CaseCreateResponse | null>(null)
  const [isPredicting, setIsPredicting] = useState(false)

  const speak = useCallback(
    async (text: string) => {
      await voice.controller.speak(text)
    },
    [voice.controller],
  )

  // Fetch initial summary counts
  const fetchCounts = useCallback(async () => {
    try {
      const cases = await listCases()
      setActiveCasesCount(cases.filter((c) => c.case_status === "active").length)

      const dueCases = await listDueFollowUps()
      setDueFollowUpsCount(dueCases.length)

      const demoInfo = await getDemoTime()
      setCurrentDemoDate(demoInfo.current_date)
    } catch {
      /* fallback silently */
    }
  }, [])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Initial Voice Greeting
  useEffect(() => {
    if (hasGreeted) return
    setHasGreeted(true)
    const greeting = t("greeting_initial", language)
    setBannerMessage(greeting)
    speak(greeting).catch(() => {
      /* silent */
    })
    if (!voice.controller.isRecognitionSupported()) {
      setBannerMessage(greeting + " (" + t("voice_mic_unavailable", language) + ")")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle Language Change
  const handleLanguageChange = (lang: VoiceLanguage) => {
    setLanguage(lang)
    voice.controller.setLanguage(lang)
  }

  // Handle Photo Analysis Prediction
  const handlePredict = useCallback(async () => {
    if (!photo.pendingFile) return
    setPredictError(null)
    setIsPredicting(true)
    const loadingMsg = t("loading_photo", language)
    setBannerMessage(loadingMsg)
    await speak(loadingMsg)

    try {
      const result = await predictImage(photo.pendingFile, undefined, undefined, undefined, language)
      setActiveDiagnosis(result)
      setIsPredicting(false)

      const summary =
        result.prediction.disease +
        (result.prediction.crop && result.prediction.crop !== "Unknown" ? " — " + result.prediction.crop : "") +
        ". " +
        result.prediction.recommendation_text
      setBannerMessage(summary)
      await speak(summary)

      await fetchCounts()
    } catch (e: any) {
      setIsPredicting(false)
      const msg = e?.message || "Could not reach the server."
      setPredictError(msg)
      const errMsg =
        language === "hi-IN" ? "माफ़ कीजिए, कुछ गलत हो गया। " + msg : "Sorry, something went wrong. " + msg
      setBannerMessage(errMsg)
      await speak(errMsg)
    }
  }, [photo.pendingFile, speak, language, fetchCounts])

  // Handle What Should I Do Voice Query
  const handleWhatToDo = useCallback(async () => {
    const prompt =
      language === "hi-IN"
        ? "बताइए आप क्या देख रहे हैं। पत्ता पीला है, भूरा है, या धब्बेदार है? मैं सुनकर बताऊँगा क्या करना है।"
        : "Tell me what you see. Is the leaf yellow, brown, or spotted? I will listen and tell you what to do."
    await speak(prompt)
    const reply = await voice.controller.promptAndListen()
    if (!reply) {
      const msg =
        language === "hi-IN" ? "मुझे कुछ सुनाई नहीं दिया। कृपया फिर कोशिश कीजिए।" : "I did not hear anything. Please try again."
      setBannerMessage(msg)
      await speak(msg)
      return
    }
    setBannerMessage((language === "hi-IN" ? "आपने कहा: " : "You said: ") + reply)
    const text = reply.toLowerCase()
    let response =
      language === "hi-IN"
        ? "मैंने आपकी बात सुनी। किसी भी पौधे रोग के लिए सबसे सुरक्षित पहला कदम है प्रभावित पत्ते हटा दें और एक साफ़ फोटो लेकर मुझे भेजें।"
        : "I heard you. For any plant disease, the safest first step is to remove affected leaves and send me a clear photo."

    if (text.includes("yellow") || text.includes("पीला")) {
      response =
        language === "hi-IN"
          ? "पीले पत्ते अक्सर पोषण की कमी या अधिक पानी का संकेत हैं। मिट्टी की नमी जाँचें और कुछ दिन पानी कम दें।"
          : "Yellow leaves often mean a nutrient problem or over-watering. Check the soil moisture and reduce watering for a few days."
    } else if (text.includes("spot") || text.includes("brown") || text.includes("धब्बा") || text.includes("भूरा")) {
      response =
        language === "hi-IN"
          ? "धब्बे या भूरे हिस्से आमतौर पर फफूंद रोग होते हैं। प्रभावित पत्ते हटा दें और एक फोटो लेकर मुझे भेजें।"
          : "Spots or brown patches usually mean a fungal disease. Remove affected leaves and send me a photo."
    }
    setBannerMessage(response)
    await speak(response)
  }, [speak, voice.controller, language])

  // Auto-switch to crop-health tab when file selected
  useEffect(() => {
    if (photo.pendingFile && activeTab !== "crop-health") {
      setActiveTab("crop-health")
      const msg = t("tap_photo_to_send", language)
      setBannerMessage(msg)
      speak(msg).catch(() => {})
    }
  }, [photo.pendingFile, activeTab, speak, language])

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      language={language}
      onLanguageChange={handleLanguageChange}
      currentDemoDate={currentDemoDate}
      onToggleDemoTimeBar={() => setShowDemoTimeBar(!showDemoTimeBar)}
      dueFollowUpsCount={dueFollowUpsCount}
    >
      {/* Voice Assistant Status Widget */}
      <VoiceAssistantWidget
        status={voice.status}
        interim={voice.interim}
        message={bannerMessage}
        language={language}
        onToggleListen={() => {
          if (voice.status === "listening") {
            voice.controller.cancel()
          } else {
            handleWhatToDo()
          }
        }}
        onSpeakMessageAgain={() => {
          if (bannerMessage) speak(bannerMessage)
        }}
      />

      {voice.error && <div className="error">{t("voice_unavailable_title", language)}: {voice.error}</div>}

      {/* Tab 1: Home Dashboard */}
      {activeTab === "home" && (
        <>
          <FarmerHeader
            language={language}
            activeCasesCount={activeCasesCount}
            dueFollowUpsCount={dueFollowUpsCount}
          />

          <div className="quick-grid">
            <QuickActionCard
              color="green"
              icon="📸"
              title={t("action_take_photo", language)}
              subtitle={t("action_take_photo_sub", language)}
              onClick={() => {
                setActiveTab("crop-health")
                photo.openCamera()
              }}
            />

            <QuickActionCard
              color="blue"
              icon="❓"
              title={t("action_what_to_do", language)}
              subtitle={t("action_what_to_do_sub", language)}
              onClick={handleWhatToDo}
            />

            <QuickActionCard
              color="orange"
              icon="📅"
              title={t("nav_follow_ups", language)}
              subtitle={t("followup_due_today", language)}
              onClick={() => setActiveTab("follow-ups")}
              badgeCount={dueFollowUpsCount}
            />

            <QuickActionCard
              color="red"
              icon="⚠️"
              title={t("action_nearby_risk", language)}
              subtitle={t("action_nearby_risk_sub", language)}
              onClick={() => setActiveTab("risk")}
            />
          </div>
        </>
      )}

      {/* Tab 2: Crop Health Photo & AI Diagnosis Center */}
      {activeTab === "crop-health" && (
        <>
          {isPredicting ? (
            <AnalysisProgress language={language} />
          ) : activeDiagnosis ? (
            <DiagnosisCard
              prediction={activeDiagnosis.prediction}
              language={language}
              previewUrl={photo.previewUrl}
              onSpeakAgain={() => {
                const p = activeDiagnosis.prediction
                speak(`${p.disease}. ${p.recommendation_text}`)
              }}
              onDone={() => {
                photo.reset()
                setActiveDiagnosis(null)
                setActiveTab("home")
              }}
              onAskExpert={() => setActiveTab("expert")}
            />
          ) : (
            <CropUploadCard
              previewUrl={photo.previewUrl}
              onOpenCamera={photo.openCamera}
              onOpenGallery={photo.openGallery}
              onSendForAnalysis={handlePredict}
              onRetake={photo.reset}
              language={language}
              error={predictError}
            />
          )}
        </>
      )}

      {/* Tab 3: Case History */}
      {activeTab === "cases" && (
        <CaseHistory
          language={language}
          onSelectCase={() => {
            /* modal opens inside CaseHistory */
          }}
        />
      )}

      {/* Tab 4: Follow-up Center & Feedback Loop */}
      {activeTab === "follow-ups" && (
        <FollowUpCenter language={language} onRefreshCases={fetchCounts} />
      )}

      {/* Tab 5: Risk Intelligence & Outbreak Dashboard */}
      {activeTab === "risk" && (
        <RiskDashboard
          language={language}
          onSpeakSummary={() => {
            speak(t("loading_outbreaks", language))
          }}
        />
      )}

      {/* Tab 6: Agronomist & Expert Help */}
      {activeTab === "expert" && (
        <ExpertHelpCenter
          language={language}
          onSpeakInfo={() => {
            speak("Call 1800-103-AGRI for Krishi Vigyan Kendra Helpline")
          }}
        />
      )}

      {/* Tab 7: Voice Assistant Controller Tab */}
      {activeTab === "voice" && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <span style={{ fontSize: "4rem", display: "block", marginBottom: 16 }}>🎙️</span>
          <h2 className="card-title" style={{ justifyContent: "center", fontSize: "1.5rem" }}>
            {t("nav_voice", language)}
          </h2>
          <p style={{ color: "var(--color-text-subtle)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {language === "hi-IN"
              ? "हिंदी, मराठी या अंग्रेज़ी में सीधे बोलें। KrishiKavach OmniRoute AI आवाज़ पहचान का उपयोग करके आपकी हैंड्स-फ्री सहायता करता है।"
              : language === "mr-IN"
              ? "हिंदी, मराठी किंवा इंग्रजीत थेट बोला. KrishiKavach OmniRoute AI वाणी ओळखीचा वापर करून तुम्हाला हँड्स-फ्री मदत करतो."
              : "Speak directly in English, Hindi, or Marathi. KrishiKavach uses OmniRoute AI speech recognition to assist you hands-free."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360, margin: "0 auto" }}>
            <button
              onClick={handleWhatToDo}
              className="action-btn green"
              style={{ justifyContent: "center" }}
            >
              🎙️ {language === "hi-IN" ? "बोलकर पूछें" : language === "mr-IN" ? "बोलून विचारा" : "Tap to Speak"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div style={{ background: "var(--color-mint)", padding: 14, borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 700, color: "var(--color-forest)", marginBottom: 4 }}>🌿 {language === "hi-IN" ? "फसल जाँच" : language === "mr-IN" ? "पीक तपासणी" : "Crop Check"}</div>
                <div style={{ color: "var(--color-text-subtle)" }}>{language === "hi-IN" ? "\"मेरे पत्ते पीले हैं\"" : language === "mr-IN" ? "\"पाने पिवळी आहेत\"" : "\"My leaves are yellow\""}</div>
              </div>
              <div style={{ background: "var(--color-sky-light)", padding: 14, borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 700, color: "var(--color-sky)", marginBottom: 4 }}>📍 {language === "hi-IN" ? "नज़दीक का खतरा" : language === "mr-IN" ? "जवळचा धोका" : "Nearby Risk"}</div>
                <div style={{ color: "var(--color-text-subtle)" }}>{language === "hi-IN" ? "\"मेरे क्षेत्र में क्या है?\"" : language === "mr-IN" ? "\"माझ्या भागात काय आहे?\"" : "\"What's in my area?\""}</div>
              </div>
            </div>
          </div>

          {voice.status === "listening" && (
            <div style={{ marginTop: 20, padding: "12px 20px", background: "#FEE2E2", borderRadius: "var(--radius-md)", color: "#991B1B", fontWeight: 700 }}>
              🔴 {language === "hi-IN" ? "सुन रहा हूँ..." : language === "mr-IN" ? "ऐकत आहे..." : "Listening..."}
              {voice.interim && <div style={{ fontWeight: 400, marginTop: 4, fontSize: "0.9rem" }}>"{voice.interim}"</div>}
            </div>
          )}
        </div>
      )}

      {/* Hidden file inputs for camera and gallery */}
      <input
        ref={photo.cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={photo.onFileSelected}
        style={{ display: "none" }}
      />
      <input
        ref={photo.galleryInputRef}
        type="file"
        accept="image/*"
        onChange={photo.onFileSelected}
        style={{ display: "none" }}
      />
    </AppShell>
  )
}

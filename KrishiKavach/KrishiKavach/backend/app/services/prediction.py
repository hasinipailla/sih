"""Prediction service interface and agronomic implementations for KrishiKavach.

Provides a robust, evidence-based diagnostic pipeline fusing:
1. Visual symptom features extracted from leaf imagery (chlorosis, necrosis, leaf spots, chlorophyll green ratio)
2. Crop profile constraints (preventing misattribution between different crop species)
3. Regional environmental context (district soil moisture, evapotranspiration, ambient humidity)
4. Active geospatial disease outbreak alerts in Maharashtra

Follows SIH26131 standards for accurate, explainable, and localized crop diagnosis.
"""
from __future__ import annotations

import hashlib
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from app.services.image_analysis import LeafVisualFeatures, extract_leaf_features


# ---------------------------------------------------------------------------
# Data classes for prediction output
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    """Disease severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class DiseasePrediction:
    """Output from the disease/pest prediction pipeline."""
    # Disease name (actual diagnosed class label)
    disease: str
    # Crop the disease was detected on
    crop: str
    # Confidence score (0.0 – 1.0)
    confidence: float
    # Severity estimated from confidence and agronomic severity
    severity: Severity
    # True when confidence is below the certainty threshold or image is ambiguous
    uncertainty_flag: bool
    # Short human-readable description
    description: str
    # URL-friendly slug
    disease_slug: str
    # Whether this prediction is a demo/hash-based or real vision-based prediction
    is_demo: bool = False
    # Human-readable label for UI badge
    model_source: str = "AgronomicVisionPredictionEngine"
    # Top alternative candidate diagnoses
    alternatives: list[dict] = field(default_factory=list)
    # Objective visual indicators detected from the foliage
    visual_evidence: list[str] = field(default_factory=list)
    # Environmental context used during diagnosis
    environmental_context: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "disease": self.disease,
            "crop": self.crop,
            "confidence": round(self.confidence, 3),
            "severity": self.severity.value,
            "uncertainty_flag": self.uncertainty_flag,
            "description": self.description,
            "disease_slug": self.disease_slug,
            "is_demo": self.is_demo,
            "model_source": self.model_source,
            "alternatives": self.alternatives,
            "visual_evidence": self.visual_evidence,
            "environmental_context": self.environmental_context,
        }


# ---------------------------------------------------------------------------
# Recommendation data class
# ---------------------------------------------------------------------------

@dataclass
class Recommendation:
    """Localized treatment/care recommendation for a disease prediction."""
    disease: str
    recommendation_text: str
    steps: list[str] = field(default_factory=list)
    warning: str | None = None
    escalate: bool = False
    follow_up_days: int = 7
    context: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "disease": self.disease,
            "recommendation_text": self.recommendation_text,
            "steps": self.steps,
            "warning": self.warning,
            "escalate": self.escalate,
            "follow_up_days": self.follow_up_days,
            "context": self.context,
        }


# ---------------------------------------------------------------------------
# Prediction service interface
# ---------------------------------------------------------------------------

class PredictionService(ABC):
    """Abstract base for crop-disease prediction services."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of the prediction service."""
        ...

    @property
    def is_demo(self) -> bool:
        return False

    @abstractmethod
    async def predict(self, image_bytes: bytes, context: dict[str, Any]) -> DiseasePrediction:
        """Run disease/pest prediction on the given image and agronomic context."""
        ...

    @abstractmethod
    async def recommend(self, prediction: DiseasePrediction, context: dict) -> Recommendation:
        """Return a localized recommendation for a given prediction."""
        ...

    @abstractmethod
    def estimate_severity(self, confidence: float, disease: str) -> tuple[Severity, bool]:
        """Determine severity and uncertainty flag."""
        ...

    def _slugify(self, text: str) -> str:
        """Create a URL-friendly slug from disease name."""
        return text.lower().replace(" ", "-").replace("_", "-").replace("__", "-")


# ---------------------------------------------------------------------------
# Agronomic Disease Knowledge Catalog (Maharashtra Crops)
# ---------------------------------------------------------------------------

AGRONOMIC_CATALOG: list[dict] = [
    # --- TOMATO ---
    {
        "disease": "Tomato Late Blight",
        "crop": "Tomato",
        "slug": "tomato-late-blight",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": ["high_moisture"],
        "description": "Phytophthora infestans infection. Water-soaked dark brown necrotic lesions on leaves and stems, accompanied by white mold undersides in humid conditions.",
        "severity_hint": "high",
        "confidence_base": 0.88,
        "recommendation_text": "Apply copper hydroxide (77% WP at 2.5 g/L) or systemic metalaxyl-mancozeb. Remove infected lower leaves immediately and stop overhead sprinkler watering.",
        "steps": [
            "Prune and destroy severely blighted foliage immediately.",
            "Spray metalaxyl + mancozeb (2.5 g/L water) in the morning.",
            "Repeat protective copper spray after 7–10 days.",
            "Maintain soil drainage to reduce humidity around the plant canopy.",
        ],
        "warning": "Late blight spreads rapidly in humid cool weather. Do not compost infected leaves.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Tomato Early Blight",
        "crop": "Tomato",
        "slug": "tomato-early-blight",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["moderate_moisture"],
        "description": "Alternaria solani fungal infection. Dark brown circular spots with characteristic concentric rings (target spots), starting on older lower foliage.",
        "severity_hint": "medium",
        "confidence_base": 0.84,
        "recommendation_text": "Spray mancozeb (75% WP at 2.5 g/L) or chlorothalonil. Remove infected lower leaves and mulch around base to prevent soil splash.",
        "steps": [
            "Remove and burn infected lower leaves showing target rings.",
            "Apply mancozeb 75% WP at 2.5 g per litre of water.",
            "Repeat protective spray every 10–12 days if spots persist.",
            "Practice 2-year crop rotation away from solanaceous plants.",
        ],
        "warning": "Avoid wetting foliage during evening hours.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Tomato Septoria Leaf Spot",
        "crop": "Tomato",
        "slug": "tomato-septoria-leaf-spot",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["moderate_moisture"],
        "description": "Septoria lycopersici infection. Numerous small circular spots with grey-white centers and dark brown margins across leaves.",
        "severity_hint": "medium",
        "confidence_base": 0.82,
        "recommendation_text": "Apply difenoconazole (0.5 ml/L) or chlorothalonil (2 ml/L). Remove affected leaves to reduce spore dispersal.",
        "steps": [
            "Remove lower spotted leaves carefully without shaking spores.",
            "Spray difenoconazole 25% EC at 0.5 ml per litre of water.",
            "Apply straw mulch to prevent soil splashing onto foliage.",
            "Ensure wide plant spacing (60 cm) for adequate air circulation.",
        ],
        "warning": "Rotate fungicide classes to minimize resistance.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Tomato Bacterial Spot",
        "crop": "Tomato",
        "slug": "tomato-bacterial-spot",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["high_moisture"],
        "description": "Xanthomonas vesicatoria infection. Small dark water-soaked spots with yellow chlorotic halos on foliage and small scab-like lesions on fruit.",
        "severity_hint": "high",
        "confidence_base": 0.85,
        "recommendation_text": "Spray copper oxychloride (3 g/L) combined with streptocycline (1 g/10 L). Avoid handling plants when wet.",
        "steps": [
            "Remove severely infected branches and destroy them.",
            "Spray copper oxychloride (3 g/L) + streptocycline (100 ppm).",
            "Do not work in wet tomato fields to avoid bacterial dissemination.",
            "Use certified disease-free seeds for subsequent cycles.",
        ],
        "warning": "Copper sprays during hot sunny hours can induce phytotoxicity.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Tomato Yellow Leaf Curl Virus",
        "crop": "Tomato",
        "slug": "tomato-tylcv",
        "primary_symptom": "chlorosis",
        "environmental_triggers": ["high_evapo"],
        "description": "Whitefly-vectored begomovirus. Severe upward leaf curling, pronounced interveinal chlorosis (yellowing), and stunted plant stature.",
        "severity_hint": "high",
        "confidence_base": 0.91,
        "recommendation_text": "Viral infection cannot be cured chemically. Eradicate whitefly vectors with neem oil (5 ml/L) or acetamiprid (0.4 g/L). Remove and destroy severely infected plants.",
        "steps": [
            "Uproot and destroy severely curled, stunted plants.",
            "Install yellow sticky traps (15–20 per acre) to monitor and catch whiteflies.",
            "Spray neem oil 10,000 ppm at 3 ml/L or thiamethoxam 25 WG at 0.3 g/L.",
            "Select TYLCV-tolerant hybrid cultivars for future seasons.",
        ],
        "warning": "Do not leave infected plants in the field; vector spread is rapid.",
        "escalate": True,
        "follow_up_days": 4,
    },
    {
        "disease": "Tomato Spider Mites",
        "crop": "Tomato",
        "slug": "tomato-spider-mites",
        "primary_symptom": "chlorosis",
        "environmental_triggers": ["low_moisture", "high_evapo"],
        "description": "Tetranychus urticae infestation. Fine chlorotic stippling on leaf upper surfaces with delicate silken webbing on leaf undersides during hot dry periods.",
        "severity_hint": "medium",
        "confidence_base": 0.80,
        "recommendation_text": "Spray with spiromesifen 22.9 SC (1 ml/L) or wettable sulphur (3 g/L). Increase field irrigation to raise canopy micro-humidity.",
        "steps": [
            "Direct spray thoroughly to the undersides of leaves where mites congregate.",
            "Apply spiromesifen or propargite at recommended doses.",
            "Increase irrigation frequency to discourage mite reproduction in dry conditions.",
            "Avoid excessive synthetic pyrethroid sprays that eliminate predatory mites.",
        ],
        "warning": "Do not apply sulphur sprays when temperatures exceed 34°C.",
        "escalate": False,
        "follow_up_days": 5,
    },
    {
        "disease": "Tomato Mosaic Virus",
        "crop": "Tomato",
        "slug": "tomato-mosaic-virus",
        "primary_symptom": "mosaic_mottle",
        "environmental_triggers": [],
        "description": "Tobamovirus infection. Mottled patches of alternating light green and dark green on leaves, blistering, and fern-like leaf distortion.",
        "severity_hint": "high",
        "confidence_base": 0.86,
        "recommendation_text": "No direct cure. Mechanically transmitted. Remove and bury infected plants, disinfect pruning tools with 10% TSP or bleach, and wash hands.",
        "steps": [
            "Isolate and carefully remove symptomatic plants.",
            "Disinfect stakes, clips, and pruning shears in 10% sodium hypochlorite.",
            "Wash hands with soap before touching healthy tomato plants.",
            "Prohibit smoking or tobacco handling near tomato crops.",
        ],
        "warning": "TMV remains active on dry plant debris for years.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Healthy Tomato",
        "crop": "Tomato",
        "slug": "tomato-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Vibrant, uniform green tomato foliage with balanced vegetative growth and no visible foliar lesions, spots, or viral curling.",
        "severity_hint": "low",
        "confidence_base": 0.94,
        "recommendation_text": "Tomato crop exhibits robust health. Continue balanced NPK fertigation, regular scouting for early whitefly or leaf spots, and standard drip watering.",
        "steps": [
            "Maintain scheduled balanced fertigation (NPK 19:19:19 + micronutrients).",
            "Scout leaf undersides twice weekly for early pest arrivals.",
            "Ensure regular drip cycles without waterlogging roots.",
            "Remove dry senescent lower leaves to preserve canopy airflow.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- COTTON ---
    {
        "disease": "Cotton Bacterial Blight",
        "crop": "Cotton",
        "slug": "cotton-bacterial-blight",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["high_moisture"],
        "description": "Xanthomonas citri pv. malvacearum infection (Angular Leaf Spot). Water-soaked lesions delineated by leaf veins turning angular, dark brown to black.",
        "severity_hint": "high",
        "confidence_base": 0.87,
        "recommendation_text": "Spray copper oxychloride 50% WP (2.5 g/L) tank-mixed with streptocycline (1 g/10 L). Avoid overhead irrigation during active vegetative development.",
        "steps": [
            "Apply copper oxychloride (2.5 g/L) + streptocycline (100 ppm) upon earliest lesion detection.",
            "Repeat treatment after 10–12 days if rainfall and overcast humidity continue.",
            "Clean and sanitize inter-cultivation tools between field blocks.",
            "Destroy fallen infested cotton leaves and debris post-harvest.",
        ],
        "warning": "High nitrogen application promotes excessive succulent growth vulnerable to blight.",
        "escalate": True,
        "follow_up_days": 7,
    },
    {
        "disease": "Cotton Bollworm Damage",
        "crop": "Cotton",
        "slug": "cotton-bollworm",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": [],
        "description": "Helicoverpa armigera / Spodoptera damage. Chewed irregular holes in leaves, punctured flower squares with flared bracts, and hollowed bolls.",
        "severity_hint": "high",
        "confidence_base": 0.89,
        "recommendation_text": "Install pheromone traps (5/acre for monitoring). Spray emamectin benzoate 5% SG (0.5 g/L) or chlorantraniliprole 18.5% SC (0.3 ml/L).",
        "steps": [
            "Set up pheromone traps to identify adult moth peak flights.",
            "Spray emamectin benzoate 5 SG at 0.5 g/L or spinosad 45 SC at 0.3 ml/L.",
            "Collect and destroy dropped flared squares and perforated bolls.",
            "Encourage natural predators like Trichogramma egg parasitoids.",
        ],
        "warning": "Alternate chemical modes of action to delay pest resistance.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Cotton Leaf Curl Virus",
        "crop": "Cotton",
        "slug": "cotton-leaf-curl",
        "primary_symptom": "chlorosis",
        "environmental_triggers": ["high_evapo"],
        "description": "Geminivirus transmitted by whitefly (Bemisia tabaci). Upward or downward cupping of leaves, thick dark green enations on veins, and stunted growth.",
        "severity_hint": "high",
        "confidence_base": 0.88,
        "recommendation_text": "Control the whitefly vector immediately with flonicamid 50 WG (0.3 g/L) or diafenthiuron 50 WP (1 g/L). Uproot early virus-infected cotton plants.",
        "steps": [
            "Spray flonicamid 50 WG (0.3 g/L) or pyriproxyfen 10 EC (1 ml/L).",
            "Eradicate weed hosts (Abutilon, Sida) along field bunds.",
            "Erect yellow sticky sheets across field borders.",
            "Use CLCuV-resistant Bt-cotton hybrids in subsequent Kharif seasons.",
        ],
        "warning": "Virus spreads rapidly through whitefly populations during dry spells.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Healthy Cotton",
        "crop": "Cotton",
        "slug": "cotton-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Vigorous cotton foliage with intact dark green palmate leaves, clean squares, and no angular spotting or leaf margin cupping.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Cotton crop is in excellent physiological health. Maintain balanced nitrogen-potash fertilization, monitor boll development, and check for sucking pests.",
        "steps": [
            "Follow balanced NPK split application; avoid excess early nitrogen.",
            "Inspect 20 random plants weekly for bollworm eggs or whiteflies.",
            "Maintain clean field borders free from malvaceous weed hosts.",
            "Ensure timely irrigation during square and boll formation stages.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- ONION ---
    {
        "disease": "Onion Purple Blotch",
        "crop": "Onion",
        "slug": "onion-purple-blotch",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["high_moisture"],
        "description": "Alternaria porri infection. Small sunken water-soaked spots on foliage that develop distinct purple-brown centers with concentric zones and yellow halos.",
        "severity_hint": "medium",
        "confidence_base": 0.86,
        "recommendation_text": "Spray tebuconazole 25.9% EC (1 ml/L) or mancozeb (2.5 g/L). Add an agricultural spreader/sticker (e.g. 0.5 ml/L) to penetrate waxy onion foliage.",
        "steps": [
            "Always include a non-ionic sticker/spreader in the spray mix for waxy onion leaves.",
            "Spray tebuconazole (1 ml/L) or azoxystrobin (1 ml/L) thoroughly.",
            "Repeat after 10–14 days if wet overcast weather persists.",
            "Avoid dense planting; maintain 15x10 cm spacing for bulb development.",
        ],
        "warning": "Spray without sticker will run off waxy onion leaves without effect.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Onion Thrips Damage",
        "crop": "Onion",
        "slug": "onion-thrips",
        "primary_symptom": "chlorosis",
        "environmental_triggers": ["low_moisture", "high_evapo"],
        "description": "Thrips tabaci feeding damage. Silvery white streaks, patches, and curled leaf tips caused by nymph and adult rasping, accompanied by small black frass dots.",
        "severity_hint": "medium",
        "confidence_base": 0.83,
        "recommendation_text": "Spray fipronil 5% SC (1 ml/L) or spinetoram 11.7 SC (0.8 ml/L) with sticker. Overhead sprinkler irrigation can physically dislodge thrips.",
        "steps": [
            "Direct spray into the central leaf sheath where thrips congregate.",
            "Mix sticker/spreader to maximize chemical adherence.",
            "Erect blue sticky traps (15 per acre) for thrips monitoring.",
            "Provide light sprinkler irrigation during hot dry spells.",
        ],
        "warning": "Thrips readily transmit Iris Yellow Spot Virus if unmanaged.",
        "escalate": False,
        "follow_up_days": 5,
    },
    {
        "disease": "Healthy Onion",
        "crop": "Onion",
        "slug": "onion-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Erect, cylindrical glaucous green onion leaves with smooth waxy bloom and no purple lesions, silver streaks, or tip dieback.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Onion foliage exhibits strong vigor and healthy bulb development. Continue regulated irrigation, stop watering 10 days before harvest.",
        "steps": [
            "Maintain regular shallow irrigation to prevent bulb splitting.",
            "Keep onion beds weed-free to maximize sunlight and airflow.",
            "Apply sulphate of potash during bulb enlargement stage.",
            "Withhold irrigation 10–15 days prior to harvest for curing.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- GRAPES ---
    {
        "disease": "Grape Downy Mildew",
        "crop": "Grapes",
        "slug": "grape-downy-mildew",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": ["high_moisture"],
        "description": "Plasmopara viticola oomycete infection. Translucent yellowish 'oil spots' on upper leaf surface with dense white cottony sporulation on the underside.",
        "severity_hint": "high",
        "confidence_base": 0.90,
        "recommendation_text": "Apply systemic cymoxanil + mancozeb (2 g/L) or dimethomorph (1 g/L) immediately. Thin canopy to improve sun penetration and ventilation.",
        "steps": [
            "Spray dimethomorph 50% WP (1 g/L) or famoxadone + cymoxanil (1 g/L).",
            "Ensure full coverage on the lower leaf surface where spores emerge.",
            "Prune inner dense shoots and water sprouts to aerate the canopy.",
            "Avoid micro-sprinklers that wet vine foliage during cool evenings.",
        ],
        "warning": "Downy mildew can decimate flower clusters and young berries in 48 hours.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Grape Powdery Mildew",
        "crop": "Grapes",
        "slug": "grape-powdery-mildew",
        "primary_symptom": "chlorosis",
        "environmental_triggers": ["moderate_moisture"],
        "description": "Erysiphe necator fungal infection. White to ash-grey powdery patches on both leaf surfaces, young shoots, and developing berries causing cracking.",
        "severity_hint": "medium",
        "confidence_base": 0.86,
        "recommendation_text": "Spray wettable sulphur 80% WDG (2.5 g/L) or penconazole 10% EC (0.5 ml/L). Maintain open canopy through shoot positioning.",
        "steps": [
            "Apply wettable sulphur at 2.5 g/L as a protective treatment.",
            "If powdery patches are established, use penconazole or hexaconazole.",
            "De-leaf around grape bunches to maximize air circulation.",
            "Spray during morning or late afternoon to prevent heat scorch.",
        ],
        "warning": "Do not mix sulphur with oil-based formulations.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Healthy Grapes",
        "crop": "Grapes",
        "slug": "grape-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Crisp, vibrant green vine foliage with balanced cane thickness, clean leaf blades, and no powdery mildew or oil spots.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Grapevines display excellent canopy balance. Continue shoot management, maintain canopy trellis ventilation, and monitor post-pruning cane development.",
        "steps": [
            "Maintain uniform shoot positioning along the trellis wires.",
            "Inspect underside of young leaves every 3–4 days after rains.",
            "Ensure balanced micronutrient foliar nutrition (B, Zn, Mg).",
            "Manage drip irrigation according to grape phenological stage.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- SUGARCANE ---
    {
        "disease": "Sugarcane Red Rot",
        "crop": "Sugarcane",
        "slug": "sugarcane-red-rot",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": ["high_moisture"],
        "description": "Colletotrichum falcatum infection. Third and fourth leaves yellow and wither from the tip; stalk interior reveals red discoloration with cross-wise white patches.",
        "severity_hint": "high",
        "confidence_base": 0.91,
        "recommendation_text": "No curative chemical once stalk is infected. Uproot and burn diseased clumps immediately. Apply carbendazim drench (1 g/L) around adjacent clumps.",
        "steps": [
            "Dig out and incinerate infected cane stools including root systems.",
            "Drench surrounding soil with carbendazim 50 WP at 2 g/L.",
            "Do not allow irrigation drainage water to flow from infected to healthy plots.",
            "Plant only hot-water treated disease-free setts in future crop cycles.",
        ],
        "warning": "Red rot is seed-borne and water-borne. Do not take ratoon from affected fields.",
        "escalate": True,
        "follow_up_days": 7,
    },
    {
        "disease": "Sugarcane Smut",
        "crop": "Sugarcane",
        "slug": "sugarcane-smut",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": [],
        "description": "Sporisorium scitamineum fungal infection. Long black whip-like unbranched structure emerging from terminal shoot with millions of black powdery spores.",
        "severity_hint": "medium",
        "confidence_base": 0.88,
        "recommendation_text": "Carefully bag the black whip structure in polythene to prevent spore escape, cut and burn. Spray propiconazole 25 EC (1 ml/L) on adjacent canes.",
        "steps": [
            "Enclose the smut whip in a plastic bag before severing it at the base.",
            "Burn infected whips outside the field to prevent windblown spore dispersion.",
            "Spray propiconazole at 1 ml/L across the stool perimeter.",
            "Avoid ratooning heavily infected sugarcane plots.",
        ],
        "warning": "Spreading spores during cutting without bagging will infect entire field.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Healthy Sugarcane",
        "crop": "Sugarcane",
        "slug": "sugarcane-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Robust, deep green sugarcane foliage with thick vigorous canes, clean leaf sheaths, and absence of red midrib lesions or smut whips.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Sugarcane crop displays optimum vegetative vigor. Continue balanced earthing-up, trash mulching, and scheduled furrow or drip irrigation.",
        "steps": [
            "Perform timely earthing-up to support root lodging resistance.",
            "Spread sugarcane trash mulch to conserve soil moisture.",
            "Maintain timely nitrogen splits up to 90 days after planting.",
            "Scout regularly for early borer symptoms (dead hearts).",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 21,
    },

    # --- SOYBEAN ---
    {
        "disease": "Soybean Rust",
        "crop": "Soybean",
        "slug": "soybean-rust",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["high_moisture"],
        "description": "Phakopsora pachyrhizi infection. Pinpoint chlorotic flecks enlarging into polygonal brown-tan pustules on the underside of leaves, causing premature defoliation.",
        "severity_hint": "high",
        "confidence_base": 0.89,
        "recommendation_text": "Spray hexaconazole 5% EC (1 ml/L) or tebuconazole 25.9% EC (1 ml/L) at the earliest sign of flecking on lower foliage.",
        "steps": [
            "Inspect lower leaf surfaces weekly during flowering and pod development.",
            "Apply hexaconazole (1 ml/L) or propiconazole (1 ml/L) at first symptom.",
            "Ensure spray droplets penetrate the dense inner soybean canopy.",
            "Repeat after 12–14 days if cool humid conditions continue.",
        ],
        "warning": "Soybean rust can cause 80% yield loss if left uncontrolled during pod fill.",
        "escalate": True,
        "follow_up_days": 7,
    },
    {
        "disease": "Healthy Soybean",
        "crop": "Soybean",
        "slug": "soybean-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Lush trifoliate green soybean leaves with clean undersides, active nodulation, and healthy podding without rust pustules or yellow mosaics.",
        "severity_hint": "low",
        "confidence_base": 0.94,
        "recommendation_text": "Soybean crop displays prime physiological development. Ensure moisture during critical flowering and pod-filling stages, inspect for pod borers.",
        "steps": [
            "Maintain soil moisture during critical flowering and pod development.",
            "Monitor weekly for girdle beetle or Spodoptera leaf defoliation.",
            "Avoid water stagnation around roots during heavy monsoon showers.",
            "Harvest promptly when 90% of pods turn golden brown.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- RICE ---
    {
        "disease": "Rice Blast",
        "crop": "Rice",
        "slug": "rice-blast",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["high_moisture"],
        "description": "Magnaporthe oryzae infection. Spindle-shaped lesions with pointed ends, grey-white centers, and brown margins on leaf blades (leaf blast) and collar.",
        "severity_hint": "high",
        "confidence_base": 0.90,
        "recommendation_text": "Spray tricyclazole 75% WP (0.6 g/L) or isoprothiolane 40% EC (1.5 ml/L). Avoid excessive nitrogen fertilizer applications.",
        "steps": [
            "Apply tricyclazole 75 WP at 0.6 g per litre of water immediately.",
            "Avoid top-dressing nitrogen when blast lesions are visible.",
            "Keep field water level uniform without drought stress.",
            "Repeat fungicide application at early panicle emergence for neck blast protection.",
        ],
        "warning": "Excess nitrogen promotes rapid blast expansion under overcast skies.",
        "escalate": True,
        "follow_up_days": 6,
    },
    {
        "disease": "Rice Bacterial Leaf Blight",
        "crop": "Rice",
        "slug": "rice-bacterial-blight",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": ["high_moisture"],
        "description": "Xanthomonas oryzae pv. oryzae infection. Water-soaked to yellowish-white wavy stripes starting from leaf margins and tips, with bacterial ooze beads in early morning.",
        "severity_hint": "high",
        "confidence_base": 0.88,
        "recommendation_text": "Spray copper hydroxide (2 g/L) + streptocycline (1 g/10 L). Drain excess standing field water for 2–3 days to arrest bacterial multiplication.",
        "steps": [
            "Drain excess water from the paddy field to reduce bacterial mobility.",
            "Apply copper hydroxide (2 g/L) and streptocycline (100 ppm).",
            "Delay remaining nitrogen split until new leaves emerge clean.",
            "Sterilize bunds and maintain proper crop spacing in future plantings.",
        ],
        "warning": "Do not work in wet paddy fields during active bacterial oozing.",
        "escalate": True,
        "follow_up_days": 6,
    },
    {
        "disease": "Healthy Rice",
        "crop": "Rice",
        "slug": "rice-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Vibrant upright green rice tillers with clean flag leaves, robust panicle emergence, and absence of blast spots or yellow leaf blight.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Paddy crop demonstrates excellent tillering and health. Maintain shallow submergence (3–5 cm) and monitor for stem borers and brown planthoppers.",
        "steps": [
            "Maintain 3–5 cm standing water layer during reproductive phase.",
            "Provide balanced potassium application to enhance stalk strength.",
            "Scout base of tillers for brown planthopper (BPH) colonies.",
            "Drain water 10 days before expected harvest for uniform ripening.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- POTATO ---
    {
        "disease": "Potato Late Blight",
        "crop": "Potato",
        "slug": "potato-late-blight",
        "primary_symptom": "blight_lesions",
        "environmental_triggers": ["high_moisture"],
        "description": "Phytophthora infestans infection on potato. Large water-soaked lesions turning dark brown to purplish-black with white mold margins under humid conditions.",
        "severity_hint": "high",
        "confidence_base": 0.90,
        "recommendation_text": "Apply metalaxyl + mancozeb (2.5 g/L) or cymoxanil immediately. Destroy infected haulms before harvest to safeguard tubers against tuber rot.",
        "steps": [
            "Spray systemic metalaxyl-mancozeb (2.5 g/L) immediately upon noticing dark lesions.",
            "Ensure full coverage under leaves and along stems.",
            "Cut and destroy haulms 10 days before harvesting tubers.",
            "Never store tubers harvested from late blight infected plots.",
        ],
        "warning": "Late blight can destroy a potato field in 4 to 5 days under humid conditions.",
        "escalate": True,
        "follow_up_days": 5,
    },
    {
        "disease": "Potato Early Blight",
        "crop": "Potato",
        "slug": "potato-early-blight",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["moderate_moisture"],
        "description": "Alternaria solani infection on potato. Dark brown angular concentric target spots on older leaves, causing yellowing and premature leaf drop.",
        "severity_hint": "medium",
        "confidence_base": 0.83,
        "recommendation_text": "Spray mancozeb (2.5 g/L) or chlorothalonil. Maintain balanced potassium fertilization and avoid drought stress.",
        "steps": [
            "Spray mancozeb 75% WP at 2.5 g per litre of water.",
            "Remove infected lower leaves to restrict spore splash.",
            "Maintain regular furrow irrigation to avoid moisture stress.",
            "Practice 3-year crop rotation with non-solanaceous crops.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Healthy Potato",
        "crop": "Potato",
        "slug": "potato-healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Dense, healthy deep-green potato canopy with vigorous stems and no concentric target spots or water-soaked blight lesions.",
        "severity_hint": "low",
        "confidence_base": 0.95,
        "recommendation_text": "Potato canopy shows excellent vegetative development. Maintain earthing up to prevent tuber greening, and scout for early blight on lower leaves.",
        "steps": [
            "Perform proper earthing up to protect developing tubers from sun exposure.",
            "Ensure consistent soil moisture during tuber initiation and bulking.",
            "Scout lower leaves twice weekly for early blight spots.",
            "De-haulm 10–12 days prior to harvest for tuber skin setting.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },

    # --- GENERAL / CROP-AGNOSTIC FALLBACK ---
    {
        "disease": "General Foliar Chlorosis",
        "crop": "General",
        "slug": "general-chlorosis",
        "primary_symptom": "chlorosis",
        "environmental_triggers": [],
        "description": "Widespread leaf yellowing (chlorosis) indicating nutrient deficiency (nitrogen or iron), soil over-saturation, or sucking pest pressure.",
        "severity_hint": "medium",
        "confidence_base": 0.78,
        "recommendation_text": "Check soil moisture to ensure roots are not waterlogged. Apply a foliar spray of chelated micronutrients (Zn, Fe, Mg) and balanced NPK.",
        "steps": [
            "Check soil moisture; if waterlogged, aerate soil and reduce watering.",
            "Apply foliar chelated micronutrient spray (2 g/L).",
            "Inspect leaf undersides with magnifying glass for aphids or thrips.",
            "Ensure soil pH is between 6.0 and 7.5 for optimal nutrient uptake.",
        ],
        "warning": "Over-fertilization can burn roots. Follow recommended doses.",
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "General Necrotic Leaf Spot",
        "crop": "General",
        "slug": "general-leaf-spot",
        "primary_symptom": "necrotic_spots",
        "environmental_triggers": ["moderate_moisture"],
        "description": "Fungal or bacterial necrotic leaf spotting characterized by localized dark dead spots on foliage.",
        "severity_hint": "medium",
        "confidence_base": 0.76,
        "recommendation_text": "Apply a broad-spectrum protective fungicide such as mancozeb (2.5 g/L) or copper hydroxide. Avoid overhead watering.",
        "steps": [
            "Remove heavily spotted lower leaves.",
            "Apply broad-spectrum protectant fungicide (mancozeb 2.5 g/L).",
            "Water at the base of plants; avoid wetting leaves.",
            "Improve spacing between plants for better airflow.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 7,
    },
    {
        "disease": "Healthy Plant",
        "crop": "General",
        "slug": "healthy",
        "primary_symptom": "healthy",
        "environmental_triggers": [],
        "description": "Healthy plant foliage exhibiting uniform chlorophyll coloration without significant necrosis, spotting, or viral curling.",
        "severity_hint": "low",
        "confidence_base": 0.94,
        "recommendation_text": "The plant appears healthy. Continue regular agricultural monitoring and maintain good watering and nutrition practices.",
        "steps": [
            "Continue regular watering according to crop needs.",
            "Inspect foliage weekly for early signs of disease.",
            "Remove dead or aging lower leaves.",
            "Maintain balanced fertilization.",
        ],
        "warning": None,
        "escalate": False,
        "follow_up_days": 14,
    },
]

# Backward compatibility alias
PLANTVILLAGE_CATALOG = AGRONOMIC_CATALOG

CONFIDENCE_CERTAIN = 0.80
CONFIDENCE_UNCERTAIN = 0.60


# ---------------------------------------------------------------------------
# Agronomic Vision Prediction Service (Real Feature Analysis + Environmental Fusion)
# ---------------------------------------------------------------------------

class AgronomicVisionPredictionService(PredictionService):
    """Real evidence-based prediction engine.

    Fuses:
    1. Visual features from image (chlorosis, necrosis, spot density, greenness)
    2. Target crop species constraints
    3. District environmental context (soil moisture, evapotranspiration)
    4. Regional outbreak alerts in Maharashtra
    """

    @property
    def name(self) -> str:
        return "AgronomicVisionPredictionEngine (Visual Symptom + Environmental Fusion)"

    @property
    def is_demo(self) -> bool:
        return False

    async def predict(self, image_bytes: bytes, context: dict[str, Any]) -> DiseasePrediction:
        """Run real vision and agronomic prediction pipeline."""
        # 1. Extract visual features from leaf pixels
        features: LeafVisualFeatures = extract_leaf_features(image_bytes)

        # 2. Determine and normalize target crop
        raw_crop = (context.get("crop_type") or "").strip()
        crop_norm = self._normalize_crop(raw_crop)

        # 3. Read environmental context
        district = context.get("district") or "Pune"
        soil_moisture = context.get("soil_moisture_percent")
        evapo = context.get("evapotranspiration_mm")
        active_outbreaks = context.get("active_outbreaks") or []

        # 4. Filter candidate catalog by crop
        candidates = [e for e in AGRONOMIC_CATALOG if self._crop_matches(e["crop"], crop_norm)]
        if not candidates:
            # Fallback to general candidates
            candidates = [e for e in AGRONOMIC_CATALOG if e["crop"] in ["General", "Tomato"]]

        # 5. Score candidates using visual, environmental, and outbreak signals
        scored_candidates: list[tuple[float, dict]] = []
        for cand in candidates:
            score = self._compute_candidate_score(cand, features, soil_moisture, evapo, active_outbreaks)
            scored_candidates.append((score, cand))

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        top_score, best_match = scored_candidates[0]
        # Calculate normalized confidence (0.60 - 0.96 for disease, up to 0.98 for healthy)
        is_healthy = best_match["primary_symptom"] == "healthy"
        if is_healthy:
            confidence = round(min(0.98, max(0.75, top_score * 0.95)), 3)
        else:
            confidence = round(min(0.96, max(0.65, top_score * 0.92)), 3)

        # Check uncertainty condition
        uncertainty = False
        if not features.is_plant_tissue_detected:
            uncertainty = True
            confidence = 0.52
        elif len(scored_candidates) > 1:
            second_score, _ = scored_candidates[1]
            if (top_score - second_score) < 0.04 and not is_healthy:
                uncertainty = True

        severity, _ = self.estimate_severity(confidence, best_match["disease"])
        if uncertainty:
            severity = Severity.MEDIUM if severity == Severity.LOW else severity

        # Build top alternative diagnoses
        alternatives: list[dict] = []
        for alt_score, alt_cand in scored_candidates[1:3]:
            if alt_cand["disease"] != best_match["disease"]:
                alt_conf = round(min(0.85, max(0.45, alt_score * 0.80)), 3)
                alternatives.append({
                    "disease": alt_cand["disease"],
                    "crop": alt_cand["crop"],
                    "confidence": alt_conf,
                })

        # Assemble environmental context
        env_summary = {
            "district": district,
            "soil_moisture_percent": soil_moisture,
            "evapotranspiration_mm": evapo,
        }

        # Evidence descriptions combining visual and environmental observations
        evidence = list(features.evidence_descriptions)
        if soil_moisture is not None:
            if soil_moisture > 32.0:
                evidence.append(f"High soil moisture ({soil_moisture}%) elevated fungal blight risk.")
            elif soil_moisture < 20.0:
                evidence.append(f"Dry soil ({soil_moisture}%) elevates mite & thrips vulnerability.")
        if any(best_match["disease"].lower() in str(o).lower() for o in active_outbreaks):
            evidence.append(f"Active outbreak reported in {district} district.")

        return DiseasePrediction(
            disease=best_match["disease"],
            crop=best_match["crop"] if best_match["crop"] != "General" else (raw_crop or "General"),
            confidence=confidence,
            severity=severity,
            uncertainty_flag=uncertainty,
            description=best_match["description"],
            disease_slug=best_match["slug"],
            is_demo=False,
            model_source=self.name,
            alternatives=alternatives,
            visual_evidence=evidence,
            environmental_context=env_summary,
        )

    async def recommend(self, prediction: DiseasePrediction, context: dict) -> Recommendation:
        """Return localized agronomic recommendation for the diagnosed condition."""
        entry = next(
            (e for e in AGRONOMIC_CATALOG if e["disease"] == prediction.disease),
            None,
        )
        if not entry:
            entry = next(
                (e for e in AGRONOMIC_CATALOG if e["slug"] == "healthy"),
                AGRONOMIC_CATALOG[-1],
            )

        context_lines: list[str] = []
        if district := context.get("district"):
            context_lines.append(f"District: {district}")
        if soil_moisture := context.get("soil_moisture_percent"):
            context_lines.append(f"Soil Moisture: {soil_moisture}%")
        if evapo := context.get("evapotranspiration_mm"):
            context_lines.append(f"Evapo: {evapo} mm")

        return Recommendation(
            disease=prediction.disease,
            recommendation_text=entry["recommendation_text"],
            steps=entry.get("steps", []),
            warning=entry.get("warning"),
            escalate=entry.get("escalate", False),
            follow_up_days=entry.get("follow_up_days", 7),
            context=" | ".join(context_lines) if context_lines else None,
        )

    def estimate_severity(self, confidence: float, disease: str) -> tuple[Severity, bool]:
        """Determine severity and uncertainty from confidence score and agronomic profile."""
        entry = next((e for e in AGRONOMIC_CATALOG if e["disease"] == disease), None)
        severity_hint = entry["severity_hint"] if entry else "medium"

        if confidence >= CONFIDENCE_CERTAIN:
            return Severity(severity_hint), False
        elif confidence >= CONFIDENCE_UNCERTAIN:
            return Severity.MEDIUM, True
        else:
            return Severity.HIGH, True

    def _normalize_crop(self, raw: str) -> str:
        """Map user input to canonical crop species."""
        c = raw.strip().lower()
        if "tomato" in c:
            return "Tomato"
        elif "cotton" in c or "kapas" in c:
            return "Cotton"
        elif "onion" in c or "pyaaz" in c or "kanda" in c:
            return "Onion"
        elif "grape" in c or "draksh" in c or "angoor" in c:
            return "Grapes"
        elif "sugarcane" in c or "ganna" in c or "oos" in c:
            return "Sugarcane"
        elif "potato" in c or "batata" in c or "aloo" in c:
            return "Potato"
        elif "soybean" in c or "soya" in c:
            return "Soybean"
        elif "rice" in c or "paddy" in c or "dhan" in c or "bhat" in c:
            return "Rice"
        return "General"

    def _crop_matches(self, catalog_crop: str, target_crop: str) -> bool:
        """Check if candidate belongs to target crop."""
        if target_crop == "General":
            return True
        if catalog_crop == target_crop:
            return True
        if catalog_crop == "General":
            return True
        return False

    def _compute_candidate_score(
        self,
        candidate: dict,
        features: LeafVisualFeatures,
        soil_moisture: float | None,
        evapo: float | None,
        active_outbreaks: list,
    ) -> float:
        """Compute matching likelihood score."""
        primary_sym = candidate["primary_symptom"]
        base = candidate["confidence_base"]
        score = base

        # 1. Visual symptom match
        if primary_sym == "healthy":
            if features.healthy_green_ratio > 0.65 and features.necrosis_ratio < 0.10 and features.chlorosis_ratio < 0.15:
                score += 0.12 * features.healthy_green_ratio
            else:
                score -= 0.35 * (features.necrosis_ratio + features.chlorosis_ratio)

        elif primary_sym == "blight_lesions":
            if features.necrosis_ratio > 0.18 or features.dominant_symptom == "blight_lesions":
                score += 0.10 + (features.necrosis_ratio * 0.15)
            else:
                score -= 0.25 * features.healthy_green_ratio

        elif primary_sym == "necrotic_spots":
            if features.spot_density > 0.20 or features.necrosis_ratio > 0.10:
                score += 0.08 + (features.spot_density * 0.12)
            else:
                score -= 0.20 * features.healthy_green_ratio

        elif primary_sym == "chlorosis":
            if features.chlorosis_ratio > 0.22 or features.dominant_symptom == "chlorosis":
                score += 0.10 + (features.chlorosis_ratio * 0.15)
            else:
                score -= 0.20 * features.healthy_green_ratio

        elif primary_sym == "mosaic_mottle":
            if features.mosaic_mottling_score > 0.40:
                score += 0.12 * features.mosaic_mottling_score
            else:
                score -= 0.15

        # 2. Environmental context correlation
        triggers = candidate.get("environmental_triggers", [])
        if soil_moisture is not None:
            if "high_moisture" in triggers and soil_moisture > 30.0:
                score += 0.05
            elif "low_moisture" in triggers and soil_moisture < 22.0:
                score += 0.05

        if evapo is not None:
            if "high_evapo" in triggers and evapo > 3.0:
                score += 0.05

        # 3. Regional outbreak correlation
        for out in active_outbreaks:
            out_str = str(out).lower()
            if candidate["disease"].lower() in out_str or candidate["slug"] in out_str:
                score += 0.06
                break

        return max(0.1, min(1.0, score))


# ---------------------------------------------------------------------------
# Demo / Seed Prediction Service (Legacy Rule-Based Fallback)
# ---------------------------------------------------------------------------

class DemoPredictionService(PredictionService):
    """Legacy demo prediction service for backward compatibility."""

    def __init__(self, seed: int | None = 42):
        self._seed = seed

    @property
    def name(self) -> str:
        return "DemoPredictionService (Rule-Based Legacy)"

    @property
    def is_demo(self) -> bool:
        return True

    async def predict(self, image_bytes: bytes, context: dict[str, Any]) -> DiseasePrediction:
        # Backward-compatible deterministic fallback
        hash_val = int(hashlib.md5(image_bytes[:8192]).hexdigest(), 16)
        rng = random.Random(hash_val)

        entry = rng.choice(AGRONOMIC_CATALOG)
        confidence = entry["confidence_base"]
        confidence = round(max(0.5, min(0.98, confidence + rng.uniform(-0.05, 0.05))), 3)
        severity, uncertainty = self.estimate_severity(confidence, entry["disease"])

        others = [e for e in AGRONOMIC_CATALOG if e["disease"] != entry["disease"]]
        alternatives = [
            {
                "disease": e["disease"],
                "crop": e["crop"],
                "confidence": round(e["confidence_base"] * rng.uniform(0.6, 0.9), 3),
            }
            for e in rng.sample(others, min(2, len(others)))
        ]

        return DiseasePrediction(
            disease=entry["disease"],
            crop=entry["crop"],
            confidence=confidence,
            severity=severity,
            uncertainty_flag=uncertainty,
            description=entry["description"],
            disease_slug=entry["slug"],
            is_demo=True,
            model_source=self.name,
            alternatives=alternatives,
            visual_evidence=["Legacy hash-based demo prediction."],
            environmental_context={},
        )

    async def recommend(self, prediction: DiseasePrediction, context: dict) -> Recommendation:
        entry = next(
            (e for e in AGRONOMIC_CATALOG if e["disease"] == prediction.disease),
            AGRONOMIC_CATALOG[-1],
        )
        return Recommendation(
            disease=prediction.disease,
            recommendation_text=entry["recommendation_text"],
            steps=entry.get("steps", []),
            warning=entry.get("warning"),
            escalate=entry.get("escalate", False),
            follow_up_days=entry.get("follow_up_days", 7),
        )

    def estimate_severity(self, confidence: float, disease: str) -> tuple[Severity, bool]:
        if confidence >= CONFIDENCE_CERTAIN:
            entry = next((e for e in AGRONOMIC_CATALOG if e["disease"] == disease), None)
            severity_hint = entry["severity_hint"] if entry else "medium"
            return Severity(severity_hint), False
        elif confidence >= CONFIDENCE_UNCERTAIN:
            return Severity.MEDIUM, True
        else:
            return Severity.HIGH, True


# ---------------------------------------------------------------------------
# Factory function
# ---------------------------------------------------------------------------

def get_prediction_service(mode: str = "vision") -> PredictionService:
    """Return the primary agronomic vision prediction service.

    Defaults to AgronomicVisionPredictionService which uses real visual feature
    extraction and environmental context.
    """
    if mode == "legacy_demo":
        return DemoPredictionService()
    return AgronomicVisionPredictionService()


async def predict_and_recommend(
    image_bytes: bytes,
    context: dict,
    mode: str = "vision",
) -> tuple[DiseasePrediction, Recommendation]:
    """Convenience function to run the full prediction + recommendation pipeline."""
    service = get_prediction_service(mode)
    prediction = await service.predict(image_bytes, context)
    recommendation = await service.recommend(prediction, context)
    return prediction, recommendation

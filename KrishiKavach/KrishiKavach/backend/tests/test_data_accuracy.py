"""Comprehensive test suite for data accuracy, visual diagnosis, and environmental fusion.

Verifies:
1. Normal inputs across major Maharashtra crops (Tomato, Cotton, Onion, Grapes, Sugarcane)
2. Crop consistency (strictly preventing cross-crop misattribution)
3. Determinism and reproducibility (identical inputs produce identical results)
4. Environmental context integration (soil moisture and evapotranspiration lookup)
5. Boundary and negative cases (non-leaf blank imagery, corrupted inputs, unknown district)
6. End-to-end FastAPI endpoint integration
"""
import asyncio
import io
from PIL import Image, ImageDraw

from app.services.image_analysis import extract_leaf_features
from app.services.prediction import (
    AgronomicVisionPredictionService,
    AGRONOMIC_CATALOG,
    predict_and_recommend,
)


def make_test_image(mode: str = "healthy", size: tuple[int, int] = (200, 200)) -> bytes:
    """Helper to generate synthetic leaf images with known optical properties."""
    if mode == "healthy":
        img = Image.new("RGB", size, (40, 140, 40))
    elif mode == "chlorosis":
        img = Image.new("RGB", size, (220, 205, 30))
    elif mode == "necrotic_spots":
        img = Image.new("RGB", size, (45, 125, 45))
        draw = ImageDraw.Draw(img)
        # Draw 40 dark necrotic lesions
        for i in range(40):
            x = (i * 23) % (size[0] - 30) + 10
            y = (i * 29) % (size[1] - 30) + 10
            draw.ellipse([x, y, x + 24, y + 24], fill=(28, 18, 12))
    elif mode == "blank_white":
        img = Image.new("RGB", size, (255, 255, 255))
    elif mode == "blank_black":
        img = Image.new("RGB", size, (0, 0, 0))
    else:
        img = Image.new("RGB", size, (128, 128, 128))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


class TestDataAccuracyAndPrediction:
    """Test suite verifying agronomic diagnosis accuracy and data integrity."""

    def test_healthy_green_leaf_diagnosis(self):
        """A uniform green leaf on Tomato must classify as Healthy Tomato with high confidence."""
        async def _run():
            img_bytes = make_test_image("healthy")
            context = {"crop_type": "Tomato", "district": "Pune"}
            pred, rec = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Tomato"
            assert pred.disease == "Healthy Tomato"
            assert pred.confidence >= 0.85
            assert pred.severity.value == "low"
            assert pred.uncertainty_flag is False
            assert any("healthy green" in ev.lower() for ev in pred.visual_evidence)
            assert rec.follow_up_days == 14
        asyncio.run(_run())

    def test_chlorosis_yellow_leaf_diagnosis(self):
        """A chlorotic yellow leaf on Tomato must classify as Yellow Leaf Curl with significant chlorosis evidence."""
        async def _run():
            img_bytes = make_test_image("chlorosis")
            context = {"crop_type": "Tomato", "district": "Pune"}
            pred, rec = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Tomato"
            assert "Yellow Leaf Curl" in pred.disease or "Chlorosis" in pred.disease
            assert pred.confidence >= 0.80
            assert any("chlorosis" in ev.lower() or "yellow" in ev.lower() for ev in pred.visual_evidence)
        asyncio.run(_run())

    def test_cotton_crop_consistency(self):
        """Cotton crop with necrotic lesions must be diagnosed as a Cotton disease, NEVER Tomato or Potato."""
        async def _run():
            img_bytes = make_test_image("necrotic_spots")
            context = {"crop_type": "Cotton", "district": "Aurangabad"}
            pred, rec = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Cotton"
            assert pred.disease.startswith("Cotton")
            # Ensure no cross-species misattribution
            assert "Tomato" not in pred.disease
            assert "Potato" not in pred.disease
            assert "Grapes" not in pred.disease
        asyncio.run(_run())

    def test_onion_crop_consistency(self):
        """Onion crop must diagnose within Onion catalog (e.g. Purple Blotch or Healthy Onion)."""
        async def _run():
            img_bytes = make_test_image("necrotic_spots")
            context = {"crop_type": "Onion", "district": "Nashik"}
            pred, _ = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Onion"
            assert pred.disease.startswith("Onion")
            assert "Tomato" not in pred.disease
        asyncio.run(_run())

    def test_grapes_crop_consistency(self):
        """Grapes crop must diagnose within Grapes conditions."""
        async def _run():
            img_bytes = make_test_image("healthy")
            context = {"crop_type": "Grapes", "district": "Solapur"}
            pred, _ = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Grapes"
            assert pred.disease == "Healthy Grapes"
        asyncio.run(_run())

    def test_sugarcane_crop_consistency(self):
        """Sugarcane crop must diagnose within Sugarcane conditions."""
        async def _run():
            img_bytes = make_test_image("healthy")
            context = {"crop_type": "Sugarcane", "district": "Kolhapur"}
            pred, _ = await predict_and_recommend(img_bytes, context)
            assert pred.crop == "Sugarcane"
            assert pred.disease == "Healthy Sugarcane"
        asyncio.run(_run())

    def test_deterministic_reproducibility(self):
        """Identical input image + crop + district must yield 100% identical diagnosis and confidence."""
        async def _run():
            img_bytes = make_test_image("necrotic_spots")
            context = {"crop_type": "Tomato", "district": "Pune"}
            pred1, _ = await predict_and_recommend(img_bytes, context)
            pred2, _ = await predict_and_recommend(img_bytes, context)
            assert pred1.disease == pred2.disease
            assert pred1.confidence == pred2.confidence
            assert pred1.uncertainty_flag == pred2.uncertainty_flag
            assert pred1.severity == pred2.severity
        asyncio.run(_run())

    def test_blank_non_leaf_image_flagged_uncertain(self):
        """A blank non-plant image must be detected and flagged with uncertainty."""
        async def _run():
            img_bytes = make_test_image("blank_white")
            context = {"crop_type": "Tomato", "district": "Pune"}
            pred, _ = await predict_and_recommend(img_bytes, context)
            assert pred.uncertainty_flag is True
            assert pred.confidence <= 0.65
        asyncio.run(_run())

    def test_environmental_context_injection(self):
        """Environmental moisture and evapo data must be accepted and reflected in prediction context."""
        async def _run():
            img_bytes = make_test_image("necrotic_spots")
            context = {
                "crop_type": "Tomato",
                "district": "Pune",
                "soil_moisture_percent": 38.5,
                "evapotranspiration_mm": 3.75,
                "active_outbreaks": ["Tomato Late Blight"],
            }
            pred, _ = await predict_and_recommend(img_bytes, context)
            assert pred.environmental_context["soil_moisture_percent"] == 38.5
            assert pred.environmental_context["evapotranspiration_mm"] == 3.75
            assert any("soil moisture" in ev.lower() for ev in pred.visual_evidence)
        asyncio.run(_run())


class TestFeatureExtractor:
    """Test suite for leaf visual feature extraction."""

    def test_extract_healthy_green(self):
        img_bytes = make_test_image("healthy")
        features = extract_leaf_features(img_bytes)

        assert features.is_valid_image is True
        assert features.is_plant_tissue_detected is True
        assert features.healthy_green_ratio > 0.85
        assert features.chlorosis_ratio < 0.10
        assert features.dominant_symptom == "healthy"

    def test_extract_chlorosis(self):
        img_bytes = make_test_image("chlorosis")
        features = extract_leaf_features(img_bytes)

        assert features.is_valid_image is True
        assert features.chlorosis_ratio > 0.85
        assert features.dominant_symptom == "chlorosis"

    def test_extract_corrupted_bytes(self):
        corrupted = b"not-a-valid-image-file"
        features = extract_leaf_features(corrupted)

        assert features.is_valid_image is False
        assert features.dominant_symptom == "invalid_image"


class TestDatabaseAndCatalogIntegrity:
    """Verify catalog rules and schema constraints."""

    def test_catalog_slug_uniqueness_and_correctness(self):
        """Every entry in AGRONOMIC_CATALOG must have valid fields and unique slugs."""
        slugs = set()
        for entry in AGRONOMIC_CATALOG:
            assert "disease" in entry and entry["disease"]
            assert "crop" in entry and entry["crop"]
            assert "slug" in entry and entry["slug"]
            assert "recommendation_text" in entry and len(entry["recommendation_text"]) > 20
            assert "steps" in entry and len(entry["steps"]) >= 2
            assert entry["slug"] not in slugs, f"Duplicate slug: {entry['slug']}"
            slugs.add(entry["slug"])

    def test_no_misspelled_slugs(self):
        """Ensure previous typos like tomato-seeptoria-leaf-spot are resolved."""
        slugs = [e["slug"] for e in AGRONOMIC_CATALOG]
        assert "tomato-seeptoria-leaf-spot" not in slugs
        assert "tomato-septoria-leaf-spot" in slugs


class TestFastAPIEndpoints:
    """End-to-end API integration tests."""

    def test_health_endpoint(self):
        async def _run():
            from app.main import app
            from httpx import AsyncClient, ASGITransport
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.get("/health")
                assert resp.status_code == 200
                data = resp.json()
                assert data["status"] == "ok"
        asyncio.run(_run())

    def test_weather_district_endpoint(self):
        async def _run():
            from app.main import app
            from httpx import AsyncClient, ASGITransport
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                resp = await client.get("/api/weather/Pune")
                assert resp.status_code == 200
                data = resp.json()
                assert data["district"] == "Pune"
                assert data["soil_moisture_percent"] is not None
                assert data["evapotranspiration_mm"] is not None
        asyncio.run(_run())

    def test_predict_and_create_case_endpoint(self):
        async def _run():
            from app.main import app
            from httpx import AsyncClient, ASGITransport
            img_bytes = make_test_image("healthy")
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                files = {"file": ("test_leaf.jpg", img_bytes, "image/jpeg")}
                data = {"crop_type": "Tomato", "district": "Pune", "farmer_language": "marathi"}
                resp = await client.post("/api/predict", files=files, data=data)
                assert resp.status_code == 200
                result = resp.json()
                assert "case_id" in result
                assert result["prediction"]["disease"] == "Healthy Tomato"
                assert result["prediction"]["crop"] == "Tomato"
                assert len(result["prediction"]["visual_evidence"]) > 0
                assert result["prediction"]["environmental_context"]["district"] == "Pune"
        asyncio.run(_run())

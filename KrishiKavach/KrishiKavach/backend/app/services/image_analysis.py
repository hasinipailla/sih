"""Image feature extraction and plant symptom analysis for KrishiKavach.

Uses Pillow and NumPy to extract objective, deterministic agronomic visual features
from plant and leaf imagery:
- Plant canopy segmentation
- Chlorosis (yellowing) ratio
- Necrosis (brown/black dead tissue) ratio
- Concentric and angular leaf spot density
- Healthy green chlorophyll ratio
- Mosaic virus mottling variance
"""
from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image


@dataclass
class LeafVisualFeatures:
    """Objective visual features extracted from leaf imagery."""
    is_valid_image: bool
    is_plant_tissue_detected: bool
    plant_pixel_fraction: float
    healthy_green_ratio: float
    chlorosis_ratio: float
    necrosis_ratio: float
    spot_density: float
    mosaic_mottling_score: float
    dominant_symptom: str
    evidence_descriptions: list[str] = field(default_factory=list)


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    """Convert RGB float array [0, 255] to HSV [H(0-360), S(0-1), V(0-1)]."""
    rgb_norm = rgb / 255.0
    r = rgb_norm[:, :, 0]
    g = rgb_norm[:, :, 1]
    b = rgb_norm[:, :, 2]

    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin

    # Hue calculation
    h = np.zeros_like(cmax)
    mask = delta > 1e-5

    # R is max
    r_mask = mask & (cmax == r)
    h[r_mask] = (60 * ((g[r_mask] - b[r_mask]) / delta[r_mask]) + 360) % 360

    # G is max
    g_mask = mask & (cmax == g)
    h[g_mask] = (60 * ((b[g_mask] - r[g_mask]) / delta[g_mask]) + 120) % 360

    # B is max
    b_mask = mask & (cmax == b)
    h[b_mask] = (60 * ((r[b_mask] - g[b_mask]) / delta[b_mask]) + 240) % 360

    # Saturation
    s = np.zeros_like(cmax)
    cmax_pos = cmax > 1e-5
    s[cmax_pos] = delta[cmax_pos] / cmax[cmax_pos]

    # Value
    v = cmax

    return np.stack([h, s, v], axis=-1)


def extract_leaf_features(image_bytes: bytes) -> LeafVisualFeatures:
    """Extract agronomic visual features from leaf image bytes."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        # Resize to standardized dimensions for uniform feature density
        img = img.resize((224, 224), Image.Resampling.BILINEAR)
    except Exception as e:
        return LeafVisualFeatures(
            is_valid_image=False,
            is_plant_tissue_detected=False,
            plant_pixel_fraction=0.0,
            healthy_green_ratio=0.0,
            chlorosis_ratio=0.0,
            necrosis_ratio=0.0,
            spot_density=0.0,
            mosaic_mottling_score=0.0,
            dominant_symptom="invalid_image",
            evidence_descriptions=["Could not decode image file."],
        )

    arr = np.array(img, dtype=np.float32)
    hsv = rgb_to_hsv(arr)
    h = hsv[:, :, 0]
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]

    # Plant tissue segmentation
    # Plant material is usually green, yellow, olive, brown, or purplish
    # Exclude bright white, pure grey/black backgrounds, or intense artificial blues
    is_greenish = (h >= 50) & (h <= 165) & (s > 0.12) & (v > 0.10)
    is_yellowish = (h >= 28) & (h < 50) & (s > 0.20) & (v > 0.15)
    is_brown_necrotic = (h >= 8) & (h < 35) & (s > 0.15) & (v < 0.55) & (v > 0.05)
    is_dark_spot = (v < 0.22) & (s > 0.10)

    plant_mask = is_greenish | is_yellowish | is_brown_necrotic | is_dark_spot
    total_pixels = 224 * 224
    plant_pixel_count = int(np.sum(plant_mask))
    plant_fraction = plant_pixel_count / total_pixels

    if plant_pixel_count < (total_pixels * 0.05):
        # Very little plant tissue detected
        return LeafVisualFeatures(
            is_valid_image=True,
            is_plant_tissue_detected=False,
            plant_pixel_fraction=round(plant_fraction, 3),
            healthy_green_ratio=0.0,
            chlorosis_ratio=0.0,
            necrosis_ratio=0.0,
            spot_density=0.0,
            mosaic_mottling_score=0.0,
            dominant_symptom="non_plant_or_unclear",
            evidence_descriptions=["No clear plant foliage detected in image frame."],
        )

    # Calculate symptom ratios relative to plant tissue
    healthy_green_pixels = int(np.sum(is_greenish & (h >= 65) & (h <= 150) & (s > 0.20) & (v > 0.18)))
    chlorosis_pixels = int(np.sum(is_yellowish | ((h >= 30) & (h < 58) & (s > 0.25))))
    necrosis_pixels = int(np.sum(is_brown_necrotic | is_dark_spot))

    healthy_green_ratio = round(healthy_green_pixels / plant_pixel_count, 3)
    chlorosis_ratio = round(chlorosis_pixels / plant_pixel_count, 3)
    necrosis_ratio = round(necrosis_pixels / plant_pixel_count, 3)

    # Spot analysis using local contrast on V-channel within plant mask
    v_plant = np.where(plant_mask, v, 0.5)
    # Simple discrete Laplacian kernel for edge/spot detection
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    # 2D correlation via slicing
    diff = np.abs(
        v_plant[1:-1, 2:] + v_plant[1:-1, :-2] + v_plant[2:, 1:-1] + v_plant[:-2, 1:-1] - 4 * v_plant[1:-1, 1:-1]
    )
    inner_mask = plant_mask[1:-1, 1:-1]
    spot_density = 0.0
    if np.sum(inner_mask) > 0:
        spot_intensity = np.mean(diff[inner_mask])
        spot_density = round(min(1.0, float(spot_intensity) * 6.5), 3)

    # Mosaic / mottling variance
    # Measures variation of green hue across green segments
    green_hues = h[is_greenish]
    mosaic_score = 0.0
    if len(green_hues) > 100:
        std_hue = float(np.std(green_hues))
        mosaic_score = round(min(1.0, std_hue / 25.0), 3)

    # Determine dominant symptom and build explanation evidence
    evidence: list[str] = []
    if healthy_green_ratio > 0.70 and necrosis_ratio < 0.08 and chlorosis_ratio < 0.12:
        dominant = "healthy"
        evidence.append(f"High uniform chlorophyll coverage ({int(healthy_green_ratio * 100)}% healthy green).")
    elif necrosis_ratio > 0.25:
        dominant = "blight_lesions"
        evidence.append(f"Extensive necrotic tissue ({int(necrosis_ratio * 100)}% dark lesions).")
    elif spot_density > 0.40 and necrosis_ratio > 0.10:
        dominant = "necrotic_spots"
        evidence.append(f"High concentration of localized dark spots (spot density {spot_density}).")
    elif chlorosis_ratio > 0.30:
        dominant = "chlorosis"
        evidence.append(f"Significant foliar chlorosis/yellowing ({int(chlorosis_ratio * 100)}% yellow tissue).")
    elif mosaic_score > 0.55:
        dominant = "mosaic_mottle"
        evidence.append(f"Irregular mottled leaf pigmentation detected (variance score {mosaic_score}).")
    elif necrosis_ratio > 0.12:
        dominant = "necrotic_spots"
        evidence.append(f"Early necrotic lesions observed ({int(necrosis_ratio * 100)}% affected foliage).")
    else:
        dominant = "mild_symptom"
        evidence.append("Mild foliar variation detected.")

    if spot_density > 0.25 and "spot" not in dominant:
        evidence.append(f"Noticeable leaf spotting present (density index {spot_density}).")
    if chlorosis_ratio > 0.15 and "chlorosis" not in dominant:
        evidence.append(f"Secondary yellowing margins ({int(chlorosis_ratio * 100)}%).")

    return LeafVisualFeatures(
        is_valid_image=True,
        is_plant_tissue_detected=True,
        plant_pixel_fraction=round(plant_fraction, 3),
        healthy_green_ratio=healthy_green_ratio,
        chlorosis_ratio=chlorosis_ratio,
        necrosis_ratio=necrosis_ratio,
        spot_density=spot_density,
        mosaic_mottling_score=mosaic_score,
        dominant_symptom=dominant,
        evidence_descriptions=evidence,
    )

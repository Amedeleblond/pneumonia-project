import time
from pathlib import Path
import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Configuration matching the Colab training notebook
IMG_SIZE = 224
MODELS_DIR = Path("models")
FRONTEND_DIR = Path("frontend")

MODEL_CONFIG = {
    "cnn": {
        "path": MODELS_DIR / "model_custom_cnn.keras",
        "threshold": 0.555,
    },
    "densenet": {
        "path": MODELS_DIR / "model_densenet121.keras",
        "threshold": 0.508,
    },
}

app = FastAPI(title="Pneumonia Classification API")

# Allow requests from localhost / 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CLAHE with the exact same parameters used during training
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

# Load available models once at startup
loaded_models = {}
for key, cfg in MODEL_CONFIG.items():
    if cfg["path"].exists():
        print(f"Loading model '{key}' from {cfg['path']}...")
        model = tf.keras.models.load_model(cfg["path"])
        # Warm-up pass to avoid slow first inference
        dummy_input = np.zeros((1, IMG_SIZE, IMG_SIZE, 1), dtype="float32")
        _ = model(dummy_input, training=False)
        loaded_models[key] = model
        print(f"Model '{key}' ready.")
    else:
        print(f"Warning: '{cfg['path']}' not found. Model '{key}' will be unavailable.")


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes, apply CLAHE, resize to 224x224, and format as a 4D tensor."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Invalid or corrupted image file.")

    img = clahe.apply(img)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    return img.astype("float32")[None, ..., None]


def run_inference(model_key: str, tensor: np.ndarray) -> dict:
    """Run fast direct inference and return prediction, probability, and elapsed time."""
    model = loaded_models[model_key]
    threshold = MODEL_CONFIG[model_key]["threshold"]

    start_time = time.perf_counter()
    # Direct call with training=False is much faster than model.predict() for a single image
    pneumonia_prob = float(model(tensor, training=False).numpy()[0, 0])
    elapsed_time = time.perf_counter() - start_time

    if pneumonia_prob >= threshold:
        prediction = "PNEUMONIA"
        confidence = pneumonia_prob
    else:
        prediction = "NORMAL"
        confidence = 1.0 - pneumonia_prob

    return {
        "prediction": prediction,
        "probability": round(confidence, 4),
        "inference_time": round(elapsed_time, 3),
    }


@app.get("/health")
def health_check():
    """Health endpoint polled by the frontend on startup."""
    return {"status": "ok", "loaded_models": list(loaded_models.keys())}


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: str = Form("both"),
):
    if model not in ("cnn", "densenet", "both"):
        raise HTTPException(status_code=400, detail="Invalid model selection.")

    requested_keys = ["cnn", "densenet"] if model == "both" else [model]
    missing_keys = [k for k in requested_keys if k not in loaded_models]
    if missing_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Model file(s) missing on server: {', '.join(missing_keys)}.",
        )

    try:
        image_bytes = await file.read()
        tensor = preprocess_image(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {exc}")

    results = {key: run_inference(key, tensor) for key in requested_keys}
    return {"results": results}


# Serve the frontend directly on http://127.0.0.1:8000
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
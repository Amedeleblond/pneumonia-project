Remplace le contenu de ton **`README.md`** par cette version centrée sur l'installation pas à pas pour tes camarades (Can, Hanieh et Khadija) et les deux méthodes pour récupérer les radiographies de test :

```markdown
# Chest X-Ray Pneumonia Classification — Local Setup & Testing Guide

Web application for binary chest X-ray classification (**NORMAL** vs. **PNEUMONIA**) comparing a **Custom CNN** and a fine-tuned **DenseNet-121** model through a unified FastAPI server and web interface.

---

## 1. Prerequisites

- **Python 3.10 or 3.11** (64-bit)
- **Git**

---

## 2. Clone & Install on Your Machine

Open a terminal (PowerShell, Command Prompt, or macOS/Linux Terminal) and run:

```bash
git clone [https://github.com/Amedeleblond/pneumonia-project.git](https://github.com/Amedeleblond/pneumonia-project.git)
cd pneumonia-project
pip install -r requirements.txt

```

> **Note:** Both pre-trained model files (`models/model_custom_cnn.keras` and `models/model_densenet121.keras`) are already included in the repository—no training is required.

---

## 3. Obtain the Chest X-Ray Dataset (for Testing)

Because the full dataset exceeds 1 GB, the `data/` folder is excluded from GitHub. Use **either** method below to get X-ray images for testing:

### Option A — Automatic Download Script (Recommended)

Run the included download script from the project root directory:

```bash
python download_data.py

```

This downloads and organizes the dataset into `data/train/`, `data/val/`, and `data/test/`.

### Option B — Manual Download from Kaggle

If you do not have Kaggle API credentials configured locally:

1. Download the **Chest X-Ray Images (Pneumonia)** dataset directly from Kaggle:
[https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia)
2. Extract the archive and place the `chest_xray` contents into a `data/` folder at the root of the project:
```text
pneumonia-project/
└── data/
    ├── test/
    │   ├── NORMAL/       <-- Pick healthy X-ray images here
    │   └── PNEUMONIA/    <-- Pick pneumonia X-ray images here
    ├── train/
    └── val/

```



---

## 4. Launch the Server

From the `pneumonia-project` root folder, start the FastAPI server:

```bash
uvicorn server:app --host 127.0.0.1 --port 8000

```

Wait until both models finish loading and warming up:

```text
Model 'cnn' ready.
Model 'densenet' ready.
INFO:     Uvicorn running on [http://127.0.0.1:8000](http://127.0.0.1:8000) (Press CTRL+C to quit)

```

*(TensorFlow CPU optimization messages in the terminal are normal and can be ignored.)*

---

## 5. Test the Web Interface

1. Open **[http://127.0.0.1:8000](https://www.google.com/url?sa=E&source=gmail&q=http://127.0.0.1:8000)** in your browser.
2. Confirm that the status dot in the top-right corner is green (**Backend Connected**).
3. Drag and drop (or click **browse files**) to select an X-ray image from `data/test/NORMAL/` or `data/test/PNEUMONIA/`.
4. Select **Custom CNN** (threshold `0.555`), **DenseNet121** (threshold `0.508`), or **Both Models** to compare them side by side.
5. Click **Analyze X-ray** to view the predicted class, confidence probability, and inference time.

To stop the server when finished, press **`Ctrl + C`** in the terminal.

---

## Team Members

* **Amede Leblond Djoubi**
* **Khadija Sabir**
* **Can Dogan**
* **Hanieh Satari**


```

---



/* =========================================
   DOM ELEMENTS
========================================= */

const elements = {

    imagePreview: document.getElementById("image-preview"),

    fileName: document.getElementById("file-name"),

    uploadPlaceholder: document.getElementById("upload-placeholder"),

    previewContainer: document.getElementById("preview-container"),

    analyzeButton: document.getElementById("analyze-button"),

    analyzeButtonText: document.getElementById("analyze-button-text"),

    loadingSpinner: document.getElementById("loading-spinner"),

    uploadMessage: document.getElementById("upload-message"),

    backendIndicator: document.getElementById("backend-indicator"),

    backendStatus: document.getElementById("backend-status"),

    resultsStatus: document.getElementById("results-status")

};


/* =========================================
   IMAGE PREVIEW
========================================= */

export function showPreview(file, previewUrl) {

    elements.imagePreview.src = previewUrl;

    elements.fileName.textContent = file.name;

    elements.uploadPlaceholder.classList.add("hidden");

    elements.previewContainer.classList.remove("hidden");

    elements.analyzeButton.disabled = false;

    clearMessage();

}


export function removePreview() {

    elements.imagePreview.removeAttribute("src");

    elements.fileName.textContent = "";

    elements.previewContainer.classList.add("hidden");

    elements.uploadPlaceholder.classList.remove("hidden");

    elements.analyzeButton.disabled = true;

    resetResults();

    clearMessage();

}


/* =========================================
   BACKEND STATUS
========================================= */

export function setBackendStatus(isOnline) {

    elements.backendIndicator.classList.toggle(
        "online",
        isOnline
    );

    elements.backendIndicator.classList.toggle(
        "offline",
        !isOnline
    );


    elements.backendStatus.textContent = isOnline
        ? "Backend Connected"
        : "Backend Offline";

}


/* =========================================
   LOADING STATE
========================================= */

export function setLoading(isLoading) {

    elements.analyzeButton.disabled = isLoading;

    elements.analyzeButtonText.textContent = isLoading
        ? "Analyzing..."
        : "Analyze X-ray";


    elements.loadingSpinner.classList.toggle(
        "hidden",
        !isLoading
    );

}


/* =========================================
   USER MESSAGES
========================================= */

export function showMessage(message, type = "error") {

    elements.uploadMessage.textContent = message;

    elements.uploadMessage.className = `message ${type}`;

}


export function clearMessage() {

    elements.uploadMessage.textContent = "";

    elements.uploadMessage.className = "message hidden";

}


/* =========================================
   MODEL ELEMENTS
========================================= */

function getModelElements(model) {

    const prefix = model === "cnn"
        ? "cnn"
        : "densenet";


    return {

        prediction: document.getElementById(
            `${prefix}-prediction`
        ),

        probability: document.getElementById(
            `${prefix}-probability`
        ),

        time: document.getElementById(
            `${prefix}-time`
        ),

        message: document.getElementById(
            `${prefix}-message`
        )

    };

}


/* =========================================
   RESET ONE MODEL
========================================= */

function resetModelResult(
    model,
    message = "Waiting for analysis."
) {

    const ui = getModelElements(model);


    ui.prediction.textContent = "Waiting for analysis";

    ui.prediction.className = "prediction waiting";

    ui.probability.textContent = "—";

    ui.time.textContent = "—";

    ui.message.textContent = message;

}


/* =========================================
   RESET ALL RESULTS
========================================= */

export function resetResults() {

    resetModelResult("cnn");

    resetModelResult("densenet");

    elements.resultsStatus.textContent = "Waiting for analysis";

}


/* =========================================
   FORMAT PROBABILITY
========================================= */

function formatProbability(value) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    ) {

        return "Not provided";

    }


    return new Intl.NumberFormat("en-US", {

        style: "percent",

        maximumFractionDigits: 1

    }).format(value);

}


/* =========================================
   FORMAT INFERENCE TIME
========================================= */

function formatTime(value) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    ) {

        return "Not provided";

    }


    return `${value.toFixed(3)} s`;

}


/* =========================================
   RENDER ONE MODEL RESULT
========================================= */

function renderModelResult(model, result) {

    const ui = getModelElements(model);


    const prediction = String(
        result.prediction || ""
    ).toUpperCase();


    if (!["NORMAL", "PNEUMONIA"].includes(prediction)) {

        throw new Error(
            `Invalid prediction returned for ${model}.`
        );

    }


    ui.prediction.textContent = prediction;

    ui.prediction.className =
        `prediction ${prediction.toLowerCase()}`;


    ui.probability.textContent = formatProbability(
        result.probability
    );


    ui.time.textContent = formatTime(
        result.inference_time
    );


    ui.message.textContent =
        "Analysis completed successfully.";

}


/* =========================================
   RENDER RESULTS
========================================= */

export function renderResults(data) {

    if (
        !data ||
        typeof data.results !== "object" ||
        data.results === null ||
        Array.isArray(data.results)
    ) {

        throw new Error(
            "Invalid response received from the backend."
        );

    }


    const results = data.results;

    const allowedModels = [
        "cnn",
        "densenet"
    ];


    const returnedModels = Object.keys(results);


    if (
        returnedModels.length === 0 ||
        returnedModels.some(
            model => !allowedModels.includes(model)
        )
    ) {

        throw new Error(
            "The backend returned unsupported model results."
        );

    }


    // Validate all model results first.

    for (const model of returnedModels) {

        const result = results[model];


        if (
            !result ||
            typeof result !== "object" ||
            Array.isArray(result) ||
            !["NORMAL", "PNEUMONIA"].includes(
                String(result.prediction || "").toUpperCase()
            )
        ) {

            throw new Error(
                `Invalid classification result for ${model}.`
            );

        }

    }


    // CUSTOM CNN

    if (results.cnn) {

        renderModelResult(
            "cnn",
            results.cnn
        );

    } else {

        resetModelResult(
            "cnn",
            "This model was not selected for this analysis."
        );

    }


    // DENSENET121

    if (results.densenet) {

        renderModelResult(
            "densenet",
            results.densenet
        );

    } else {

        resetModelResult(
            "densenet",
            "This model was not selected for this analysis."
        );

    }


    // UPDATE STATUS

    elements.resultsStatus.textContent =
        returnedModels.length === 2
            ? "Both models analyzed"
            : "Single model analyzed";

}


/* =========================================
   IMPORTS
========================================= */

import {
    checkHealth,
    predict
} from "./api.js";


import {
    showPreview,
    removePreview,
    setBackendStatus,
    setLoading,
    showMessage,
    clearMessage,
    resetResults,
    renderResults
} from "./ui.js";


/* =========================================
   DOM ELEMENTS
========================================= */

const imageInput = document.getElementById("image-input");

const browseButton = document.getElementById("browse-button");

const removeImageButton = document.getElementById("remove-image");

const analyzeButton = document.getElementById("analyze-button");

const uploadArea = document.getElementById("upload-area");


/* =========================================
   APPLICATION STATE
========================================= */

let selectedFile = null;

let previewUrl = null;


const allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp"

];


const maxFileSize = 10 * 1024 * 1024;


/* =========================================
   BACKEND INITIALIZATION
========================================= */

async function initializeBackend() {

    try {

        await checkHealth();

        setBackendStatus(true);

    } catch {

        setBackendStatus(false);

    }

}


/* =========================================
   MODEL SELECTION
========================================= */

function getSelectedModel() {

    const selected = document.querySelector(
        'input[name="model"]:checked'
    );


    return selected?.value || "both";

}


/* =========================================
   FILE VALIDATION
========================================= */

function validateFile(file) {

    if (!file) {

        showMessage(
            "Please select an X-ray image."
        );

        return false;

    }


    if (!allowedTypes.includes(file.type)) {

        showMessage(
            "Invalid image format. Please use JPG, PNG or WEBP."
        );

        return false;

    }


    if (file.size > maxFileSize) {

        showMessage(
            "File size exceeds the 10 MB limit."
        );

        return false;

    }


    if (file.size === 0) {

        showMessage(
            "The selected file is empty."
        );

        return false;

    }


    return true;

}


/* =========================================
   FILE SELECTION
========================================= */

function handleFileSelection(file) {

    clearMessage();


    if (!validateFile(file)) {

        return;

    }


    if (previewUrl) {

        URL.revokeObjectURL(previewUrl);

        previewUrl = null;

    }


    selectedFile = file;

    previewUrl = URL.createObjectURL(file);


    showPreview(
        file,
        previewUrl
    );


    resetResults();

}


/* =========================================
   REMOVE IMAGE
========================================= */

function handleRemoveImage() {

    if (previewUrl) {

        URL.revokeObjectURL(previewUrl);

        previewUrl = null;

    }


    selectedFile = null;

    imageInput.value = "";


    removePreview();

}


/* =========================================
   ANALYZE IMAGE
========================================= */

async function handleAnalysis() {

    if (!selectedFile) {

        showMessage(
            "Please upload an X-ray image before analysis."
        );

        return;

    }


    const model = getSelectedModel();


    clearMessage();

    resetResults();

    setLoading(true);


    try {

        const response = await predict(
            selectedFile,
            model
        );


        renderResults(response);


    } catch (error) {

        showMessage(
            error.message || "An unexpected error occurred."
        );


        if (
            error.message?.includes(
                "Cannot connect to the backend"
            )
        ) {

            setBackendStatus(false);

        }


    } finally {

        setLoading(false);

    }

}


/* =========================================
   FILE INPUT EVENT
========================================= */

imageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];


    if (file) {

        handleFileSelection(file);

    }

});


/* =========================================
   BROWSE BUTTON EVENT
========================================= */

browseButton.addEventListener("click", () => {

    imageInput.click();

});


/* =========================================
   REMOVE IMAGE EVENT
========================================= */

removeImageButton.addEventListener("click", () => {

    handleRemoveImage();

});


/* =========================================
   ANALYZE BUTTON EVENT
========================================= */

analyzeButton.addEventListener("click", () => {

    handleAnalysis();

});


/* =========================================
   DRAG AND DROP
========================================= */

uploadArea.addEventListener("dragover", (event) => {

    event.preventDefault();

    uploadArea.classList.add("drag-over");

});


uploadArea.addEventListener("dragleave", (event) => {

    if (!uploadArea.contains(event.relatedTarget)) {

        uploadArea.classList.remove("drag-over");

    }

});


uploadArea.addEventListener("drop", (event) => {

    event.preventDefault();

    uploadArea.classList.remove("drag-over");


    const file = event.dataTransfer.files[0];


    if (file) {

        imageInput.value = "";

        handleFileSelection(file);

    }

});


/* =========================================
   MODEL CHANGE
========================================= */

document.querySelectorAll(
    'input[name="model"]'
).forEach((radio) => {

    radio.addEventListener("change", () => {

        clearMessage();

        resetResults();

    });

});


/* =========================================
   APPLICATION INITIALIZATION
========================================= */

resetResults();

initializeBackend();

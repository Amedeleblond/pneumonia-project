
/* =========================================
   API CONFIGURATION
========================================= */

export const API_BASE_URL = "http://127.0.0.1:8000";

const REQUEST_TIMEOUT = 120000;


/* =========================================
   RESPONSE HANDLER
========================================= */

async function readResponse(response) {

    const contentType = response.headers.get("content-type") || "";

    let data = null;


    if (contentType.includes("application/json")) {

        try {

            data = await response.json();

        } catch {

            throw new Error(
                "The server returned an invalid JSON response."
            );

        }

    } else {

        const text = await response.text();

        data = text ? { detail: text } : null;

    }


    if (!response.ok) {

        const detail = data?.detail;

        let message;


        if (typeof detail === "string") {

            message = detail;

        } else if (Array.isArray(detail)) {

            message = detail
                .map(item => item.msg || JSON.stringify(item))
                .join(", ");

        } else {

            message = `Server error (${response.status}).`;

        }


        throw new Error(message);

    }


    return data;

}


/* =========================================
   FETCH WRAPPER
========================================= */

async function apiRequest(endpoint, options = {}) {

    const controller = new AbortController();

    const timeout = setTimeout(() => {

        controller.abort();

    }, REQUEST_TIMEOUT);


    try {

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                signal: controller.signal
            }
        );


        return await readResponse(response);


    } catch (error) {

        if (error.name === "AbortError") {

            throw new Error(
                "The request timed out. Model inference may take longer than expected."
            );

        }


        if (error instanceof TypeError) {

            throw new Error(
                "Cannot connect to the backend. Please check whether the FastAPI server is running."
            );

        }


        throw error;


    } finally {

        clearTimeout(timeout);

    }

}


/* =========================================
   BACKEND HEALTH CHECK
========================================= */

export async function checkHealth() {

    return await apiRequest("/health", {

        method: "GET"

    });

}


/* =========================================
   PREDICTION REQUEST
========================================= */

export async function predict(file, model) {

    if (!file) {

        throw new Error(
            "Please select an X-ray image."
        );

    }


    const supportedModels = [
        "cnn",
        "densenet",
        "both"
    ];


    if (!supportedModels.includes(model)) {

        throw new Error(
            "Invalid model selection."
        );

    }


    const formData = new FormData();

    formData.append("file", file);

    formData.append("model", model);


    return await apiRequest("/predict", {

        method: "POST",

        body: formData

    });

}

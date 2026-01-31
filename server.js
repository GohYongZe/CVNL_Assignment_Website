/**
 * Express backend – proxies API requests to Hugging Face Spaces.
 * Intent: https://DanishCodes-CVNLAIINTENT.hf.space/predict
 */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// External API URLs
const INTENT_API_URL = "https://DanishCodes-CVNLAIINTENT.hf.space/predict";

app.use(cors());
app.use(express.json());

/**
 * POST /api/predict/intent
 * Forwards body to HF Space. Expected body: { "text": "which flights to dubai" }
 */
app.post("/api/predict/intent", async (req, res) => {
  try {
    const body = req.body;
    const response = await fetch(INTENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Intent API error:", err);
    res.status(502).json({
      error: "Proxy error",
      message: err.message || "Could not reach intent API",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Intent: POST http://localhost:${PORT}/api/predict/intent`);
});

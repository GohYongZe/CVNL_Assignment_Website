// app.js
// ==============================
// Backend base URL – local Express server (run: npm start)
// For production, set to your deployed API URL.
// ==============================
const API_BASE_URL = "http://localhost:3001";

// Optional: if your endpoints differ, change these:
const ENDPOINTS = {
  aircraft: "/predict/aircraft", // expects multipart/form-data { file }
  intent: "/api/predict/intent", // proxied via Express to HF Space
  emotion: "/predict/emotion"   // expects JSON { text }
};

// Emotion label -> Material Symbol icon name
// Feel free to adjust labels to match exactly what your model returns.
const EMOTION_ICON_MAP = [
  { match: ["positive", "happy", "joy", "excited", "satisfied"], icon: "sentiment_very_satisfied" },
  { match: ["neutral", "calm", "okay"], icon: "sentiment_neutral" },
  { match: ["negative", "sad", "angry", "frustrated", "upset", "disappointed"], icon: "sentiment_dissatisfied" },
];

// If your model returns lots of custom labels, you can add more rows above.
function iconForEmotion(label = "") {
  const lower = label.toLowerCase();
  for (const row of EMOTION_ICON_MAP) {
    if (row.match.some((k) => lower.includes(k))) return row.icon;
  }
  // fallback if no match
  return "mood";
}

// Small helpers
const $ = (sel) => document.querySelector(sel);

function setStatus(el, msg, type = "info") {
  // type: info | success | error
  el.textContent = msg || "";
  el.className =
    "mt-4 text-sm font-semibold " +
    (type === "success"
      ? "text-primary"
      : type === "error"
      ? "text-red-400"
      : "text-slate-500 dark:text-[#92c9c9]");
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.originalText ||= btn.innerHTML;

  if (loading) {
    btn.innerHTML = `
      <span class="material-symbols-outlined animate-spin">progress_activity</span>
      Processing...
    `;
    btn.classList.add("opacity-80");
  } else {
    btn.innerHTML = btn.dataset.originalText;
    btn.classList.remove("opacity-80");
  }
}

// Update the right-side result panel
function updateResult({ title, confidence, iconName }) {
  const titleEl = $("#resultTitle");
  const confEl = $("#resultConfidence");
  const barEl = $("#resultBar");
  const iconEl = $("#resultIcon");

  if (titleEl) titleEl.textContent = title ?? "—";
  if (confEl) confEl.textContent = confidence != null ? `${confidence.toFixed(1)}%` : "—";
  if (barEl) barEl.style.width = confidence != null ? `${Math.max(0, Math.min(100, confidence))}%` : "0%";
  if (iconEl && iconName) iconEl.textContent = iconName;
}

// ==============================
// Aircraft (CNN) — image upload
// ==============================
async function runAircraft() {
  const fileInput = $("#aircraftFile");
  const btn = $("#aircraftBtn");
  const status = $("#statusMsg");

  if (!fileInput?.files?.[0]) {
    setStatus(status, "Please upload an aircraft image first.", "error");
    return;
  }

  setStatus(status, "", "info");
  setLoading(btn, true);

  try {
    // PLACEHOLDER: your backend should accept multipart/form-data
    const form = new FormData();
    form.append("file", fileInput.files[0]);

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.aircraft}`, {
      method: "POST",
      body: form
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    // Expected response shape (change if yours differs):
    // { label: "Airbus A350-900", confidence: 0.994 }
    const label = data.label ?? "Unknown";
    const confPct = data.confidence != null ? data.confidence * 100 : null;

    updateResult({ title: label, confidence: confPct, iconName: "flight_takeoff" });
    setStatus(status, "Classification completed.", "success");
  } catch (e) {
    console.error(e);
    setStatus(status, "Could not reach the model API. Check API URL / CORS / endpoint.", "error");
  } finally {
    setLoading(btn, false);
  }
}

// ==============================
// Intent (RNN) — text
// ==============================
async function runIntent() {
  const textarea = $("#intentText");
  const btn = $("#intentBtn");
  const status = $("#statusMsg");

  const text = textarea?.value?.trim();
  if (!text) {
    setStatus(status, "Please type/paste a message first.", "error");
    return;
  }

  setStatus(status, "", "info");
  setLoading(btn, true);

  try {
    // PLACEHOLDER: your backend should accept JSON { text }
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.intent}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    // API returns: { intent: "flight", confidence: 0.7767 }
    const label = data.intent ?? data.label ?? "Unknown";
    const confPct = data.confidence != null ? data.confidence * 100 : null;

    updateResult({ title: label, confidence: confPct, iconName: "chat_bubble" });
    setStatus(status, "Intent analysis completed.", "success");
  } catch (e) {
    console.error(e);
    setStatus(status, "Could not reach the model API. Check API URL / CORS / endpoint.", "error");
  } finally {
    setLoading(btn, false);
  }
}

// ==============================
// Emotion (RNN) — text
// ==============================
async function runEmotion() {
  const textarea = $("#emotionText");
  const btn = $("#emotionBtn");
  const status = $("#statusMsg");

  const text = textarea?.value?.trim();
  if (!text) {
    setStatus(status, "Please paste a message first.", "error");
    return;
  }

  setStatus(status, "", "info");
  setLoading(btn, true);

  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.emotion}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    // Expected:
    // { label: "Positive / Happy", confidence: 0.968 }
    const label = data.label ?? "Unknown";
    const confPct = data.confidence != null ? data.confidence * 100 : null;

    updateResult({ title: label, confidence: confPct, iconName: "mood" });
    setStatus(status, "Emotion classification completed.", "success");
  } catch (e) {
    console.error(e);
    setStatus(status, "Could not reach the model API. Check API URL / CORS / endpoint.", "error");
  } finally {
    setLoading(btn, false);
  }
}

// Page router (decides which handler to attach)
window.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "aircraft") {
    $("#aircraftBtn")?.addEventListener("click", runAircraft);
  }
  if (page === "intent") {
    $("#intentBtn")?.addEventListener("click", runIntent);
  }
  if (page === "emotion") {
    $("#emotionBtn")?.addEventListener("click", runEmotion);
  }
});

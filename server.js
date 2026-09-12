const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

// These come from environment variables (set in Railway's Variables tab)
// so your API key is never exposed in the code or browser.
const PANEL_URL = process.env.PANEL_URL;       // e.g. https://panel.magmanode.com
const API_KEY = process.env.PTERO_API_KEY;     // your Client API key
const SERVER_ID = process.env.SERVER_ID;       // the short server identifier

async function sendPowerSignal(signal) {
  const res = await fetch(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ signal }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Panel API error ${res.status}: ${text}`);
  }
}

async function getStatus() {
  const res = await fetch(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Panel API error ${res.status}`);
  const data = await res.json();
  return data.attributes.current_state; // 'running', 'offline', 'starting', 'stopping'
}

app.post('/start', async (req, res) => {
  try {
    await sendPowerSignal('start');
    res.json({ ok: true, message: 'Start signal sent.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/stop', async (req, res) => {
  try {
    await sendPowerSignal('stop');
    res.json({ ok: true, message: 'Stop signal sent.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get('/status', async (req, res) => {
  try {
    const state = await getStatus();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server control panel running on port ${PORT}`));

const { GoogleAuth } = require('google-auth-library');

function _getFetch() {
  // Use node-fetch directly so tests can mock it; avoid using global.fetch which may perform real network calls in some Node versions
  return require('node-fetch');
}

// Simple Vertex AI Generative text call using REST and service account auth
async function generateWithVertex(prompt, options = {}) {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const model = process.env.VERTEX_MODEL; // e.g., 'text-bison@001' or 'chat-bison@001'

  if (!project || !model) {
    throw new Error('Vertex configuration missing (GCP_PROJECT_ID or VERTEX_MODEL)');
  }

  // Build endpoint
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) throw new Error('Failed to get access token for Vertex');

  const body = {
    instances: [{ content: prompt }],
    parameters: {
      temperature: options.temperature || 0.2,
      maxOutputTokens: options.maxOutputTokens || 1024
    }
  };

  const fetch = _getFetch();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.token || token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vertex returned ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = await res.json();
  // Attempt to extract text depending on model response shape
  // Typical: json.predictions[0].content or json.predictions[0].text
  const pred = json.predictions && json.predictions[0];
  if (!pred) throw new Error('No prediction from Vertex');
  const text = pred.content || pred.output || pred.text || JSON.stringify(pred);
  return text;
}

async function validateVertex() {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const model = process.env.VERTEX_MODEL;

  if (!project) throw new Error('GCP_PROJECT_ID is not set');

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) throw new Error('Unable to obtain access token from GoogleAuth');

  // If model specified, verify model metadata endpoint is reachable
  if (model) {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}`;
    const fetch = _getFetch();
    const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token.token || token}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Vertex model check failed: ${res.status} ${txt.slice(0, 200)}`);
    }
    return { ok: true, modelAvailable: true };
  }

  return { ok: true, modelAvailable: false };
}

module.exports = { generateWithVertex, validateVertex };

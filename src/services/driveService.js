/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * driveService.js — Google Drive upload via Google Apps Script proxy.
 *
 * Flow:
 *  1. Convert File → base64 (FileReader, tracked for encoding progress)
 *  2. POST base64 payload to the Apps Script web app URL (XHR, tracked for upload progress)
 *  3. Apps Script decodes → uploads to Google Drive → makes public → returns URL
 *  4. We return the permanent Google Drive direct download URL
 *
 * No backend server needed. The Apps Script is deployed from script.google.com
 * using YOUR Google account and runs completely free within Google's quota.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const DRIVE_SECRET = import.meta.env.VITE_DRIVE_SECRET;
const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a File to a base64 string.
 * Reports encoding progress via `onProgress` (0–50 represents the encoding phase
 * in a combined 0–100 scale shared with upload).
 */
function fileToBase64(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        // Encoding = first 40% of the overall progress
        onProgress(Math.round((evt.loaded / evt.total) * 40));
      }
    };
    reader.onload = () => {
      const result = reader.result;
      // Strip the data URL prefix (e.g. "data:audio/mpeg;base64,")
      const base64 = result.split(',')[1];
      if (base64) {
        onProgress?.(40); // encoding done
        resolve(base64);
      } else {
        reject(new Error('Failed to encode file as base64'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error: ' + reader.error?.message));
    reader.readAsDataURL(file);
  });
}

/**
 * POST the base64 payload to the Apps Script endpoint.
 *
 * WHY fetch() instead of XHR:
 *  Google Apps Script Web Apps respond with a 302 redirect before serving
 *  the actual JSON. XHR triggers onerror() on this redirect due to CORS
 *  opaque redirect handling. fetch() with redirect:'follow' handles it cleanly.
 *
 *  Trade-off: we lose real upload progress events on the XHR upload phase,
 *  so we simulate progress with a timer during the upload phase (40→90%).
 */
async function postToAppsScript(payload, onProgress) {
  const url = APPS_SCRIPT_URL;
  if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') {
    throw new Error(
      'VITE_APPS_SCRIPT_URL is not set in your .env file.\n' +
      'Deploy apps-script/Code.gs to Google Apps Script and paste the URL.'
    );
  }

  const body = JSON.stringify({
    ...payload,
    secret: DRIVE_SECRET ?? '',
    folderId: DRIVE_FOLDER_ID ?? '',   // Custom Drive folder ID (optional)
  });

  // Simulate upload progress (40% → 90%) with a timer while we wait for the response
  let simulatedPct = 40;
  const progressInterval = setInterval(() => {
    if (simulatedPct < 88) {
      simulatedPct += 3;
      onProgress?.(simulatedPct);
    }
  }, 600);

  try {
    const response = await fetch(url, {
      method: 'POST',
      // text/plain avoids CORS preflight — Apps Script receives the raw JSON body
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',   // ← follows the Apps Script 302 redirect correctly
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      throw new Error(`Apps Script returned HTTP ${response.status}. Check that the deployment is set to "Anyone" access.`);
    }

    const text = await response.text();

    // Apps Script sometimes wraps the JSON in a callback — handle plain JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Unexpected response from Apps Script: ' + text.slice(0, 200));
    }

    if (!data.success) {
      throw new Error(data.error || 'Apps Script reported failure with no error message.');
    }

    onProgress?.(100);
    return { fileId: data.fileId, url: data.url };

  } catch (err) {
    clearInterval(progressInterval);
    // Re-throw with a friendlier message if it's a network/CORS error
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
      throw new Error(
        'Could not reach the Apps Script endpoint. Possible causes:\n' +
        '1. The deployment "Who has access" must be set to "Anyone" (not Google account).\n' +
        '2. The VITE_APPS_SCRIPT_URL in .env is incorrect.\n' +
        '3. You need to restart the dev server after editing .env.'
      );
    }
    throw err;
  }
}


// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload an audio file to Google Drive via the Apps Script proxy.
 * Returns the permanent public Google Drive download URL.
 */
export async function uploadAudioToDrive(file, songId, onProgress) {
  const MAX_BASE64_MB = 24; // ~32MB Apps Script limit ÷ 1.33 base64 overhead
  if (file.size > MAX_BASE64_MB * 1024 * 1024) {
    throw new Error(
      `Audio file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
      `Maximum size via Google Drive upload is ${MAX_BASE64_MB} MB. ` +
      `Try compressing the MP3 or trimming the track.`
    );
  }

  onProgress?.(0);
  const base64 = await fileToBase64(file, onProgress);

  const result = await postToAppsScript(
    {
      fileName: file.name,
      mimeType: file.type || 'audio/mpeg',
      data: base64,
      type: 'audio',
      songId,
    },
    onProgress,
  );

  return result.url;
}

/**
 * Upload a cover image to Google Drive via the Apps Script proxy.
 * Returns the permanent public Google Drive view URL.
 */
export async function uploadCoverToDrive(file, songId, onProgress) {
  const MAX_COVER_MB = 10;
  if (file.size > MAX_COVER_MB * 1024 * 1024) {
    throw new Error(`Cover image must be under ${MAX_COVER_MB} MB.`);
  }

  onProgress?.(0);
  const base64 = await fileToBase64(file, onProgress);

  const result = await postToAppsScript(
    {
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      data: base64,
      type: 'cover',
      songId,
    },
    onProgress,
  );

  return result.url;
}

/**
 * Check if Google Drive uploads are configured (Apps Script URL is set).
 */
export const isDriveConfigured = !!APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE';


// ─── Audio Streaming Proxy ───────────────────────────────────────────────────
// Google Drive URLs (uc?export=download) don't work directly as <audio> src
// because Google returns redirects and HTML pages instead of raw audio data.
// This proxy fetches the file through our Apps Script (which CAN access the
// Drive file) and returns it as base64 JSON. We then decode it into a blob URL
// that the browser's <audio> element can play natively.
// ─────────────────────────────────────────────────────────────────────────────

/** Cache of blob URLs keyed by Google Drive file ID — avoids re-downloading. */
const audioBlobCache = new Map();

/**
 * Extract the Google Drive file ID from various URL formats.
 * Returns null if the URL is not a recognized Drive URL.
 */
function extractDriveFileId(url) {
  if (!url) return null;
  // Format: ...?mode=stream&id=FILE_ID  (our proxy URL)
  const matchProxy = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchProxy) return matchProxy[1];
  // Format: https://drive.google.com/uc?export=download&id=FILE_ID
  const matchUc = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchUc) return matchUc[1];
  // Format: https://drive.google.com/file/d/FILE_ID/...
  const matchPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchPath) return matchPath[1];
  return null;
}

/**
 * Check if a URL is a Google Drive URL that needs proxying.
 * Local blob: URLs and data: URLs don't need proxying.
 */
export function isDriveUrl(url) {
  if (!url) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('drive.usercontent.google.com') ||
    url.includes('mode=stream')
  );
}

/**
 * Fetch an audio file from Google Drive through the Apps Script proxy,
 * decode the base64 response, and return a blob URL that <audio> can play.
 *
 * Results are cached by file ID so replaying a song doesn't re-download it.
 *
 * @param {string} driveUrl — A Google Drive URL or proxy URL containing a file ID
 * @returns {Promise<string>} — A blob: URL that the browser can play
 */
export async function fetchAudioBlobUrl(driveUrl) {
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) {
    throw new Error('Could not extract file ID from URL: ' + driveUrl);
  }

  // Return cached blob URL if available
  if (audioBlobCache.has(fileId)) {
    return audioBlobCache.get(fileId);
  }

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    throw new Error('VITE_APPS_SCRIPT_URL is not configured — cannot proxy audio.');
  }

  const proxyUrl = `${APPS_SCRIPT_URL}?mode=stream&id=${fileId}`;

  console.log('[SonicObsidian] Fetching audio via proxy for file:', fileId);

  const response = await fetch(proxyUrl, { redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`Proxy returned HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Proxy returned failure');
  }

  // Safely decode Base64 into Uint8Array without blowing up memory
  const binaryString = atob(json.data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create Object URL from binary blob
  const blob = new Blob([bytes.buffer], { type: json.mimeType || 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);

  // Cache for re-plays during session
  audioBlobCache.set(fileId, blobUrl);

  console.log(
    '[SonicObsidian] Audio proxied successfully:',
    json.fileName,
    `(${(json.size / 1024 / 1024).toFixed(1)} MB)`
  );

  return blobUrl;
}


// ─── Pre-warm & Pre-fetch ────────────────────────────────────────────────────

/**
 * Send a lightweight GET to the Apps Script to wake up the instance.
 * Google Apps Script has a "cold start" (~2-5s) the first time it runs.
 * Calling this on app mount ensures the instance is warm when the user
 * clicks play for the first time.
 */
export function prewarmProxy() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') return;

  fetch(APPS_SCRIPT_URL, { redirect: 'follow' })
    .then((res) => res.json())
    .then((data) => {
      console.log('[SonicObsidian] Proxy pre-warmed:', data.status || 'OK');
    })
    .catch(() => {
      // Silently ignore — this is a best-effort optimization
    });
}

/**
 * Silently pre-fetch a song's audio and cache the blob URL.
 * If it's already cached, returns immediately. Errors are swallowed
 * since this is a speculative optimization — the user hasn't clicked
 * this song yet.
 *
 * @param {string} audioUrl — The Google Drive audio URL to pre-fetch
 * @returns {Promise<void>}
 */
export async function prefetchAudioBlobUrl(audioUrl) {
  if (!audioUrl || !isDriveUrl(audioUrl)) return;

  const fileId = extractDriveFileId(audioUrl);
  if (!fileId || audioBlobCache.has(fileId)) return; // Already cached

  try {
    await fetchAudioBlobUrl(audioUrl);
  } catch {
    // Swallow errors — pre-fetch is best-effort
  }
}
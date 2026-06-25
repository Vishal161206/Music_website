/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * driveService.ts — Google Drive upload via Google Apps Script proxy.
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

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const DRIVE_SECRET     = import.meta.env.VITE_DRIVE_SECRET   as string | undefined;
const DRIVE_FOLDER_ID  = import.meta.env.VITE_DRIVE_FOLDER_ID as string | undefined;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DriveUploadResult {
  fileId: string;
  url: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a File to a base64 string.
 * Reports encoding progress via `onProgress` (0–50 represents the encoding phase
 * in a combined 0–100 scale shared with upload).
 */
function fileToBase64(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        // Encoding = first 40% of the overall progress
        onProgress(Math.round((evt.loaded / evt.total) * 40));
      }
    };
    reader.onload = () => {
      const result = reader.result as string;
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
async function postToAppsScript(
  payload: object,
  onProgress?: (pct: number) => void,
): Promise<DriveUploadResult> {
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
    let data: { success: boolean; fileId?: string; url?: string; error?: string };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Unexpected response from Apps Script: ' + text.slice(0, 200));
    }

    if (!data.success) {
      throw new Error(data.error || 'Apps Script reported failure with no error message.');
    }

    onProgress?.(100);
    return { fileId: data.fileId!, url: data.url! };

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
export async function uploadAudioToDrive(
  file: File,
  songId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
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
export async function uploadCoverToDrive(
  file: File,
  songId: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
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

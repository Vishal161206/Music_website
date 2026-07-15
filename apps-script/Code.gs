/**

 *
 * Security: A secret token (SECRET_TOKEN below) prevents random people from
 * uploading to your Drive even if they find the URL. Set the same value in
 * your .env as VITE_DRIVE_SECRET=your_secret_here
 * ─────────────────────────────────────────────────────────────────────────────
 */

var FOLDER_NAME = "SonicObsidian";

// ── Change this to any random string before deploying ─────────────────────────
// Set the SAME value in your .env file: VITE_DRIVE_SECRET=your_secret_here
// WARNING: Do NOT commit a real secret to GitHub. Keep it private.
var SECRET_TOKEN = "m09auc9uy3qancvishalcu9034uanand34mu43";


/**
 * Handle GET requests — used for health checks.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "SonicObsidian Drive API is running ✓" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests — receives base64 file data, uploads to Drive, returns URL.
 *
 * Expected JSON body:
 * {
 *   "fileName": "song.mp3",
 *   "mimeType": "audio/mpeg",
 *   "data": "<base64 string>",
 *   "type": "audio" | "cover",
 *   "songId": "song-123"
 * }
 *
 * Returns:
 * { "success": true, "fileId": "...", "url": "https://drive.google.com/uc?..." }
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // ── Secret token check ─────────────────────────────────────────────────
    // Reject requests that don't include the correct secret.
    // This prevents random people from uploading to your Drive.
    if (payload.secret !== SECRET_TOKEN) {
      return jsonResponse({ success: false, error: "Unauthorized: invalid secret token." });
    }
    // ──────────────────────────────────────────────────────────────────────

    var fileName = payload.fileName || "upload";
    var mimeType = payload.mimeType || "application/octet-stream";
    var base64Data = payload.data;
    var fileType = payload.type || "audio";
    var songId = payload.songId || Date.now().toString();
    var customFolderId = payload.folderId || "";  // Optional: user's custom Drive folder ID

    if (!base64Data) {
      return jsonResponse({ success: false, error: "No file data provided" });
    }

    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);

    // Use custom folder ID if provided, otherwise create/find SonicObsidian folder
    var folder;
    if (customFolderId) {
      try {
        folder = DriveApp.getFolderById(customFolderId);
      } catch (e) {
        return jsonResponse({ success: false, error: "Could not find Drive folder with ID: " + customFolderId + ". Make sure it exists and is shared with your account." });
      }
    } else {
      folder = getOrCreateFolder(FOLDER_NAME);
    }

    var songFolder = getOrCreateFolder(songId, folder);
    var file = songFolder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var url = fileType === "cover"
      ? "https://drive.google.com/uc?export=view&id=" + fileId
      : "https://drive.google.com/uc?export=download&id=" + fileId;

    return jsonResponse({ success: true, fileId: fileId, url: url, type: fileType });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}


function getOrCreateFolder(name, parent) {
  var search = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (search.hasNext()) return search.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

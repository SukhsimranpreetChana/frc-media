import { readFile, writeFile } from "fs/promises";
import path from "path";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type StoredGoogleToken = {
  refreshToken: string;
  updatedAt: string;
};

type GoogleDriveFile = {
  id: string;
  name?: string;
  mimeType?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
};

type GoogleDriveFilesResponse = {
  files?: GoogleDriveFile[];
};

export type GoogleDriveUploadFolder = {
  id: string;
  name: string;
  url: string;
};

export type GoogleDriveFolderFile = {
  id: string;
  name: string;
  mimeType?: string;
  viewUrl: string;
  thumbnailUrl?: string;
  createdTime?: string;
  modifiedTime?: string;
};

export type GoogleDrivePreviewImage = {
  bytes: Buffer;
  contentType: string;
  fileName: string;
};

export type GoogleDriveUploadedMedia = {
  fileId: string;
  fileName: string;
  viewUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
};

const driveApiBaseUrl = "https://www.googleapis.com/drive/v3";
const driveUploadBaseUrl = "https://www.googleapis.com/upload/drive/v3";
const folderMimeType = "application/vnd.google-apps.folder";
const tokenUrl = "https://oauth2.googleapis.com/token";
const googleOAuthScope = "https://www.googleapis.com/auth/drive";
const tokenStorePath = path.join(process.cwd(), ".google-oauth-token.json");
let runtimeRefreshToken: string | undefined;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function getGoogleOAuthConfig() {
  return {
    clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  };
}

function escapeDriveQueryValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export function getGoogleOAuthAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: googleOAuthScope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function readStoredRefreshToken() {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return process.env.GOOGLE_REFRESH_TOKEN;
  }

  if (runtimeRefreshToken) {
    return runtimeRefreshToken;
  }

  try {
    const tokenJson = await readFile(tokenStorePath, "utf8");
    const token = JSON.parse(tokenJson) as StoredGoogleToken;
    return token.refreshToken;
  } catch {
    return undefined;
  }
}

export async function saveGoogleRefreshToken(refreshToken: string) {
  runtimeRefreshToken = refreshToken;

  const token: StoredGoogleToken = {
    refreshToken,
    updatedAt: new Date().toISOString(),
  };

  try {
    await writeFile(tokenStorePath, JSON.stringify(token, null, 2), "utf8");

    return {
      persisted: true,
      message: "Google OAuth token saved locally.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save Google token.";

    console.error("Unable to save Google OAuth token to disk:", message);

    return {
      persisted: false,
      message:
        "Google OAuth token is only available for this running server instance. Set GOOGLE_REFRESH_TOKEN in production environment variables for persistent uploads.",
    };
  }
}

export async function exchangeGoogleOAuthCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });
  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.refresh_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Google did not return a refresh token. Reconnect with consent.",
    );
  }

  const tokenStorage = await saveGoogleRefreshToken(data.refresh_token);
  return {
    ...data,
    tokenStorage,
  };
}

async function getGoogleAccessToken() {
  const refreshToken = await readStoredRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Google Drive is not connected. Visit /api/google/connect and sign in with the FMC Google account.",
    );
  }

  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Unable to refresh Google access token.",
    );
  }

  return data.access_token;
}

async function findFolder(accessToken: string, name: string, parentId: string) {
  const query = [
    `name = '${escapeDriveQueryValue(name)}'`,
    `mimeType = '${folderMimeType}'`,
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    "trashed = false",
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const response = await fetch(`${driveApiBaseUrl}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to search Google Drive folders. ${errorText}`);
  }

  const data = (await response.json()) as GoogleDriveFilesResponse;
  return data.files?.[0]?.id;
}

async function listFolders(accessToken: string, parentId: string) {
  const query = [
    `mimeType = '${folderMimeType}'`,
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    "trashed = false",
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const response = await fetch(`${driveApiBaseUrl}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to list Google Drive folders. ${errorText}`);
  }

  const data = (await response.json()) as GoogleDriveFilesResponse;
  return data.files || [];
}

async function createFolder(accessToken: string, name: string, parentId: string) {
  const params = new URLSearchParams({
    fields: "id,name",
    supportsAllDrives: "true",
  });
  const response = await fetch(`${driveApiBaseUrl}/files?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: folderMimeType,
      parents: [parentId],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Unable to create Google Drive folder: ${name}. ${errorText}`,
    );
  }

  const data = (await response.json()) as GoogleDriveFile;
  return data.id;
}

async function getOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string,
) {
  return (
    (await findFolder(accessToken, name, parentId)) ||
    (await createFolder(accessToken, name, parentId))
  );
}

async function setAnyoneCanView(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    supportsAllDrives: "true",
  });
  const response = await fetch(
    `${driveApiBaseUrl}/files/${fileId}/permissions?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Unable to set Google Drive sharing permissions. ${errorText}`,
    );
  }
}

async function trySetAnyoneCanView(accessToken: string, fileId: string) {
  try {
    await setAnyoneCanView(accessToken, fileId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to set Google Drive sharing permissions.";

    console.error("Google Drive sharing warning:", message);
  }
}

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .replace(/[^\w.\-() ]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "fmc-upload"
  );
}

function getGoogleDriveThumbnailUrl(fileId: string) {
  return `/api/media/thumbnail?fileId=${encodeURIComponent(fileId)}`;
}

function sanitizeFolderName(folderName: string) {
  return (
    folderName
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "Unknown uploader"
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getNextFolderName(baseName: string, existingNames: string[]) {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const folderNamePattern = new RegExp(`^${escapeRegExp(baseName)}(?: (\\d+))?$`);
  const highestEntryNumber = existingNames.reduce((highest, name) => {
    const match = name.match(folderNamePattern);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1] || 1));
  }, 1);

  return `${baseName} ${highestEntryNumber + 1}`;
}

async function getTeamFolderId(accessToken: string, teamNumber: string, year: number) {
  const rootFolderId = getRequiredEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  const clipsFolderId = await getOrCreateFolder(
    accessToken,
    "FRC Clips",
    rootFolderId,
  );
  const yearFolderId = await getOrCreateFolder(
    accessToken,
    String(year),
    clipsFolderId,
  );

  return getOrCreateFolder(accessToken, `Team ${teamNumber}`, yearFolderId);
}

export function getGoogleDriveFileIdFromUrl(fileUrl: string) {
  const filePathMatch = fileUrl.match(/\/file\/d\/([^/]+)/);

  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  try {
    const url = new URL(fileUrl);
    return url.searchParams.get("id") || undefined;
  } catch {
    return undefined;
  }
}

export function getGoogleDriveFolderIdFromUrl(folderUrl: string) {
  const folderPathMatch = folderUrl.match(/\/folders\/([^/?]+)/);

  if (folderPathMatch?.[1]) {
    return folderPathMatch[1];
  }

  try {
    const url = new URL(folderUrl);
    return url.searchParams.get("id") || undefined;
  } catch {
    return undefined;
  }
}

export async function getGoogleDriveParentFolderUrl(fileUrl: string) {
  const fileId = getGoogleDriveFileIdFromUrl(fileUrl);

  if (!fileId) {
    throw new Error("Could not read Google Drive file id.");
  }

  const accessToken = await getGoogleAccessToken();
  const params = new URLSearchParams({
    fields: "parents",
    supportsAllDrives: "true",
  });
  const response = await fetch(
    `${driveApiBaseUrl}/files/${fileId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to resolve Google Drive folder. ${errorText}`);
  }

  const file = (await response.json()) as GoogleDriveFile;
  const folderId = file.parents?.[0];

  if (!folderId) {
    throw new Error("Google Drive file does not have a parent folder.");
  }

  return `https://drive.google.com/drive/folders/${folderId}`;
}

export async function listGoogleDriveFolderFiles(folderUrl: string) {
  const folderId = getGoogleDriveFolderIdFromUrl(folderUrl);

  if (!folderId) {
    throw new Error("Could not read Google Drive folder id.");
  }

  const accessToken = await getGoogleAccessToken();
  const query = [
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    "trashed = false",
    `mimeType != '${folderMimeType}'`,
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields:
      "files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,modifiedTime)",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
    orderBy: "createdTime desc",
    pageSize: "100",
  });
  const response = await fetch(`${driveApiBaseUrl}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to list Google Drive folder files. ${errorText}`);
  }

  const data = (await response.json()) as GoogleDriveFilesResponse;
  return (data.files || []).map<GoogleDriveFolderFile>((file) => ({
    id: file.id,
    name: file.name || "Untitled media",
    mimeType: file.mimeType,
    viewUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    thumbnailUrl: getGoogleDriveThumbnailUrl(file.id),
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
  }));
}

async function findGoogleDriveFileInFolder(input: {
  fileName: string;
  folderId: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const query = [
    `name = '${escapeDriveQueryValue(input.fileName)}'`,
    `'${escapeDriveQueryValue(input.folderId)}' in parents`,
    "trashed = false",
    `mimeType != '${folderMimeType}'`,
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,webViewLink,webContentLink,thumbnailLink,parents)",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
    orderBy: "createdTime desc",
    pageSize: "1",
  });
  const response = await fetch(`${driveApiBaseUrl}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to find uploaded Google Drive file. ${errorText}`);
  }

  const data = (await response.json()) as GoogleDriveFilesResponse;
  return data.files?.[0];
}

export async function getGoogleDrivePreviewImage(
  fileId: string,
): Promise<GoogleDrivePreviewImage> {
  const accessToken = await getGoogleAccessToken();
  const params = new URLSearchParams({
    fields: "id,name,mimeType,thumbnailLink",
    supportsAllDrives: "true",
  });
  const metadataResponse = await fetch(
    `${driveApiBaseUrl}/files/${fileId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!metadataResponse.ok) {
    const errorText = await metadataResponse.text();
    throw new Error(`Unable to load Google Drive file metadata. ${errorText}`);
  }

  const file = (await metadataResponse.json()) as GoogleDriveFile;

  if (file.thumbnailLink) {
    const thumbnailResponse = await fetch(file.thumbnailLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (thumbnailResponse.ok) {
      const bytes = Buffer.from(await thumbnailResponse.arrayBuffer());
      const contentType =
        thumbnailResponse.headers.get("content-type") || "image/jpeg";

      if (bytes.byteLength > 0 && contentType.startsWith("image/")) {
        return {
          bytes,
          contentType,
          fileName: file.name || "drive-thumbnail",
        };
      }
    }
  }

  if (file.mimeType?.startsWith("image/")) {
    const mediaResponse = await fetch(
      `${driveApiBaseUrl}/files/${fileId}?alt=media&supportsAllDrives=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (mediaResponse.ok) {
      return {
        bytes: Buffer.from(await mediaResponse.arrayBuffer()),
        contentType: mediaResponse.headers.get("content-type") || file.mimeType,
        fileName: file.name || "drive-image",
      };
    }
  }

  throw new Error("Google Drive did not return a previewable image.");
}

export async function deleteGoogleDriveFileOrFolder(fileOrFolderUrl: string) {
  const fileId =
    getGoogleDriveFolderIdFromUrl(fileOrFolderUrl) ||
    getGoogleDriveFileIdFromUrl(fileOrFolderUrl);

  if (!fileId) {
    throw new Error("Could not read Google Drive file or folder id.");
  }

  const accessToken = await getGoogleAccessToken();
  const params = new URLSearchParams({
    supportsAllDrives: "true",
  });
  const response = await fetch(
    `${driveApiBaseUrl}/files/${fileId}?${params.toString()}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Unable to delete Google Drive item. ${errorText}`);
  }
}

export async function createGoogleDriveUploadFolderForSubmission(input: {
  teamNumber: string;
  year: number;
  uploadedBy?: string;
}): Promise<GoogleDriveUploadFolder> {
  const accessToken = await getGoogleAccessToken();
  const teamFolderId = await getTeamFolderId(accessToken, input.teamNumber, input.year);
  const baseUploaderFolderName = sanitizeFolderName(
    input.uploadedBy?.trim() || "Unknown uploader",
  );
  const existingFolders = await listFolders(accessToken, teamFolderId);
  const uploaderFolderName = getNextFolderName(
    baseUploaderFolderName,
    existingFolders
      .map((folder) => folder.name)
      .filter((name): name is string => Boolean(name)),
  );
  const uploaderFolderId = await createFolder(
    accessToken,
    uploaderFolderName,
    teamFolderId,
  );

  await trySetAnyoneCanView(accessToken, uploaderFolderId);

  return {
    id: uploaderFolderId,
    name: uploaderFolderName,
    url: `https://drive.google.com/drive/folders/${uploaderFolderId}`,
  };
}

export async function uploadMediaToGoogleDrive(input: {
  file: File;
  teamNumber: string;
  year: number;
  uploadedBy?: string;
  uploadFolder?: GoogleDriveUploadFolder;
}) {
  const accessToken = await getGoogleAccessToken();
  const uploadFolder =
    input.uploadFolder ||
    (await createGoogleDriveUploadFolderForSubmission({
      teamNumber: input.teamNumber,
      year: input.year,
      uploadedBy: input.uploadedBy,
    }));
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const fileName = sanitizeFileName(input.file.name);
  const params = new URLSearchParams({
    uploadType: "resumable",
    fields: "id,name,webViewLink,webContentLink,thumbnailLink",
    supportsAllDrives: "true",
  });
  const createUploadSession = await fetch(
    `${driveUploadBaseUrl}/files?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": input.file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(fileBuffer.byteLength),
      },
      body: JSON.stringify({
        name: fileName,
        mimeType: input.file.type || "application/octet-stream",
        parents: [uploadFolder.id],
      }),
    },
  );
  const uploadUrl = createUploadSession.headers.get("Location");

  if (!createUploadSession.ok || !uploadUrl) {
    const errorText = await createUploadSession.text();
    throw new Error(`Unable to start Google Drive upload. ${errorText}`);
  }

  const lastByte = Math.max(0, fileBuffer.byteLength - 1);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.file.type || "application/octet-stream",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Range": `bytes 0-${lastByte}/${fileBuffer.byteLength}`,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Unable to upload file to Google Drive. ${errorText}`);
  }

  const uploadedFile = (await uploadResponse.json()) as GoogleDriveFile;
  await trySetAnyoneCanView(accessToken, uploadedFile.id);

  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    viewUrl:
      uploadedFile.webViewLink ||
      `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    downloadUrl:
      uploadedFile.webContentLink ||
      `https://drive.google.com/uc?id=${uploadedFile.id}`,
    thumbnailUrl: getGoogleDriveThumbnailUrl(uploadedFile.id),
    folderId: uploadFolder.id,
    folderName: uploadFolder.name,
    folderUrl: uploadFolder.url,
  };
}

export async function uploadFooterProfilePictureToGoogleDrive(input: {
  file: File;
  handle: string;
}) {
  const accessToken = await getGoogleAccessToken();
  const rootFolderId = getRequiredEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  const profilePicsFolderId = await getOrCreateFolder(
    accessToken,
    "Profile pics",
    rootFolderId,
  );
  await trySetAnyoneCanView(accessToken, profilePicsFolderId);

  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const safeHandle = sanitizeFileName(
    input.handle.replace(/^@+/, "") || "footer-profile",
  );
  const originalFileName = sanitizeFileName(input.file.name);
  const extensionMatch = originalFileName.match(/\.[A-Za-z0-9]+$/);
  const fileName = `${safeHandle}-${Date.now()}${extensionMatch?.[0] || ""}`;
  const params = new URLSearchParams({
    uploadType: "resumable",
    fields: "id,name,webViewLink,webContentLink,thumbnailLink",
    supportsAllDrives: "true",
  });
  const createUploadSession = await fetch(
    `${driveUploadBaseUrl}/files?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": input.file.type || "image/jpeg",
        "X-Upload-Content-Length": String(fileBuffer.byteLength),
      },
      body: JSON.stringify({
        name: fileName,
        mimeType: input.file.type || "image/jpeg",
        parents: [profilePicsFolderId],
      }),
    },
  );
  const uploadUrl = createUploadSession.headers.get("Location");

  if (!createUploadSession.ok || !uploadUrl) {
    const errorText = await createUploadSession.text();
    throw new Error(`Unable to start profile picture upload. ${errorText}`);
  }

  const lastByte = Math.max(0, fileBuffer.byteLength - 1);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.file.type || "image/jpeg",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Range": `bytes 0-${lastByte}/${fileBuffer.byteLength}`,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Unable to upload profile picture. ${errorText}`);
  }

  const uploadedFile = (await uploadResponse.json()) as GoogleDriveFile;
  await trySetAnyoneCanView(accessToken, uploadedFile.id);

  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    viewUrl:
      uploadedFile.webViewLink ||
      `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    thumbnailUrl: getGoogleDriveThumbnailUrl(uploadedFile.id),
    folderId: profilePicsFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${profilePicsFolderId}`,
  };
}

export async function createGoogleDriveResumableUploadSession(input: {
  fileName: string;
  mimeType: string;
  size: number;
  uploadFolder: GoogleDriveUploadFolder;
}) {
  const accessToken = await getGoogleAccessToken();
  const fileName = sanitizeFileName(input.fileName);
  const mimeType = input.mimeType || "application/octet-stream";
  const params = new URLSearchParams({
    uploadType: "resumable",
    fields: "id,name,webViewLink,webContentLink,thumbnailLink",
    supportsAllDrives: "true",
  });
  const response = await fetch(
    `${driveUploadBaseUrl}/files?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(input.size),
      },
      body: JSON.stringify({
        name: fileName,
        mimeType,
        parents: [input.uploadFolder.id],
      }),
    },
  );
  const uploadUrl = response.headers.get("Location");

  if (!response.ok || !uploadUrl) {
    const errorText = await response.text();
    throw new Error(`Unable to start Google Drive upload. ${errorText}`);
  }

  return {
    uploadUrl,
    fileName,
  };
}

export async function completeGoogleDriveResumableUpload(input: {
  fileId?: string;
  fileName?: string;
  uploadFolder?: GoogleDriveUploadFolder;
}): Promise<GoogleDriveUploadedMedia> {
  const accessToken = await getGoogleAccessToken();
  let uploadedFile: GoogleDriveFile | undefined;

  if (input.fileId) {
    const params = new URLSearchParams({
      fields: "id,name,webViewLink,webContentLink,thumbnailLink,parents",
      supportsAllDrives: "true",
    });
    const response = await fetch(
      `${driveApiBaseUrl}/files/${encodeURIComponent(input.fileId)}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unable to load uploaded Google Drive file. ${errorText}`);
    }

    uploadedFile = (await response.json()) as GoogleDriveFile;
  } else if (input.fileName && input.uploadFolder) {
    uploadedFile = await findGoogleDriveFileInFolder({
      fileName: input.fileName,
      folderId: input.uploadFolder.id,
    });
  }

  if (!uploadedFile?.id) {
    throw new Error(
      "Google Drive accepted the upload, but the site could not find the uploaded file to submit it for review.",
    );
  }

  await trySetAnyoneCanView(accessToken, uploadedFile.id);

  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.name || "fmc-upload",
    viewUrl:
      uploadedFile.webViewLink ||
      `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    downloadUrl:
      uploadedFile.webContentLink ||
      `https://drive.google.com/uc?id=${uploadedFile.id}`,
    thumbnailUrl: getGoogleDriveThumbnailUrl(uploadedFile.id),
    folderId: input.uploadFolder?.id,
    folderName: input.uploadFolder?.name,
    folderUrl: input.uploadFolder?.url,
  };
}

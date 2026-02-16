import {auth} from '../../lib/firebase';

const STORAGE_BUCKET = 'zakat-8e5a4.firebasestorage.app';

interface FileToUpload {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  [key: string]: any;
}

/**
 * Convert a local file URI to a Blob using XMLHttpRequest.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload a single file to Firebase Storage via REST API.
 * Bypasses the JS SDK which doesn't support blobs on React Native.
 * Returns the public download URL.
 */
async function uploadSingleFile(
  storagePath: string,
  file: FileToUpload,
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Non authentifié');

  const token = await currentUser.getIdToken();
  const encodedPath = encodeURIComponent(storagePath);

  console.log(`[Upload] Starting: ${file.name} -> ${storagePath}`);

  // 1. Read local file as blob
  const blob = await uriToBlob(file.uri);
  console.log(`[Upload] Blob size: ${blob.size}`);

  // 2. Upload via Firebase Storage REST API
  const uploadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': file.mimeType,
      Authorization: `Bearer ${token}`,
    },
    body: blob,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Upload] HTTP ${response.status}: ${errorText}`);
    throw new Error(`Upload échoué (${response.status})`);
  }

  const metadata = await response.json();
  console.log(`[Upload] Done: ${metadata.name}`);

  // 3. Build the download URL from the response token
  const downloadToken = metadata.downloadTokens;
  const downloadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  console.log(`[Upload] URL: ${downloadUrl}`);
  return downloadUrl;
}

/**
 * Upload an array of files to Firebase Storage under the given folder.
 * Returns a new array with the same metadata but `uri` replaced by the download URL.
 */
export async function uploadFiles<T extends FileToUpload>(
  folder: string,
  files: T[],
): Promise<T[]> {
  if (files.length === 0) return [];

  const uploaded: T[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${file.id}_${safeName}`;

    try {
      const downloadUrl = await uploadSingleFile(storagePath, file);
      uploaded.push({...file, uri: downloadUrl});
    } catch (err: any) {
      console.error(`[Upload] FAILED for ${file.name}:`, err?.message, err);
      throw new Error(`Echec de l'upload de ${file.name}: ${err?.message || 'erreur inconnue'}`);
    }
  }

  return uploaded;
}

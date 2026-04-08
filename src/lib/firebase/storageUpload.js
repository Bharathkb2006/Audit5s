import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './app';
import { firebaseOptions } from './config';

function safeName(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function readEnv(primaryKey, fallbackKey) {
  const primary = import.meta.env[primaryKey];
  if (typeof primary === 'string' && primary.trim()) return primary.trim();
  const fallback = import.meta.env[fallbackKey];
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();
  return '';
}

function cloudinaryConfig() {
  const cloudName = readEnv('VITE_CLOUDINARY_CLOUD_NAME', 'REACT_APP_CLOUDINARY_CLOUD_NAME');
  const uploadPreset = readEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'REACT_APP_CLOUDINARY_UPLOAD_PRESET');
  return { cloudName, uploadPreset, enabled: Boolean(cloudName && uploadPreset) };
}

async function uploadWithCloudinary(storagePath, file) {
  const cfg = cloudinaryConfig();
  if (!cfg.enabled) return null;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', cfg.uploadPreset);
  form.append('public_id', `${storagePath}/${Date.now()}_${safeName(file.name)}`);
  const endpoint = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.secure_url) {
    throw new Error(body?.error?.message || 'Cloudinary upload failed');
  }
  return body.secure_url;
}

/**
 * Upload a file and return a public download URL (Storage rules must allow read).
 */
export async function uploadPublicFile(storagePath, file) {
  // Prefer Cloudinary when configured to avoid Firebase Storage CORS/preflight issues.
  const cloudinaryUrl = await uploadWithCloudinary(storagePath, file).catch(() => null);
  if (cloudinaryUrl) return cloudinaryUrl;

  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Firebase Storage not initialized');
  const path = `${storagePath}/${Date.now()}_${safeName(file.name)}`;
  const r = ref(storage, path);
  const timeoutMs = 45000;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error('Upload timed out after 45s. Check internet, Firebase Storage bucket, and Storage rules.')
      );
    }, timeoutMs);
  });
  try {
    await Promise.race([uploadBytes(r, file, { contentType: file.type || undefined }), timeoutPromise]);
    return getDownloadURL(r);
  } catch (err) {
    const code = err?.code || '';
    const bucket = firebaseOptions()?.storageBucket || '(missing)';
    if (code === 'storage/unauthorized') {
      throw new Error(`Storage upload blocked by Firebase rules for bucket "${bucket}".`);
    }
    if (code === 'storage/unknown') {
      throw new Error(
        `Storage upload failed for bucket "${bucket}". Check Firebase Storage is enabled and bucket name matches config.`
      );
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

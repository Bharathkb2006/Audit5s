import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './app';
import { firebaseOptions } from './config';

function safeName(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Upload a file and return a public download URL (Storage rules must allow read).
 */
export async function uploadPublicFile(storagePath, file) {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Firebase Storage not initialized');
  const path = `${storagePath}/${Date.now()}_${safeName(file.name)}`;
  const r = ref(storage, path);
  try {
    await uploadBytes(r, file, { contentType: file.type || undefined });
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
  }
}

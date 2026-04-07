import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './app';

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
  await uploadBytes(r, file, { contentType: file.type || undefined });
  return getDownloadURL(r);
}

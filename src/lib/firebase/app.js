import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firebaseOptions, isFirebaseConfigured } from './config';

let _app;
let _db;
let _storage;
let _auth;

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseOptions());
  }
  return _app;
}

export function getFirebaseDb() {
  if (!getFirebaseApp()) return null;
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

export function getFirebaseStorage() {
  if (!getFirebaseApp()) return null;
  if (!_storage) _storage = getStorage(getFirebaseApp());
  return _storage;
}

export function getFirebaseAuth() {
  if (!getFirebaseApp()) return null;
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

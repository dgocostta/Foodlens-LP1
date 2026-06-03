import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app = null;
let db = null;
let bucket = null;

/**
 * Initialise the Firebase Admin app exactly once.
 *
 * Required environment variables:
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY        (literal newlines, OR escaped as \n)
 *   - FIREBASE_STORAGE_BUCKET     (e.g. your-project.firebasestorage.app) — needed for photo uploads
 *
 * Returns null if credentials are missing, so routes can degrade gracefully.
 */
function getApp() {
  if (app) return app;

  // .trim() guards against stray spaces/newlines pasted into env vars
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    });

  return app;
}

/** Singleton Firestore instance, or null if Firebase isn't configured. */
export function getDb() {
  if (db) return db;
  const a = getApp();
  if (!a) return null;
  db = getFirestore(a);
  return db;
}

/** Singleton Storage bucket, or null if Firebase/Storage isn't configured. */
export function getBucket() {
  if (bucket) return bucket;
  const a = getApp();
  if (!a) return null;
  if (!process.env.FIREBASE_STORAGE_BUCKET) return null;
  bucket = getStorage(a).bucket();
  return bucket;
}

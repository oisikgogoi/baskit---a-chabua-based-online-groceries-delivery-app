
import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountPath = path.join(
  process.cwd(),
  ".secrets",
  "firebase-service-account.json"
);

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, "utf8")
);

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export default adminApp;

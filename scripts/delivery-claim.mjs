
import { readFileSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountPath = path.join(
  process.cwd(),
  ".secrets",
  "firebase-service-account.json"
);

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, "utf8")
);

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

const adminAuth = getAuth(app);

const [action, uid] = process.argv.slice(2);

if (!["grant", "revoke"].includes(action) || !uid) {
  console.log("Usage:");
  console.log("node scripts/delivery-claim.mjs grant YOUR_UID");
  console.log("node scripts/delivery-claim.mjs revoke YOUR_UID");
  process.exit(1);
}

try {
  const user = await adminAuth.getUser(uid);
  const claims = { ...(user.customClaims || {}) };

  if (action === "grant") {
    claims.deliveryBoy = true;
  } else {
    delete claims.deliveryBoy;
  }

  await adminAuth.setCustomUserClaims(uid, claims);

  // Revoke existing refresh tokens so the account must refresh its session.
  await adminAuth.revokeRefreshTokens(uid);

  console.log(
    `Successfully ${action === "grant" ? "granted" : "revoked"} deliveryBoy claim for ${user.email || uid}`
  );
} catch (error) {
  console.error("Claim update failed:", error.message);
  process.exit(1);
}

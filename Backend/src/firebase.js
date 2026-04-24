const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  /**
   * Two credential strategies:
   *  1. GOOGLE_APPLICATION_CREDENTIALS env var points to a service-account JSON file.
   *     → Set this in .env:  GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   *  2. FIREBASE_SERVICE_ACCOUNT_KEY env var holds the JSON as a single-line string.
   *     → Useful for cloud deployments where you can't ship files.
   *
   * Download your service-account.json from:
   *   Firebase Console → Project Settings → Service Accounts → Generate new private key
   */
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS env var
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
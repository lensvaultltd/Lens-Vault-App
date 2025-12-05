import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Standard way to load service account:
// 1. FIREBASE_ADMIN_KEY environment variable (JSON string)
// 2. OR path to service account file

let serviceAccount: any;

try {
    if (process.env.FIREBASE_ADMIN_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    } else if (process.env.FIREBASE_ADMIN_KEY_PATH) {
        // You might need 'fs' here if loading from path, but for serverless envs, JSON string env var is better.
        // console.log("Loading from path not fully implemented for serverless safety.");
    }
} catch (e) {
    console.warn('Failed to parse FIREBASE_ADMIN_KEY');
}

if (!admin.apps.length) {
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback or warning
        console.warn("Firebase Admin not initialized. Missing credentials.");
        // For development without keys, we might want to mock or just fail lazily
        // admin.initializeApp(); // This might try default google creds
    }
}

export const auth = admin.auth();
export default admin;

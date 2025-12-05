import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    // Add other config vars if needed (storageBucket, etc)
};

if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing! Make sure VITE_FIREBASE_API_KEY is set in your environment variables.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    // Add other config vars if needed (storageBucket, etc)
};

let app;
let auth: any;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    } else {
        console.warn("Firebase API Key missing. Authentication disabled.");
        auth = { currentUser: null, signOut: async () => { }, getIdToken: async () => null };
    }
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
    auth = { currentUser: null, signOut: async () => { }, getIdToken: async () => null };
}

export { auth };


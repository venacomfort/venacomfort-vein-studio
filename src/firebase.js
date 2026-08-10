import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
// Se recomienda configurar las credenciales reales en un archivo .env.local en producción
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForVenaComfortAppLocalDev",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "venacomfort-vein-studio.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "venacomfort-vein-studio",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "venacomfort-vein-studio.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "888888888888",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:888888888888:web:8888888888888888888888"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

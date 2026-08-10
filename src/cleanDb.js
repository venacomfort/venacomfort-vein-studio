import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForVenaComfortAppLocalDev",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "venacomfort-vein-studio.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "venacomfort-vein-studio",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "venacomfort-vein-studio.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "888888888888",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:888888888888:web:8888888888888888888888"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clearCollection = async (colName) => {
  console.log(`Clearing collection: ${colName}...`);
  const colRef = collection(db, colName);
  const snap = await getDocs(colRef);
  let count = 0;
  for (const document of snap.docs) {
    await deleteDoc(doc(db, colName, document.id));
    count++;
  }
  console.log(`Deleted ${count} documents from ${colName}.`);
};

const runClean = async () => {
  try {
    console.log("Starting production database cleanup...");
    
    // Clear patients and appointments
    await clearCollection("patients");
    await clearCollection("appointments");
    
    // Clear specialists
    await clearCollection("specialists");
    
    // Seed exactly one specialist
    console.log("Seeding Dr. Elena Rodriguez as the sole specialist...");
    const drElena = {
      id: 'doc-1',
      name: 'Dr. Elena Rodriguez',
      title: 'Lead Vascular Specialist',
      titleEs: 'Especialista Vascular Principal',
      email: 'elena.rodriguez@venacomfort.com',
      phone: '786-555-0190',
      schedule: 'Mon - Fri',
      scheduleEs: 'Lun - Vie',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmFlvCGywaT-W4-dIbbWMP8IqY3-KNASyMcjp4sn_v17Te9vY81ut7cojgvOOAQtLpF-Gy4REDJOZk1PpiZEnyM-s7JeTIBqUhjnzzy4HaqUUtt_Cla9djQ62nuF3dJQ804xhNJi-dTU_TtcMwfFyo9kqsHe_RdugDAUTG_tVecvEHi25aa4G3cL6v97p3kHjEdBSXXbfu2uSyjn8f0lO5A5CFpFOTGvaqtDsqRG--U9h9Gt8OlN1JRA',
      status: 'Active'
    };
    await setDoc(doc(db, "specialists", drElena.id), drElena);
    console.log("Successfully seeded Dr. Elena Rodriguez.");
    
    console.log("Database cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
};

runClean();

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForVenaComfortAppLocalDev",
  authDomain: "venacomfort-vein-studio.firebaseapp.com",
  projectId: "venacomfort-vein-studio",
  storageBucket: "venacomfort-vein-studio.appspot.com",
  messagingSenderId: "888888888888",
  appId: "1:888888888888:web:8888888888888888888888"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const runClean = async () => {
  try {
    console.log("Starting production database cleanup of users and specialists...");

    // 1. Clear specialists collection
    console.log("Clearing specialists collection...");
    const specSnap = await getDocs(collection(db, "specialists"));
    let specCount = 0;
    for (const d of specSnap.docs) {
      await deleteDoc(doc(db, "specialists", d.id));
      specCount++;
    }
    console.log(`Deleted ${specCount} specialists.`);

    // 2. Clear users collection except admin
    console.log("Clearing users collection (excluding admin)...");
    const userSnap = await getDocs(collection(db, "users"));
    let userCount = 0;
    for (const d of userSnap.docs) {
      const data = d.data();
      if (data.email?.toLowerCase() === "admin@venacomfort.com") {
        console.log(`Keeping admin user: ${data.email}`);
        continue;
      }
      await deleteDoc(doc(db, "users", d.id));
      userCount++;
    }
    console.log(`Deleted ${userCount} users.`);

    console.log("Cleanup finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

runClean();

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Use the databaseId from the config if available
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;

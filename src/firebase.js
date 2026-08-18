// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBaTncpfpw5b0WGMIGgEs01oqcVhtob4ZY",
  authDomain: "chicks-pos-740c1.firebaseapp.com",
  projectId: "chicks-pos-740c1",
  storageBucket: "chicks-pos-740c1.firebasestorage.app",
  messagingSenderId: "384098757872",
  appId: "1:384098757872:web:bfc498e5162855bd57e635",
  measurementId: "G-1BL7FV416G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

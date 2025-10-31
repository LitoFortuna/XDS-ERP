import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc6yt2vd_-wR4lhG551szkydZKINXhBBs",
  authDomain: "xds-erp.firebaseapp.com",
  projectId: "xds-erp",
  storageBucket: "xds-erp.firebasestorage.app",
  messagingSenderId: "96908045727",
  appId: "1:96908045727:web:7a47b9899bbba012dea1aa",
  measurementId: "G-ZW540FRWZC"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

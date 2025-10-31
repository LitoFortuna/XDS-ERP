// FIX: Use Firebase v8 namespaced/compat imports
// Fix: To support the v8 namespaced API with Firebase v9+, the compatibility library imports are required.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Your web app's Firebase configuration
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
// FIX: Use Firebase v8 namespaced/compat API
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Initialize Cloud Firestore and get a reference to the service
// FIX: Use Firebase v8 namespaced/compat API
export const db = firebase.firestore();
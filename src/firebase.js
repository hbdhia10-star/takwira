// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDrusK2fVEHh9Xrmg4zIqaZRE2GbFpMhXA",
    authDomain: "takwira-5589e.firebaseapp.com",
    projectId: "takwira-5589e",
    storageBucket: "takwira-5589e.firebasestorage.app",
    messagingSenderId: "571659663446",
    appId: "1:571659663446:web:1ddcc4ac67a285293763f7",
    measurementId: "G-QJP6BPMKEY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
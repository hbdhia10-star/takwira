import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 👇👇👇 YOUR 6 LINES FROM FIREBASE CONSOLE 👇👇👇
const firebaseConfig = {
  apiKey: "AIzaSyDrusK2fVEHh9Xrmg4zIqaZRE2GbFpMhXA",
  authDomain: "takwira-5589e.firebaseapp.com",
  projectId: "takwira-5589e",
  storageBucket: "takwira-5589e.firebasestorage.app",
  messagingSenderId: "571659663446",
  appId: "1:571659663446:web:1ddcc4ac67a285293763f7",
  measurementId: "G-QJP6BPMKEY"
};
// 👆👆👆 YOUR 6 LINES FROM FIREBASE CONSOLE 👆👆👆

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
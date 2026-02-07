// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD14WrQ2CwK54-98pkjNF8N76qUjyMrk2c",
  authDomain: "project-3d71f.firebaseapp.com",
  projectId: "project-3d71f",
  storageBucket: "project-3d71f.firebasestorage.app",
  messagingSenderId: "197412909924",
  appId: "1:197412909924:web:e12053d89f49d0ba764071",
  measurementId: "G-TNCE3TKEQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const googleProvider=new GoogleAuthProvider();

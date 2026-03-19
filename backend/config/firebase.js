// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDS50UaxdHpz2zQuHEvThx1hhbLtOPmo1s",
  authDomain: "estate-3c6e7.firebaseapp.com",
  projectId: "estate-3c6e7",
  storageBucket: "estate-3c6e7.firebasestorage.app",
  messagingSenderId: "811207365644",
  appId: "1:811207365644:web:baf702bdecaf56c6274a29",
  measurementId: "G-9RK1L8GRH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
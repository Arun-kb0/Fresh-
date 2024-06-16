// Import the functions you need from the SDKs you need
import { initializeApp ,getApp , getApps} from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const {getAuth } = require('firebase/auth')

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC31IhC1RRBSj-LKzdc4uufbQoabNpL5pc",
  authDomain: "fresh-13e1a.firebaseapp.com",
  projectId: "fresh-13e1a",
  storageBucket: "fresh-13e1a.appspot.com",
  messagingSenderId: "702965357525",
  appId: "1:702965357525:web:c3c7d6e6345d82175a3b5c",
  measurementId: "G-6VY9NSBY7J"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


const app = getApps.length >=0 ? getApp() : initializeApp(firebaseConfig)

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyBw6vjBqYF9j5fOdokLlOYdiuSRNfasN2A",
  authDomain: "ihd-prediction-system-a73dc.firebaseapp.com",
  databaseURL: "https://ihd-prediction-system-a73dc-default-rtdb.firebaseio.com",
  projectId: "ihd-prediction-system-a73dc",
  storageBucket: "ihd-prediction-system-a73dc.firebasestorage.app",
  messagingSenderId: "851265186412",
  appId: "1:851265186412:web:31b83985a25f1b70118649",
  measurementId: "G-BVL22YDQP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

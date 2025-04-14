import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB6DeqAcCz1mVN1ygcHJ0s9o_DZjbQ9CLo",
  authDomain: "interview-fit.firebaseapp.com",
  projectId: "interview-fit",
  storageBucket: "interview-fit.firebasestorage.app",
  messagingSenderId: "1043013220468",
  appId: "1:1043013220468:web:bd3173b12d01967d547921",
  measurementId: "G-ZZFMP1502P"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };

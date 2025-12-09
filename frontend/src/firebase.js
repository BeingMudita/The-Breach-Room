// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA29fmbPvIpK_24lI3UTQs36FsKbMYgPxU",
  authDomain: "the-breach-room.firebaseapp.com",
  projectId: "the-breach-room",
  storageBucket: "the-breach-room.firebasestorage.app",
  messagingSenderId: "428350367816",
  appId: "1:428350367816:web:529a08979e3d954eabd07d",
  measurementId: "G-F3F9VC77RP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logout = async () => {
  await signOut(auth);
};

// helper to return a fresh ID token string
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  // forceRefresh=false to use cached token if valid
  return await user.getIdToken(/* forceRefresh */ false);
};
if (typeof window !== "undefined") {
  window.__auth = auth;
}
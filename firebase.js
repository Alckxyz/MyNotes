import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM0D-KfZJxz6v7SCFTIBrN0__jP5LI43E",
  authDomain: "mynotes-b2647.firebaseapp.com",
  projectId: "mynotes-b2647",
  storageBucket: "mynotes-b2647.firebasestorage.app",
  messagingSenderId: "858229444009",
  appId: "1:858229444009:web:cf83203838bbcb1dbc08b8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const loginGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

export const subscribeToNotes = (uid, callback) => {
  const notesRef = collection(db, "users", uid, "notes");
  const q = query(notesRef, orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const notes = snap.docs.map(d => ({ 
        ...d.data(),
        id: d.id, // Firestore ID is primary
        localId: d.data().id || d.id // Preserve internal logic if needed
    }));
    callback(notes);
  });
};

export const createFirebaseNote = async (uid, noteData) => {
  const notesRef = collection(db, "users", uid, "notes");
  // Ensure we don't save any undefined fields which Firestore hates
  const cleanData = JSON.parse(JSON.stringify(noteData));
  return await addDoc(notesRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateFirebaseNote = async (uid, noteId, data) => {
  const noteRef = doc(db, "users", uid, "notes", noteId);
  const cleanData = JSON.parse(JSON.stringify(data));
  return await setDoc(noteRef, {
    ...cleanData,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteFirebaseNote = async (uid, noteId) => {
  const noteRef = doc(db, "users", uid, "notes", noteId);
  return await deleteDoc(noteRef);
};
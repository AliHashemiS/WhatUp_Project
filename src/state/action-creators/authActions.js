import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';

export const googleSignIn = () => async (dispatch) => {

  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

  const q = query(
    collection(db, 'users'),
    where('email', '==', userCredential.user.email)
  );
  
  const querySnapshot = await getDocs(q);
  let result = null;
  querySnapshot.forEach((doc) => {
    result = doc.data();
  });

  let user;
  if (result && !result.enabled) {
    user = {
      ...result,
      uid: userCredential.user.uid,
      name: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      creationDate: new Date().toISOString().slice(0, 10),
    };
    await deleteDoc(doc(db, 'users', result.uid));
  } else {
    user = {
      email: userCredential.user.email,
      uid: userCredential.user.uid,
      name: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      creationDate: new Date().toISOString().slice(0, 10),
      numbMessage: 0,
      numbImage: 0,
      numbVideo: 0,
      numbAudio: 0,
      numbPDF: 0,
    };
  }
  await setDoc(doc(db, 'users', user.uid), user);
  dispatch({ type: 'GOOGLE_LOGIN_USER', payload: user });
};

export const getSession = (id) => async (dispatch) => {
  try {
    const userDocRef = doc(db, 'users', id);
    const user = await getDoc(userDocRef);
    dispatch({ type: 'LOGIN_USER', payload: user.data() });
  } catch (error) {
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  try {
    await signOut(auth);
    dispatch({ type: 'LOGOUT_USER' });
  } catch (error) {
    throw error;
  }
};

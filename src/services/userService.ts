import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase.ts';
import { UserProfile } from '../types/index.ts';
import { User } from 'firebase/auth';

const COLLECTION_NAME = 'users';

export async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userId = firebaseUser.uid;
  const userRef = doc(db, COLLECTION_NAME, userId);
  const path = `${COLLECTION_NAME}/${userId}`;

  try {
    const existingSnap = await getDoc(userRef);

    if (!existingSnap.exists()) {
      const newProfile = {
        id: userId,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Scholar',
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newProfile);
      return {
        id: userId,
        email: newProfile.email,
        displayName: newProfile.displayName,
        photoURL: newProfile.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      const data = existingSnap.data();
      // Update profile if displayName or photoURL changed
      const hasChanges = 
        (firebaseUser.displayName && firebaseUser.displayName !== data.displayName) ||
        (firebaseUser.photoURL && firebaseUser.photoURL !== data.photoURL);

      if (hasChanges) {
        await updateDoc(userRef, {
          displayName: firebaseUser.displayName || data.displayName,
          photoURL: firebaseUser.photoURL || data.photoURL,
          updatedAt: serverTimestamp(),
        });
      }

      return {
        id: userId,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

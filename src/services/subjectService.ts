import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase.ts';
import { Subject, SubjectFormData } from '../types/index.ts';

const COLLECTION_NAME = 'subjects';

export async function createSubject(
  userId: string,
  data: SubjectFormData
): Promise<string> {
  const subjectId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${subjectId}`;

  const payload: any = {
    id: subjectId,
    userId,
    name: data.name,
    color: data.color,
    icon: data.icon,
    targetHours: data.targetHours,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.code) {
    payload.code = data.code;
  }
  if (data.description) {
    payload.description = data.description;
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, subjectId), payload);
    return subjectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSubject(
  subjectId: string,
  userId: string,
  data: SubjectFormData
): Promise<void> {
  const path = `${COLLECTION_NAME}/${subjectId}`;

  const payload: any = {
    name: data.name,
    code: data.code || '',
    description: data.description || '',
    color: data.color,
    icon: data.icon,
    targetHours: data.targetHours,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, COLLECTION_NAME, subjectId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubject(subjectId: string, userId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${subjectId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, subjectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeSubjects(
  userId: string,
  onData: (subjects: Subject[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = COLLECTION_NAME;
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const subjects: Subject[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Subject;
        subjects.push(item);
      });

      // Sort by updatedAt descending, fallback to name
      subjects.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return timeB - timeA;
      });

      onData(subjects);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getSubjectsOnce(userId: string): Promise<Subject[]> {
  const path = COLLECTION_NAME;
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  try {
    const snapshot = await getDocs(q);
    const subjects: Subject[] = [];
    snapshot.forEach((docSnap) => {
      subjects.push(docSnap.data() as Subject);
    });
    return subjects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

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
import { Topic, TopicFormData } from '../types/index.ts';

const COLLECTION_NAME = 'topics';

export async function createTopic(
  userId: string,
  subjectId: string,
  data: TopicFormData
): Promise<string> {
  const topicId = `top_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${topicId}`;

  const payload: any = {
    id: topicId,
    userId,
    subjectId,
    title: data.title,
    status: data.status || 'not_started',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.description) {
    payload.description = data.description;
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, topicId), payload);
    return topicId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTopic(
  topicId: string,
  userId: string,
  data: TopicFormData
): Promise<void> {
  const path = `${COLLECTION_NAME}/${topicId}`;

  const payload: any = {
    title: data.title,
    description: data.description || '',
    status: data.status,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, COLLECTION_NAME, topicId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTopic(topicId: string, userId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${topicId}`;
  try {
    // Delete topic document
    await deleteDoc(doc(db, COLLECTION_NAME, topicId));

    // Cleanup cards belonging to this topic
    const cardsQ = query(
      collection(db, 'cards'),
      where('userId', '==', userId),
      where('topicId', '==', topicId)
    );
    const snap = await getDocs(cardsQ);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeTopics(
  userId: string,
  subjectId: string,
  onData: (topics: Topic[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = COLLECTION_NAME;
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('subjectId', '==', subjectId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const topics: Topic[] = [];
      snapshot.forEach((docSnap) => {
        topics.push(docSnap.data() as Topic);
      });

      // Sort by createdAt descending
      topics.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      onData(topics);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllUserTopics(
  userId: string,
  onData: (topics: Topic[]) => void,
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
      const topics: Topic[] = [];
      snapshot.forEach((docSnap) => {
        topics.push(docSnap.data() as Topic);
      });
      onData(topics);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

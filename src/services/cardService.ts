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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase.ts';
import { Flashcard, FlashcardFormData, ReviewLog } from '../types/index.ts';
import { createInitialSM2State, calculateSM2, ReviewRating } from '../utils/sm2.ts';

const CARDS_COLLECTION = 'cards';
const LOGS_COLLECTION = 'review_logs';

export async function createCard(
  userId: string,
  subjectId: string,
  topicId: string,
  data: FlashcardFormData
): Promise<string> {
  const cardId = `crd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${CARDS_COLLECTION}/${cardId}`;
  const initialSM2 = createInitialSM2State();

  const payload: any = {
    id: cardId,
    userId,
    subjectId,
    topicId,
    front: data.front,
    back: data.back,
    repetition: initialSM2.repetition,
    interval: initialSM2.interval,
    easeFactor: initialSM2.easeFactor,
    lapses: initialSM2.lapses,
    dueDate: initialSM2.dueDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, CARDS_COLLECTION, cardId), payload);
    return cardId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCard(
  cardId: string,
  userId: string,
  data: FlashcardFormData
): Promise<void> {
  const path = `${CARDS_COLLECTION}/${cardId}`;
  try {
    await updateDoc(doc(db, CARDS_COLLECTION, cardId), {
      front: data.front,
      back: data.back,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCard(cardId: string, userId: string): Promise<void> {
  const path = `${CARDS_COLLECTION}/${cardId}`;
  try {
    await deleteDoc(doc(db, CARDS_COLLECTION, cardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordReview(
  userId: string,
  card: Flashcard,
  rating: ReviewRating,
  now: Date = new Date()
): Promise<Flashcard> {
  const cardPath = `${CARDS_COLLECTION}/${card.id}`;
  const logId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const logPath = `${LOGS_COLLECTION}/${logId}`;

  const sm2Result = calculateSM2(
    {
      repetition: card.repetition,
      interval: card.interval,
      easeFactor: card.easeFactor,
      lapses: card.lapses,
      dueDate: card.dueDate,
      lastReviewedAt: card.lastReviewedAt,
    },
    rating,
    now
  );

  const updatedCardPayload: any = {
    repetition: sm2Result.repetition,
    interval: sm2Result.interval,
    easeFactor: sm2Result.easeFactor,
    lapses: sm2Result.lapses,
    dueDate: sm2Result.dueDate,
    lastReviewedAt: sm2Result.lastReviewedAt,
    updatedAt: serverTimestamp(),
  };

  const logPayload: any = {
    id: logId,
    userId,
    cardId: card.id,
    subjectId: card.subjectId,
    topicId: card.topicId,
    frontSnippet: card.front.slice(0, 80),
    rating,
    quality: sm2Result.quality,
    previousRepetition: card.repetition ?? 0,
    newRepetition: sm2Result.repetition,
    previousInterval: card.interval ?? 0,
    newInterval: sm2Result.interval,
    previousEaseFactor: card.easeFactor ?? 2.5,
    newEaseFactor: sm2Result.easeFactor,
    reviewedAt: serverTimestamp(),
  };

  try {
    // 1. Update card SM-2 state
    await updateDoc(doc(db, CARDS_COLLECTION, card.id), updatedCardPayload);

    // 2. Write immutable review log
    await setDoc(doc(db, LOGS_COLLECTION, logId), logPayload);

    return {
      ...card,
      repetition: sm2Result.repetition,
      interval: sm2Result.interval,
      easeFactor: sm2Result.easeFactor,
      lapses: sm2Result.lapses,
      dueDate: sm2Result.dueDate,
      lastReviewedAt: sm2Result.lastReviewedAt,
      updatedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, cardPath);
  }
}

export function subscribeCardsByTopic(
  userId: string,
  topicId: string,
  onData: (cards: Flashcard[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = CARDS_COLLECTION;
  const q = query(
    collection(db, CARDS_COLLECTION),
    where('userId', '==', userId),
    where('topicId', '==', topicId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const cards: Flashcard[] = [];
      snapshot.forEach((docSnap) => {
        cards.push(docSnap.data() as Flashcard);
      });
      cards.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      onData(cards);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeCardsByUser(
  userId: string,
  onData: (cards: Flashcard[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = CARDS_COLLECTION;
  const q = query(
    collection(db, CARDS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const cards: Flashcard[] = [];
      snapshot.forEach((docSnap) => {
        cards.push(docSnap.data() as Flashcard);
      });
      onData(cards);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeReviewLogs(
  userId: string,
  onData: (logs: ReviewLog[]) => void,
  onError: (error: Error) => void
): () => void {
  const path = LOGS_COLLECTION;
  const q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ReviewLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as ReviewLog);
      });
      // Sort most recent first
      logs.sort((a, b) => {
        const timeA = a.reviewedAt?.toMillis ? a.reviewedAt.toMillis() : (a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0);
        const timeB = b.reviewedAt?.toMillis ? b.reviewedAt.toMillis() : (b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0);
        return timeB - timeA;
      });
      onData(logs);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

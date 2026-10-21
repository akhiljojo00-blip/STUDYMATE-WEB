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
import { DocumentExtractionResult, StudyDocument } from '../types/index.ts';

const COLLECTION_NAME = 'documents';

export interface DocumentCreateInput {
  title: string;
  fileType: string;
  fileSize?: number;
  textContent: string;
  subjectId?: string;
  topicId?: string;
  summary?: string;
  keyPoints?: string[];
  wordCount?: number;
}

export const documentService = {
  /**
   * Send file or text to server for extraction, word counting, and structure parsing
   */
  async extractDocument(
    filename: string,
    fileType: string,
    content: { textContent?: string; base64Content?: string }
  ): Promise<DocumentExtractionResult> {
    const response = await fetch('/api/documents/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        fileType,
        textContent: content.textContent,
        base64Content: content.base64Content,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Extraction failed' }));
      throw new Error(err.error || 'Failed to extract text from document');
    }

    return await response.json();
  },

  /**
   * Save extracted document to Firestore
   */
  async createDocument(userId: string, input: DocumentCreateInput): Promise<string> {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const path = `${COLLECTION_NAME}/${docId}`;

    const payload: any = {
      id: docId,
      userId,
      title: input.title.trim().slice(0, 120),
      fileType: input.fileType || 'text/plain',
      status: 'ready',
      textContent: input.textContent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (input.fileSize !== undefined) payload.fileSize = input.fileSize;
    if (input.subjectId) payload.subjectId = input.subjectId;
    if (input.topicId) payload.topicId = input.topicId;
    if (input.summary) payload.summary = input.summary.slice(0, 10000);
    if (input.keyPoints) payload.keyPoints = input.keyPoints.slice(0, 50);
    if (input.wordCount !== undefined) payload.wordCount = input.wordCount;

    try {
      await setDoc(doc(db, COLLECTION_NAME, docId), payload);
      return docId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Update document summary or metadata
   */
  async updateDocumentSummary(
    docId: string,
    summary: string,
    keyPoints?: string[]
  ): Promise<void> {
    const path = `${COLLECTION_NAME}/${docId}`;
    const payload: any = {
      summary: summary.slice(0, 10000),
      updatedAt: serverTimestamp(),
    };
    if (keyPoints) {
      payload.keyPoints = keyPoints.slice(0, 50);
    }

    try {
      await updateDoc(doc(db, COLLECTION_NAME, docId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(docId: string): Promise<void> {
    const path = `${COLLECTION_NAME}/${docId}`;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Subscribe to real-time documents for a user
   */
  subscribeUserDocuments(
    userId: string,
    onSuccess: (documents: StudyDocument[]) => void,
    onError: (error: Error) => void
  ) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const docs: StudyDocument[] = snapshot.docs.map((d) => ({
          ...(d.data() as StudyDocument),
          id: d.id,
        }));
        // Sort newest first
        docs.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return tB - tA;
        });
        onSuccess(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
        onError(error);
      }
    );
  },

  /**
   * One-time fetch of user documents
   */
  async getUserDocuments(userId: string): Promise<StudyDocument[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    try {
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({
        ...(d.data() as StudyDocument),
        id: d.id,
      }));
      docs.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return tB - tA;
      });
      return docs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    }
  },
};

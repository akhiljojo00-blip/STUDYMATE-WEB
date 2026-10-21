/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { OverviewView } from './components/overview/OverviewView.tsx';
import { SubjectsView } from './components/subjects/SubjectsView.tsx';
import { SubjectModal } from './components/subjects/SubjectModal.tsx';
import { DeleteConfirmModal } from './components/subjects/DeleteConfirmModal.tsx';
import { SubjectDetailView } from './components/topics/SubjectDetailView.tsx';
import { TopicModal } from './components/topics/TopicModal.tsx';
import { TopicCardsView } from './components/cards/TopicCardsView.tsx';
import { CardModal } from './components/cards/CardModal.tsx';
import { RevisionRoomView } from './components/revision/RevisionRoomView.tsx';
import { ActiveRecallSession } from './components/revision/ActiveRecallSession.tsx';
import { StudyBuddyView } from './components/buddy/StudyBuddyView.tsx';
import { StudyLibraryView } from './components/library/StudyLibraryView.tsx';
import { PracticeQuestionsModal } from './components/practice/PracticeQuestionsModal.tsx';
import {
  Subject,
  SubjectFormData,
  Topic,
  TopicFormData,
  TopicStatus,
  Flashcard,
  FlashcardFormData,
  ReviewLog,
  StudyDocument,
  NavTab,
} from './types/index.ts';
import { documentService } from './services/documentService.ts';
import {
  subscribeSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from './services/subjectService.ts';
import {
  subscribeAllUserTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from './services/topicService.ts';
import {
  subscribeCardsByUser,
  subscribeReviewLogs,
  createCard,
  updateCard,
  deleteCard,
  recordReview,
} from './services/cardService.ts';
import { ReviewRating, calculateSM2, createInitialSM2State, formatDateISO, addDays } from './utils/sm2.ts';
import { BookOpen } from 'lucide-react';

const TODAY_STR = formatDateISO();
const YESTERDAY_STR = formatDateISO(addDays(new Date(), -1));
const FUTURE_STR = formatDateISO(addDays(new Date(), 6));

const SEED_DEMO_SUBJECTS: Subject[] = [
  {
    id: 'demo-sub-1',
    userId: 'demo-student-user',
    name: 'Molecular Biology & Genetics',
    code: 'BIO-201',
    description: 'Cellular regulation, transcription mechanisms, and CRISPR gene editing principles.',
    color: 'emerald',
    icon: 'FlaskConical',
    targetHours: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-sub-2',
    userId: 'demo-student-user',
    name: 'Algorithms & Computational Complexity',
    code: 'CS-301',
    description: 'Graph theory, dynamic programming, NP-completeness, and divide-and-conquer analysis.',
    color: 'forest',
    icon: 'Code',
    targetHours: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-sub-3',
    userId: 'demo-student-user',
    name: 'Cognitive Psychology & Memory',
    code: 'PSY-110',
    description: 'Ebbinghaus forgetting curves, dual-coding theory, and retrieval practice models.',
    color: 'terracotta',
    icon: 'Brain',
    targetHours: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const SEED_DEMO_TOPICS: Topic[] = [
  {
    id: 'demo-top-1',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-1',
    title: 'DNA Helicase & Replication Fork',
    description: 'Enzyme mechanics, single-strand binding proteins, and bidirectional unwinding.',
    status: 'learning',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-top-2',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-1',
    title: 'CRISPR-Cas9 Targeted Cleavage',
    description: 'Guide RNA matching, PAM sequences, and non-homologous end joining.',
    status: 'not_started',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-top-3',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-2',
    title: 'Dynamic Programming & Memoization',
    description: 'Optimal substructure, overlapping subproblems, and topological subproblem DAGs.',
    status: 'learning',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-top-4',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-3',
    title: 'Retrieval Practice & Testing Effect',
    description: 'Effortful recall strengthening synaptic connectivity vs passive rereading.',
    status: 'reviewed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const SEED_DEMO_CARDS: Flashcard[] = [
  {
    id: 'demo-crd-1',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-1',
    topicId: 'demo-top-1',
    front: 'What is the biochemical function of DNA Topoisomerase (Gyrase) during replication?',
    back: 'It relieves positive supercoiling and torsional strain ahead of the replication fork by transiently cutting and re-ligating phosphodiester bonds.',
    repetition: 1,
    interval: 1,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: TODAY_STR,
    lastReviewedAt: YESTERDAY_STR,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-crd-2',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-1',
    topicId: 'demo-top-1',
    front: 'Why does DNA synthesis require an RNA primer before DNA polymerase can begin elongation?',
    back: 'DNA polymerases cannot initiate synthesis de novo; they require an existing 3\'-OH group to attach the incoming deoxynucleotide triphosphate (dNTP).',
    repetition: 2,
    interval: 3,
    easeFactor: 2.36,
    lapses: 1,
    dueDate: TODAY_STR,
    lastReviewedAt: YESTERDAY_STR,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-crd-3',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-2',
    topicId: 'demo-top-3',
    front: 'What are the two formal prerequisites for applying Dynamic Programming to an algorithmic problem?',
    back: '1. Overlapping Subproblems (the same subproblems are solved repeatedly).\n2. Optimal Substructure (an optimal solution contains optimal solutions to subproblems).',
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    lapses: 0,
    dueDate: TODAY_STR,
    lastReviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-crd-4',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-3',
    topicId: 'demo-top-4',
    front: 'How does the Testing Effect differ from standard passive rereading in memory consolidation?',
    back: 'Active retrieval practice triggers reconstructive memory pathways, strengthening neural retrieval routes and significantly attenuating the Ebbinghaus forgetting rate compared to passive familiarity.',
    repetition: 3,
    interval: 6,
    easeFactor: 2.6,
    lapses: 0,
    dueDate: FUTURE_STR,
    lastReviewedAt: YESTERDAY_STR,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const SEED_DEMO_DOCUMENTS: StudyDocument[] = [
  {
    id: 'demo-doc-1',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-1',
    topicId: 'demo-top-1',
    title: 'Molecular Genetics Lecture Notes: DNA Transcription & Translation',
    fileType: 'text/markdown',
    fileSize: 4200,
    status: 'ready',
    textContent: `# Molecular Genetics Lecture 4: DNA Transcription & Protein Synthesis

## 1. Central Dogma Overview
The central dogma of molecular biology illustrates the directional flow of genetic information: DNA is transcribed into messenger RNA (mRNA), which is subsequently translated into functional polypeptide chains by ribosomes.

## 2. Transcription Mechanism
1. Initiation: RNA Polymerase binds specifically to the promoter region (such as the TATA box in eukaryotes) with the assistance of transcription factors. The DNA double helix unwinds locally to expose the template strand.
2. Elongation: RNA Polymerase traverses the template strand in the 3' to 5' direction, synthesizing a complementary pre-mRNA molecule in the 5' to 3' direction using ribonucleotide triphosphates (rNTPs). Uracil (U) substitutes for Thymine (T).
3. Termination: In eukaryotes, transcription proceeds until polyadenylation signals trigger cleavage of the nascent RNA transcript.

## 3. Post-Transcriptional Processing
- 5' 7-methylguanosine capping: Protects nascent pre-mRNA from enzymatic degradation and recruits ribosomal subunits.
- 3' Poly-A tail addition: Adds 150-250 adenine residues for stability and nuclear export.
- Spliceosome Splicing: Spliceosomes excise non-coding introns while joining exons together to form mature mRNA.`,
    summary: 'Comprehensive lecture notes detailing the Central Dogma, RNA Polymerase stages (initiation, elongation, termination), and eukaryotic post-transcriptional modifications including 5\' capping, poly-A tailing, and spliceosome splicing.',
    keyPoints: [
      'RNA Polymerase binds to the promoter and synthesizes mRNA in the 5\' to 3\' direction.',
      'Eukaryotic pre-mRNA requires 5\' capping, 3\' polyadenylation, and intron splicing before translation.',
      'Uracil pairs with Adenine in RNA instead of Thymine.',
    ],
    wordCount: 198,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-doc-2',
    userId: 'demo-student-user',
    subjectId: 'demo-sub-2',
    topicId: 'demo-top-3',
    title: 'Algorithms Revision Guide: Dynamic Programming Principles',
    fileType: 'text/plain',
    fileSize: 3100,
    status: 'ready',
    textContent: `Algorithms & Data Structures: Dynamic Programming Study Guide

Dynamic Programming (DP) is an algorithmic optimization paradigm used to solve problems exhibiting two foundational properties:
1. Optimal Substructure: An optimal solution to the global problem incorporates optimal solutions to its constituent subproblems.
2. Overlapping Subproblems: The problem space evaluates identical smaller subproblems repeatedly rather than generating entirely new subproblems.

Approaches:
- Top-Down with Memoization: Recursion augmented with a cache (hash map or table) that retains precomputed solutions.
- Bottom-Up Tabulation: Iterative state transitions filling an n-dimensional table starting from base conditions.

Canonical Exam Examples:
- 0/1 Knapsack Problem: Space-time tradeoff O(n*W) using 1D or 2D array states.
- Longest Common Subsequence (LCS): Evaluates string alignments with O(m*n) complexity.
- Bellman-Ford Shortest Path: Relaxes edges iteratively to accommodate negative edge weights.`,
    summary: 'A structured revision guide outlining Dynamic Programming requirements: Optimal Substructure and Overlapping Subproblems, comparing Top-Down Memoization vs Bottom-Up Tabulation, and detailing canonical exam problems.',
    keyPoints: [
      'Two requirements: Optimal Substructure and Overlapping Subproblems.',
      'Top-down memoization caches recursive calls; bottom-up tabulation computes iteratively.',
      'Prevents exponential recomputation of identical subtrees.',
    ],
    wordCount: 142,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MainApp: React.FC = () => {
  const { user, userProfile, isDemo, loading: authLoading, enterDemoMode } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Deep Navigation State
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeStudySession, setActiveStudySession] = useState<{
    cards: Flashcard[];
    title: string;
    returnTab: NavTab;
  } | null>(null);

  // Data Collections State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [documents, setDocuments] = useState<StudyDocument[]>([]);

  // Practice Questions Modal State
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [practiceModalContext, setPracticeModalContext] = useState<{
    subjectId?: string;
    topicId?: string;
    docId?: string;
  }>({});
  const [buddyInitialDocId, setBuddyInitialDocId] = useState<string | null>(null);

  // Loading & Error States
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Subject Modals State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Topic Modals State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Card Modals State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Generic Deletion Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    badge?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });
  const [deleting, setDeleting] = useState(false);

  // Check URL query parameters for ?autostart=1 or ?demo=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('autostart') === '1' || params.get('demo') === '1') && !user && !isDemo) {
      enterDemoMode();
    }
  }, [user, isDemo, enterDemoMode]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (user) {
      setLoadingSubjects(true);
      setSubjectsError(null);

      // 1. Subjects subscription
      const unsubSubjects = subscribeSubjects(
        user.uid,
        (fetchedSubjects) => {
          setSubjects(fetchedSubjects);
          setLoadingSubjects(false);
        },
        (error) => {
          console.error('Firestore subjects error:', error);
          setSubjectsError(error.message || 'Error syncing subjects.');
          setLoadingSubjects(false);
        }
      );

      // 2. Topics subscription
      const unsubTopics = subscribeAllUserTopics(
        user.uid,
        (fetchedTopics) => {
          setTopics(fetchedTopics);
        },
        (error) => console.error('Firestore topics error:', error)
      );

      // 3. Cards subscription
      const unsubCards = subscribeCardsByUser(
        user.uid,
        (fetchedCards) => {
          setCards(fetchedCards);
        },
        (error) => console.error('Firestore cards error:', error)
      );

      // 4. Review logs subscription
      const unsubLogs = subscribeReviewLogs(
        user.uid,
        (fetchedLogs) => {
          setReviewLogs(fetchedLogs);
        },
        (error) => console.error('Firestore review logs error:', error)
      );

      // 5. Study documents subscription
      const unsubDocs = documentService.subscribeUserDocuments(
        user.uid,
        (fetchedDocs) => {
          setDocuments(fetchedDocs);
        },
        (error) => console.error('Firestore documents error:', error)
      );

      return () => {
        unsubSubjects();
        unsubTopics();
        unsubCards();
        unsubLogs();
        unsubDocs();
      };
    } else if (isDemo) {
      // Seed Demo scholar state
      setSubjects((prev) => (prev.length > 0 ? prev : SEED_DEMO_SUBJECTS));
      setTopics((prev) => (prev.length > 0 ? prev : SEED_DEMO_TOPICS));
      setCards((prev) => (prev.length > 0 ? prev : SEED_DEMO_CARDS));
      setDocuments((prev) => (prev.length > 0 ? prev : SEED_DEMO_DOCUMENTS));
      setLoadingSubjects(false);
      setSubjectsError(null);
    } else {
      setSubjects([]);
      setTopics([]);
      setCards([]);
      setReviewLogs([]);
      setDocuments([]);
      setLoadingSubjects(false);
    }
  }, [user, isDemo]);

  // Lookup maps
  const subjectsMap = useMemo(() => {
    return subjects.reduce<Record<string, Subject>>((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});
  }, [subjects]);

  const topicsMap = useMemo(() => {
    return topics.reduce<Record<string, Topic>>((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
  }, [topics]);

  // ==========================================
  // Subject Handlers
  // ==========================================
  const handleSaveSubject = async (formData: SubjectFormData) => {
    if (user) {
      if (editingSubject) {
        await updateSubject(editingSubject.id, user.uid, formData);
      } else {
        await createSubject(user.uid, formData);
      }
    } else if (isDemo) {
      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === editingSubject.id
              ? {
                  ...s,
                  name: formData.name,
                  code: formData.code,
                  description: formData.description,
                  color: formData.color,
                  icon: formData.icon,
                  targetHours: formData.targetHours,
                  updatedAt: new Date(),
                }
              : s
          )
        );
      } else {
        const newSub: Subject = {
          id: `demo-sub-${Date.now()}`,
          userId: 'demo-student-user',
          name: formData.name,
          code: formData.code,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          targetHours: formData.targetHours,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setSubjects((prev) => [newSub, ...prev]);
      }
    }
  };

  const promptDeleteSubject = (subject: Subject) => {
    setDeleteModal({
      isOpen: true,
      title: `Delete "${subject.name}"?`,
      description:
        'All curriculum units, topics, and active-recall flashcards for this course will be permanently removed.',
      badge: subject.code ? `Course Code: ${subject.code}` : undefined,
      onConfirm: async () => {
        try {
          setDeleting(true);
          if (user) {
            await deleteSubject(subject.id, user.uid);
          } else if (isDemo) {
            setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
            setTopics((prev) => prev.filter((t) => t.subjectId !== subject.id));
            setCards((prev) => prev.filter((c) => c.subjectId !== subject.id));
          }
          if (activeSubject?.id === subject.id) {
            setActiveSubject(null);
            setActiveTopic(null);
          }
          setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  // ==========================================
  // Topic Handlers
  // ==========================================
  const handleSaveTopic = async (formData: TopicFormData) => {
    if (!activeSubject) return;

    if (user) {
      if (editingTopic) {
        await updateTopic(editingTopic.id, user.uid, formData);
      } else {
        await createTopic(user.uid, activeSubject.id, formData);
      }
    } else if (isDemo) {
      if (editingTopic) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === editingTopic.id
              ? {
                  ...t,
                  title: formData.title,
                  description: formData.description,
                  status: formData.status,
                  updatedAt: new Date(),
                }
              : t
          )
        );
      } else {
        const newTopic: Topic = {
          id: `demo-top-${Date.now()}`,
          userId: 'demo-student-user',
          subjectId: activeSubject.id,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTopics((prev) => [newTopic, ...prev]);
      }
    }
  };

  const handleUpdateTopicStatus = async (topic: Topic, newStatus: TopicStatus) => {
    if (user) {
      await updateTopic(topic.id, user.uid, {
        title: topic.title,
        description: topic.description || '',
        status: newStatus,
      });
    } else if (isDemo) {
      setTopics((prev) =>
        prev.map((t) => (t.id === topic.id ? { ...t, status: newStatus } : t))
      );
    }
  };

  const promptDeleteTopic = (topic: Topic) => {
    setDeleteModal({
      isOpen: true,
      title: `Delete "${topic.title}"?`,
      description:
        'All flashcards and review scheduling records associated with this topic will be permanently removed.',
      onConfirm: async () => {
        try {
          setDeleting(true);
          if (user) {
            await deleteTopic(topic.id, user.uid);
          } else if (isDemo) {
            setTopics((prev) => prev.filter((t) => t.id !== topic.id));
            setCards((prev) => prev.filter((c) => c.topicId !== topic.id));
          }
          if (activeTopic?.id === topic.id) {
            setActiveTopic(null);
          }
          setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  // ==========================================
  // Flashcard Handlers
  // ==========================================
  const handleSaveCard = async (formData: FlashcardFormData) => {
    if (!activeSubject || !activeTopic) return;

    if (user) {
      if (editingCard) {
        await updateCard(editingCard.id, user.uid, formData);
      } else {
        await createCard(user.uid, activeSubject.id, activeTopic.id, formData);
      }
    } else if (isDemo) {
      if (editingCard) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  front: formData.front,
                  back: formData.back,
                  updatedAt: new Date(),
                }
              : c
          )
        );
      } else {
        const initialSM2 = createInitialSM2State();
        const newCard: Flashcard = {
          id: `demo-crd-${Date.now()}`,
          userId: 'demo-student-user',
          subjectId: activeSubject.id,
          topicId: activeTopic.id,
          front: formData.front,
          back: formData.back,
          repetition: initialSM2.repetition,
          interval: initialSM2.interval,
          easeFactor: initialSM2.easeFactor,
          lapses: initialSM2.lapses,
          dueDate: initialSM2.dueDate,
          lastReviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCards((prev) => [newCard, ...prev]);
      }
    }
  };

  const promptDeleteCard = (card: Flashcard) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete this flashcard?',
      description:
        'This active-recall card and its SM-2 review intervals will be removed from your revision deck.',
      onConfirm: async () => {
        try {
          setDeleting(true);
          if (user) {
            await deleteCard(card.id, user.uid);
          } else if (isDemo) {
            setCards((prev) => prev.filter((c) => c.id !== card.id));
          }
          setDeleteModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  // ==========================================
  // Review Session Handler
  // ==========================================
  const handleRecordReview = async (card: Flashcard, rating: ReviewRating) => {
    const now = new Date();
    if (user) {
      await recordReview(user.uid, card, rating, now);
    } else if (isDemo) {
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

      // Update card in local demo cards state
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                repetition: sm2Result.repetition,
                interval: sm2Result.interval,
                easeFactor: sm2Result.easeFactor,
                lapses: sm2Result.lapses,
                dueDate: sm2Result.dueDate,
                lastReviewedAt: sm2Result.lastReviewedAt,
                updatedAt: new Date(),
              }
            : c
        )
      );

      // Append to demo review logs
      const newLog: ReviewLog = {
        id: `demo-log-${Date.now()}`,
        userId: 'demo-student-user',
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
        reviewedAt: new Date(),
      };
      setReviewLogs((prev) => [newLog, ...prev]);
    }
  };

  // Tab switch handler: resets deep views
  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setActiveSubject(null);
    setActiveTopic(null);
    setActiveStudySession(null);
  };

  // Auth resolving screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#153225] text-[#FAF8F5] flex items-center justify-center shadow-md animate-pulse mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="font-serif text-xl font-semibold text-[#153225]">
          StudyMate
        </p>
        <p className="text-xs text-[#88938C] mt-1 font-mono">
          Connecting to secure workspace...
        </p>
      </div>
    );
  }

  if (!user && !isDemo) {
    return <LoginView />;
  }

  return (
    <AppShell currentTab={currentTab} onTabChange={handleTabChange}>
      {/* 1. Active Study Session Overlay (Highest Precedence) */}
      {activeStudySession ? (
        <ActiveRecallSession
          key={activeStudySession.title}
          cards={activeStudySession.cards}
          title={activeStudySession.title}
          onRecordReview={handleRecordReview}
          onExit={() => {
            const returnTo = activeStudySession.returnTab;
            setActiveStudySession(null);
            setCurrentTab(returnTo);
          }}
          onReturnToOverview={() => {
            setActiveStudySession(null);
            setCurrentTab('overview');
          }}
          onReturnToRevision={() => {
            setActiveStudySession(null);
            setCurrentTab('revision');
          }}
          onDrillHardCards={(cardsToDrill) => {
            setActiveStudySession({
              cards: cardsToDrill,
              title: `Focused Reinforcement Drill (${cardsToDrill.length} ${cardsToDrill.length === 1 ? 'card' : 'cards'})`,
              returnTab: activeStudySession.returnTab,
            });
          }}
          onOpenStudyBuddy={(subjectId, topicId) => {
            setActiveStudySession(null);
            setCurrentTab('buddy');
          }}
          subjectsMap={subjectsMap}
          topicsMap={topicsMap}
        />
      ) : activeTopic && activeSubject ? (
        /* 2. Topic Flashcards Management View */
        <TopicCardsView
          subject={activeSubject}
          topic={activeTopic}
          cards={cards.filter((c) => c.topicId === activeTopic.id)}
          loading={loadingSubjects}
          onBackToTopic={() => setActiveTopic(null)}
          onAddCard={() => {
            setEditingCard(null);
            setCardModalOpen(true);
          }}
          onEditCard={(card) => {
            setEditingCard(card);
            setCardModalOpen(true);
          }}
          onDeleteCard={promptDeleteCard}
          onStartStudy={(topicCards, studyTitle) => {
            setActiveStudySession({
              cards: topicCards,
              title: studyTitle,
              returnTab: 'subjects',
            });
          }}
        />
      ) : activeSubject ? (
        /* 3. Subject Detail & Topics View */
        <SubjectDetailView
          subject={activeSubject}
          topics={topics.filter((t) => t.subjectId === activeSubject.id)}
          cards={cards.filter((c) => c.subjectId === activeSubject.id)}
          loading={loadingSubjects}
          onBack={() => setActiveSubject(null)}
          onAddTopic={() => {
            setEditingTopic(null);
            setTopicModalOpen(true);
          }}
          onEditTopic={(topic) => {
            setEditingTopic(topic);
            setTopicModalOpen(true);
          }}
          onDeleteTopic={promptDeleteTopic}
          onOpenTopicCards={(topic) => setActiveTopic(topic)}
          onStartSubjectStudy={(subjectCards, studyTitle) => {
            setActiveStudySession({
              cards: subjectCards,
              title: studyTitle,
              returnTab: 'subjects',
            });
          }}
          onUpdateTopicStatus={handleUpdateTopicStatus}
        />
      ) : (
        /* 4. Main Nav Tab Views */
        <>
          {currentTab === 'overview' && (
            <OverviewView
              displayName={userProfile?.displayName || user?.displayName || 'Scholar'}
              subjects={subjects}
              cards={cards}
              loading={loadingSubjects}
              onNavigateToSubjects={() => setCurrentTab('subjects')}
              onNavigateToRevision={() => setCurrentTab('revision')}
              onSelectSubject={(sub) => {
                setActiveSubject(sub);
                setCurrentTab('subjects');
              }}
              onAddSubject={() => {
                setEditingSubject(null);
                setSubjectModalOpen(true);
              }}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              loading={loadingSubjects}
              error={subjectsError}
              onAddSubject={() => {
                setEditingSubject(null);
                setSubjectModalOpen(true);
              }}
              onEditSubject={(subject) => {
                setEditingSubject(subject);
                setSubjectModalOpen(true);
              }}
              onDeleteSubject={promptDeleteSubject}
              onSelectSubject={(subject) => setActiveSubject(subject)}
            />
          )}

          {currentTab === 'revision' && (
            <RevisionRoomView
              cards={cards}
              subjects={subjects}
              topics={topics}
              reviewLogs={reviewLogs}
              loading={loadingSubjects}
              onStartReview={(cardsToStudy, sessionTitle) => {
                setActiveStudySession({
                  cards: cardsToStudy,
                  title: sessionTitle,
                  returnTab: 'revision',
                });
              }}
              onNavigateToSubjects={() => setCurrentTab('subjects')}
            />
          )}

          {currentTab === 'library' && (
            <StudyLibraryView
              documents={documents}
              subjects={subjects}
              topics={topics}
              userId={user?.uid || 'demo-student-user'}
              onOpenStudyBuddyWithDoc={(docId) => {
                setBuddyInitialDocId(docId);
                setCurrentTab('buddy');
              }}
              onOpenQuestionGeneratorWithDoc={(docId, subId, topId) => {
                setPracticeModalContext({
                  docId,
                  subjectId: subId,
                  topicId: topId,
                });
                setPracticeModalOpen(true);
              }}
            />
          )}

          {currentTab === 'buddy' && (
            <StudyBuddyView
              subjects={subjects}
              topics={topics}
              documents={documents}
              userId={user?.uid || 'demo-student-user'}
              initialDocumentId={buddyInitialDocId}
              onOpenQuestionGenerator={(subId, topId) => {
                setPracticeModalContext({
                  subjectId: subId,
                  topicId: topId,
                });
                setPracticeModalOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Modals */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleSaveSubject}
        subjectToEdit={editingSubject}
      />

      <TopicModal
        isOpen={topicModalOpen}
        onClose={() => {
          setTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSave={handleSaveTopic}
        topicToEdit={editingTopic}
        subjectName={activeSubject?.name || 'Subject'}
      />

      <CardModal
        isOpen={cardModalOpen}
        onClose={() => {
          setCardModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
        cardToEdit={editingCard}
        topicTitle={activeTopic?.title || 'Topic'}
      />

      <PracticeQuestionsModal
        isOpen={practiceModalOpen}
        onClose={() => {
          setPracticeModalOpen(false);
          setPracticeModalContext({});
        }}
        subjects={subjects}
        topics={topics}
        documents={documents}
        userId={user?.uid || 'demo-student-user'}
        initialSubjectId={practiceModalContext.subjectId}
        initialTopicId={practiceModalContext.topicId}
        initialDocumentId={practiceModalContext.docId}
        onSaveCard={async (subjectId, topicId, cardData) => {
          if (user) {
            await createCard(user.uid, subjectId, topicId, cardData);
          } else if (isDemo) {
            const newCard: Flashcard = {
              id: `demo-crd-${Date.now()}`,
              userId: 'demo-student-user',
              subjectId,
              topicId,
              front: cardData.front,
              back: cardData.back,
              repetition: 0,
              interval: 0,
              easeFactor: 2.5,
              lapses: 0,
              dueDate: new Date().toISOString().split('T')[0],
              lastReviewedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setCards((prev) => [newCard, ...prev]);
          }
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        description={deleteModal.description}
        badge={deleteModal.badge}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
        deleting={deleting}
      />
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

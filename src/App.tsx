/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { OverviewView } from './components/overview/OverviewView.tsx';
import { SubjectsView } from './components/subjects/SubjectsView.tsx';
import { SubjectModal } from './components/subjects/SubjectModal.tsx';
import { DeleteConfirmModal } from './components/subjects/DeleteConfirmModal.tsx';
import { ComingSoonView } from './components/common/ComingSoonView.tsx';
import { Subject, SubjectFormData, NavTab } from './types/index.ts';
import {
  subscribeSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from './services/subjectService.ts';
import { BookOpen } from 'lucide-react';

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

const MainApp: React.FC = () => {
  const { user, userProfile, isDemo, loading: authLoading, enterDemoMode } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Subject Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check URL query parameters for ?autostart=1 or ?demo=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('autostart') === '1' || params.get('demo') === '1') && !user && !isDemo) {
      enterDemoMode();
    }
  }, [user, isDemo, enterDemoMode]);

  // Subscribe to real Firestore subjects when authenticated user is present
  useEffect(() => {
    if (user) {
      setLoadingSubjects(true);
      setSubjectsError(null);

      const unsubscribe = subscribeSubjects(
        user.uid,
        (fetchedSubjects) => {
          setSubjects(fetchedSubjects);
          setLoadingSubjects(false);
        },
        (error) => {
          console.error('Firestore subscription error:', error);
          setSubjectsError(error.message || 'Error syncing subjects from Firestore.');
          setLoadingSubjects(false);
        }
      );

      return () => unsubscribe();
    } else if (isDemo) {
      // Load demo initial subjects if not already set
      setSubjects((prev) => (prev.length > 0 ? prev : SEED_DEMO_SUBJECTS));
      setLoadingSubjects(false);
      setSubjectsError(null);
    } else {
      setSubjects([]);
      setLoadingSubjects(false);
    }
  }, [user, isDemo]);

  // Handle Save Subject (Create / Update)
  const handleSaveSubject = async (formData: SubjectFormData) => {
    if (user) {
      if (editingSubject) {
        await updateSubject(editingSubject.id, user.uid, formData);
      } else {
        await createSubject(user.uid, formData);
      }
    } else if (isDemo) {
      // Update local demo state
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
        const newDemoSub: Subject = {
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
        setSubjects((prev) => [newDemoSub, ...prev]);
      }
    }
  };

  // Handle Delete Subject
  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      setDeleting(true);
      if (user) {
        await deleteSubject(subjectToDelete.id, user.uid);
      } else if (isDemo) {
        setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
      }
      setDeleteModalOpen(false);
      setSubjectToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setSubjectsError(err.message || 'Failed to delete subject.');
    } finally {
      setDeleting(false);
    }
  };

  // Show Loading Screen while initial Firebase auth is resolving
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

  // If unauthenticated and not in demo mode, show LoginView
  if (!user && !isDemo) {
    return <LoginView />;
  }

  return (
    <AppShell currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'overview' && (
        <OverviewView
          displayName={userProfile?.displayName || user?.displayName || 'Scholar'}
          subjects={subjects}
          loading={loadingSubjects}
          onNavigateToSubjects={() => setCurrentTab('subjects')}
          onAddSubject={() => {
            setEditingSubject(null);
            setModalOpen(true);
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
            setModalOpen(true);
          }}
          onEditSubject={(subject) => {
            setEditingSubject(subject);
            setModalOpen(true);
          }}
          onDeleteSubject={(subject) => {
            setSubjectToDelete(subject);
            setDeleteModalOpen(true);
          }}
        />
      )}

      {(currentTab === 'revision' ||
        currentTab === 'library' ||
        currentTab === 'buddy') && (
        <ComingSoonView
          tab={currentTab}
          onNavigateHome={() => setCurrentTab('overview')}
        />
      )}

      {/* Add / Edit Subject Modal */}
      <SubjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSubject(null);
        }}
        onSave={handleSaveSubject}
        subjectToEdit={editingSubject}
      />

      {/* Delete Subject Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        subject={subjectToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
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

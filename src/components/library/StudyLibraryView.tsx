import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  BookOpen,
  Trash2,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { StudyDocument, Subject, Topic } from '../../types/index.ts';
import { documentService } from '../../services/documentService.ts';
import { aiService } from '../../services/aiService.ts';

interface StudyLibraryViewProps {
  documents: StudyDocument[];
  subjects: Subject[];
  topics: Topic[];
  userId: string;
  onOpenStudyBuddyWithDoc: (docId: string) => void;
  onOpenQuestionGeneratorWithDoc: (docId: string, subjectId?: string, topicId?: string) => void;
  onRefreshDocuments?: () => void;
}

export const StudyLibraryView: React.FC<StudyLibraryViewProps> = ({
  documents,
  subjects,
  topics,
  userId,
  onOpenStudyBuddyWithDoc,
  onOpenQuestionGeneratorWithDoc,
  onRefreshDocuments,
}) => {
  // Tab within library: 'files' | 'upload' | 'paste'
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'paste'>('files');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Paste note state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');

  // Reader Modal State
  const [activeReadingDoc, setActiveReadingDoc] = useState<StudyDocument | null>(null);
  const [readerSearchTerm, setReaderSearchTerm] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<StudyDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = !filterSubjectId || doc.subjectId === filterSubjectId;
    return matchesSearch && matchesSubject;
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size check (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File exceeds maximum size of 10MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Process and upload file
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadError(null);

    try {
      // Read file
      const reader = new FileReader();

      const isText = selectedFile.type.includes('text') ||
        selectedFile.name.endsWith('.txt') ||
        selectedFile.name.endsWith('.md');

      if (isText) {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsArrayBuffer(selectedFile);
      }

      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            let extracted;
            if (isText) {
              const textContent = reader.result as string;
              extracted = await documentService.extractDocument(selectedFile.name, selectedFile.type, {
                textContent,
              });
            } else {
              // Convert ArrayBuffer to base64
              const bytes = new Uint8Array(reader.result as ArrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Content = btoa(binary);

              extracted = await documentService.extractDocument(selectedFile.name, selectedFile.type, {
                base64Content,
              });
            }

            // Save to Firestore
            await documentService.createDocument(userId, {
              title: extracted.title || selectedFile.name,
              fileType: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
              fileSize: selectedFile.size,
              textContent: extracted.textContent,
              wordCount: extracted.wordCount,
              subjectId: uploadSubjectId || undefined,
              topicId: uploadTopicId || undefined,
            });

            resolve();
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('files');
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to extract text from document. Please verify the file is not password-protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle direct text paste
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedTitle.trim() || !pastedContent.trim()) {
      setUploadError('Please provide both a title and notes content.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    try {
      const extracted = await documentService.extractDocument(pastedTitle.trim(), 'text/markdown', {
        textContent: pastedContent.trim(),
      });

      await documentService.createDocument(userId, {
        title: pastedTitle.trim(),
        fileType: 'text/markdown',
        fileSize: new Blob([pastedContent]).size,
        textContent: extracted.textContent,
        wordCount: extracted.wordCount,
        subjectId: uploadSubjectId || undefined,
        topicId: uploadTopicId || undefined,
      });

      setPastedTitle('');
      setPastedContent('');
      setActiveTab('files');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save notes.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Request AI Summary for the opened document
  const handleGenerateSummary = async (doc: StudyDocument) => {
    setIsSummarizing(true);
    try {
      const res = await aiService.summarizeDocument(doc.textContent, doc.title, userId);
      await documentService.updateDocumentSummary(doc.id, res.summary, res.keyPoints);
      setActiveReadingDoc((prev) =>
        prev && prev.id === doc.id
          ? { ...prev, summary: res.summary, keyPoints: res.keyPoints }
          : prev
      );
    } catch (err: any) {
      console.error('Summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    try {
      await documentService.deleteDocument(docId);
      if (activeReadingDoc?.id === docId) {
        setActiveReadingDoc(null);
      }
      setDeleteConfirmDoc(null);
    } catch (err: any) {
      console.error('Delete document error:', err);
    }
  };

  // Highlight search text inside reader
  const renderHighlightedContent = (text: string, term: string) => {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-stone-900 rounded px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#EBE5DF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E9F0EC] text-[#1E3A2F]">
              Study Library
            </span>
            <span className="text-xs text-[#8C827A]">
              {documents.length} {documents.length === 1 ? 'material' : 'materials'} uploaded
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#1C1917]">
            Your Knowledge Repository
          </h1>
          <p className="text-sm text-[#6B6560] mt-0.5">
            Upload syllabi, lecture slides, or reading notes to ground your AI Study Buddy and generate quizzes.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('files');
              setUploadError(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'files'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6560] hover:bg-[#EBE5DF]/60'
            }`}
          >
            All Documents ({documents.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              setUploadError(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6560] hover:bg-[#EBE5DF]/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload PDF / Text
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setUploadError(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6B6560] hover:bg-[#EBE5DF]/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Paste Notes
          </button>
        </div>
      </div>

      {/* Tab: Upload File */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-2xl border border-[#EBE5DF] p-6 shadow-xs">
          <h2 className="font-serif text-lg font-semibold text-[#1C1917] mb-1">
            Upload Study Material
          </h2>
          <p className="text-xs text-[#6B6560] mb-5">
            Supported formats: PDF, Markdown (.md), or Plain Text (.txt). Maximum file size: 10MB.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-2xl">
            {/* Subject / Topic Association */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4A453E] mb-1">
                  Associate with Subject (Optional)
                </label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => {
                    setUploadSubjectId(e.target.value);
                    setUploadTopicId('');
                  }}
                  className="w-full bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                >
                  <option value="">None / General</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {uploadSubjectId && (
                <div>
                  <label className="block text-xs font-medium text-[#4A453E] mb-1">
                    Associate with Topic (Optional)
                  </label>
                  <select
                    value={uploadTopicId}
                    onChange={(e) => setUploadTopicId(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                  >
                    <option value="">None / General Subject</option>
                    {topics
                      .filter((t) => t.subjectId === uploadSubjectId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#DCD5CE] hover:border-[#1E3A2F] rounded-xl p-8 text-center bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-[#8C827A] mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">{selectedFile.name}</p>
                  <p className="text-xs text-[#8C827A] mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">
                    Click or drag file here to upload
                  </p>
                  <p className="text-xs text-[#8C827A] mt-1">
                    PDF, Markdown (.md), or Plain Text (.txt)
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="bg-[#FDF2F0] border border-[#F8C8C2] rounded-xl p-3 text-xs text-[#B33A2B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!selectedFile || isProcessing}
                className="px-5 py-2.5 rounded-xl bg-[#1E3A2F] text-white hover:bg-[#2A4E40] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Extract & Save to Library
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#6B6560] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Paste Notes */}
      {activeTab === 'paste' && (
        <div className="bg-white rounded-2xl border border-[#EBE5DF] p-6 shadow-xs">
          <h2 className="font-serif text-lg font-semibold text-[#1C1917] mb-1">
            Paste Study Notes Directly
          </h2>
          <p className="text-xs text-[#6B6560] mb-5">
            Quickly paste lecture notes, summaries, or formulas without needing a local file.
          </p>

          <form onSubmit={handlePasteSubmit} className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-medium text-[#4A453E] mb-1">
                Note Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Photosynthesis & Calvin Cycle"
                className="w-full bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg px-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A453E] mb-1">
                Content (Markdown supported) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={10}
                required
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste your notes, definitions, or study guide text here..."
                className="w-full bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg p-3 text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] font-mono leading-relaxed"
              />
            </div>

            {uploadError && (
              <div className="bg-[#FDF2F0] border border-[#F8C8C2] rounded-xl p-3 text-xs text-[#B33A2B] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!pastedTitle.trim() || !pastedContent.trim() || isProcessing}
                className="px-5 py-2.5 rounded-xl bg-[#1E3A2F] text-white hover:bg-[#2A4E40] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Note to Library
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#6B6560] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Documents Grid / List */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* Search & Subject filter bar */}
          <div className="bg-white rounded-xl border border-[#EBE5DF] p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes and summaries..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#6B6560]">Filter:</span>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="bg-[#FAF7F2] border border-[#DCD5CE] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Empty state */}
          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EBE5DF] p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] text-[#8C827A] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-1">
                {searchQuery ? 'No matching documents' : 'Your Library is Ready'}
              </h3>
              <p className="text-xs text-[#6B6560] mb-5">
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Upload your first study document or paste notes to enable grounded AI tutoring and quiz generation.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-[#1E3A2F] text-white rounded-xl text-xs font-semibold hover:bg-[#2A4E40] transition-colors inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload First Document
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const sub = subjects.find((s) => s.id === doc.subjectId);
                const top = topics.find((t) => t.id === doc.topicId);
                const isPdf = doc.fileType?.includes('pdf') || doc.title.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-[#EBE5DF] p-5 shadow-xs hover:border-[#D0C7BD] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge row */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            isPdf
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          }`}
                        >
                          {isPdf ? 'PDF Document' : 'Text / Notes'}
                        </span>
                        <span className="text-[11px] text-[#8C827A]">
                          {doc.wordCount ? `${doc.wordCount} words` : 'Extracted'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setActiveReadingDoc(doc)}
                        className="font-serif font-bold text-base text-[#1C1917] hover:text-[#1E3A2F] cursor-pointer line-clamp-2 mb-1.5 transition-colors"
                      >
                        {doc.title}
                      </h3>

                      {/* Subject / Topic Tag */}
                      {(sub || top) && (
                        <div className="flex items-center gap-1 text-[11px] text-[#6B6560] mb-3">
                          {sub && <span className="font-medium text-[#1E3A2F]">{sub.name}</span>}
                          {sub && top && <span>•</span>}
                          {top && <span className="text-[#8C827A]">{top.title}</span>}
                        </div>
                      )}

                      {/* Summary or Text Preview */}
                      <p className="text-xs text-[#6B6560] line-clamp-3 leading-relaxed mb-4">
                        {doc.summary || doc.textContent.slice(0, 180) + '...'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#F2EDE8] flex items-center justify-between">
                      <button
                        onClick={() => setActiveReadingDoc(doc)}
                        className="text-xs font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read & Search
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenStudyBuddyWithDoc(doc.id)}
                          className="p-1.5 rounded-lg text-[#1E3A2F] bg-[#FAF7F2] hover:bg-[#E9F0EC] transition-colors"
                          title="Ask AI Study Buddy using this document"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenQuestionGeneratorWithDoc(doc.id, doc.subjectId, doc.topicId)}
                          className="p-1.5 rounded-lg text-[#C85A32] bg-[#FAF0EA] hover:bg-[#F5E2D6] transition-colors"
                          title="Generate Practice Quiz from this document"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmDoc(doc)}
                          className="p-1.5 rounded-lg text-[#8C827A] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reader & Study Modal */}
      {activeReadingDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#FAF7F2] border-b border-[#EBE5DF] p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1E3A2F] bg-[#E9F0EC] px-2 py-0.5 rounded">
                  Document Reader
                </span>
                <h2 className="font-serif text-lg font-bold text-[#1C1917] mt-0.5">
                  {activeReadingDoc.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenStudyBuddyWithDoc(activeReadingDoc.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#1E3A2F] text-white hover:bg-[#2A4E40] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Study Buddy
                </button>
                <button
                  onClick={() =>
                    onOpenQuestionGeneratorWithDoc(
                      activeReadingDoc.id,
                      activeReadingDoc.subjectId,
                      activeReadingDoc.topicId
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#FAF0EA] text-[#C85A32] hover:bg-[#F5E2D6] text-xs font-semibold flex items-center gap-1.5 border border-[#F0D5C7] transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Generate Quiz
                </button>
                <button
                  onClick={() => setActiveReadingDoc(null)}
                  className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#EBE5DF]/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Document Search & Summary Trigger */}
            <div className="bg-white border-b border-[#EBE5DF] px-4 py-2 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-[#8C827A] absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={readerSearchTerm}
                  onChange={(e) => setReaderSearchTerm(e.target.value)}
                  placeholder="Find in document..."
                  className="w-full pl-8 pr-2.5 py-1 bg-[#FAF7F2] border border-[#DCD5CE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                />
              </div>

              <div className="flex items-center gap-2">
                {!activeReadingDoc.summary && (
                  <button
                    onClick={() => handleGenerateSummary(activeReadingDoc)}
                    disabled={isSummarizing}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-[#1E3A2F] bg-[#E9F0EC] hover:bg-[#D4E4DC] transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSummarizing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate AI Summary & Key Points
                      </>
                    )}
                  </button>
                )}
                <span className="text-xs text-[#8C827A]">
                  {activeReadingDoc.wordCount || 0} words
                </span>
              </div>
            </div>

            {/* Document Content & Summary Split View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFAF7]">
              {/* Summary Box if available */}
              {activeReadingDoc.summary && (
                <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A2F] mb-2">
                    <Sparkles className="w-4 h-4 text-[#C85A32]" />
                    <span>Executive Summary & Key Takeaways</span>
                  </div>
                  <p className="text-xs text-[#4A453E] leading-relaxed whitespace-pre-line mb-3">
                    {activeReadingDoc.summary}
                  </p>
                  {activeReadingDoc.keyPoints && activeReadingDoc.keyPoints.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#E8DFC8]/60">
                      <p className="text-[11px] font-semibold text-[#1C1917]">Key Concepts:</p>
                      <ul className="list-disc list-inside text-xs text-[#4A453E] space-y-0.5">
                        {activeReadingDoc.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              <div className="prose prose-sm max-w-none text-[#1C1917] leading-relaxed font-serif text-sm">
                <div className="whitespace-pre-wrap select-text">
                  {renderHighlightedContent(activeReadingDoc.textContent, readerSearchTerm)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] p-6 max-w-md w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-2">
              Delete Document?
            </h3>
            <p className="text-xs text-[#6B6560] leading-relaxed mb-5">
              Are you sure you want to delete &ldquo;<strong>{deleteConfirmDoc.title}</strong>&rdquo;?
              This will remove the document from your Study Library. (Existing flashcards derived from it will not be affected.)
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 text-xs font-medium text-[#6B6560] hover:bg-[#FAF7F2] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirmDoc.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

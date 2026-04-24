import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Calendar, Clock, HelpCircle, Trash2, Edit2, ChevronRight, ArrowLeft, CheckCircle2, X, Save, PlusCircle, AlertTriangle, Upload, Download, FileSpreadsheet, CheckCheck, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../utils/api';
import { showConfirm, showError, showSuccess } from '../../utils/dialog';

interface Question { question: string; options: string[]; correctAnswer: number; }
interface QuizRecord {
  _id: string; title: string; course: { _id: string; title: string } | string;
  questions: Question[]; durationMinutes: number; startTime: string; endTime: string; createdAt: string;
}

export default function QuizScheduler() {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', course: '', durationMinutes: 30, startTime: '', endTime: '' });

  // Import state
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError('');
      const [tData, cData] = await Promise.all([
        apiFetch('/tests/manage').catch(() => ({ tests: [] })),
        apiFetch('/courses/manage').catch(() => ({ courses: [] })),
      ]);
      setQuizzes(tData.tests || []);
      setCourses(cData.courses || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load quizzes');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadQuizzes(); }, []);

  const getCourseName = (q: QuizRecord) => typeof q.course === 'object' && q.course ? q.course.title : '—';
  const getStatus = (q: QuizRecord) => {
    const now = new Date();
    if (q.startTime && now < new Date(q.startTime)) return 'Scheduled';
    if (q.endTime && now > new Date(q.endTime)) return 'Ended';
    return 'Live';
  };

  const handleEditQuiz = (quiz: QuizRecord) => {
    setSelectedQuiz(quiz);
    setQuestions([...quiz.questions]);
    setEditTitle(quiz.title);
    setEditDuration(quiz.durationMinutes);
    setEditStart(quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
    setEditEnd(quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');
    setView('editor');
  };

  const createQuiz = async () => {
    try {
      const data = await apiFetch('/tests', {
        method: 'POST',
        body: JSON.stringify({ ...form, questions: [{ question: 'Sample question?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }] }),
      });
      setIsAddModalOpen(false);
      await loadQuizzes();
      // Open editor for the new quiz
      if (data.test) handleEditQuiz(data.test);
    } catch (err: any) {
      await showError('Failed to create quiz', err.message || 'Unable to create quiz.');
    }
  };

  const saveQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      await apiFetch(`/tests/${selectedQuiz._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, durationMinutes: editDuration, startTime: editStart, endTime: editEnd, questions }),
      });
      await showSuccess('Quiz saved!', 'Your quiz changes have been updated.');
      await loadQuizzes();
      setView('list');
    } catch (err: any) {
      await showError('Failed to save quiz', err.message || 'Unable to save quiz.');
    }
  };

  const deleteQuiz = async (id: string) => {
    const shouldDelete = await showConfirm({
      title: 'Delete quiz?',
      text: 'Delete this quiz?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!shouldDelete) return;
    try {
      await apiFetch(`/tests/${id}`, { method: 'DELETE' });
      await loadQuizzes();
    } catch (err: any) {
      await showError('Failed to delete quiz', err.message || 'Unable to delete quiz.');
    }
  };

  const addQuestion = () => setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(prev => prev.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q));
  };

  const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // ── Import helpers ────────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer (1-4)'],
      ['What is 2 + 2?', '3', '4', '5', '6', '2'],
      ['Which planet is closest to the Sun?', 'Earth', 'Mars', 'Mercury', 'Venus', '3'],
    ]);
    // Column widths
    ws['!cols'] = [{ wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'quiz_template.xlsx');
  };

  const parseImportFile = (file: File) => {
    setImportErrors([]);
    setImportSuccess(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const errors: string[] = [];
        const parsed: Question[] = [];

        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue; // skip empty rows

          const question = String(row[0] ?? '').trim();
          const optA     = String(row[1] ?? '').trim();
          const optB     = String(row[2] ?? '').trim();
          const optC     = String(row[3] ?? '').trim();
          const optD     = String(row[4] ?? '').trim();
          const correct  = Number(row[5]);

          if (!question)         { errors.push(`Row ${i + 1}: Question text is empty.`); continue; }
          if (!optA || !optB)    { errors.push(`Row ${i + 1}: At least Option A and B are required.`); continue; }
          if (isNaN(correct) || correct < 1 || correct > 4) {
            errors.push(`Row ${i + 1}: Correct Answer must be 1–4.`); continue;
          }

          const options = [optA, optB, optC || '', optD || ''];
          // Remove empty trailing options but keep at least 2
          const trimmed = options.filter((o, idx) => idx < 2 || o !== '');
          if (trimmed.length < 2) { errors.push(`Row ${i + 1}: Need at least 2 options.`); continue; }

          // Pad to 4 options
          while (trimmed.length < 4) trimmed.push('');
          const correctIndex = Math.min(correct - 1, trimmed.filter(o => o !== '').length - 1);

          parsed.push({ question, options: trimmed, correctAnswer: correctIndex });
        }

        if (parsed.length === 0 && errors.length === 0) {
          errors.push('No valid rows found. Make sure the file matches the template format.');
        }

        setImportErrors(errors);
        setImportSuccess(parsed.length);
        if (parsed.length > 0) {
          setQuestions(prev => [...prev.filter(q => q.question !== ''), ...parsed]);
        }
      } catch {
        setImportErrors(['Failed to parse file. Please use the provided template.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseImportFile(file);
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={loadQuizzes} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Retry</button>
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quiz Scheduler</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Create and schedule assessments for your courses.</p>
              </div>
              <button onClick={() => { setForm({ title: '', course: courses[0]?._id || '', durationMinutes: 20, startTime: '', endTime: '' }); setIsAddModalOpen(true); }}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create New Quiz
              </button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search quizzes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
              </div>
            </div>

            {/* Quiz Grid */}
            {loading ? (
              <div className="text-center py-20 text-slate-400 font-medium">Loading quizzes...</div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-medium">No quizzes found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredQuizzes.map((quiz) => {
                  const status = getStatus(quiz);
                  return (
                    <div key={quiz._id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'Live' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : status === 'Scheduled' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20' : 'bg-slate-50 text-slate-500'
                          }`}>{status}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditQuiz(quiz)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-brand-600 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteQuiz(quiz._id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{quiz.title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{getCourseName(quiz)}</p>
                        <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Questions</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{quiz.questions.length}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{quiz.durationMinutes} min</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-brand-600" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(quiz.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('list')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quiz Editor</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Editing: {editTitle}</p>
                </div>
              </div>
              <button onClick={saveQuiz} className="px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Questions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Questions ({questions.length})</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowImportPanel(p => !p)}
                      className={`text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                        showImportPanel ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                      }`}>
                      <Upload className="w-4 h-4" /> Import
                    </button>
                    <button onClick={addQuestion} className="text-sm font-bold text-brand-600 hover:underline flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Add Question
                    </button>
                  </div>
                </div>

                {/* ── Import Panel ── */}
                <AnimatePresence>
                  {showImportPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                      className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-brand-200 dark:border-brand-800 p-8 space-y-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-brand-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">Bulk Import from Excel / CSV</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Upload a spreadsheet to add multiple questions at once</p>
                          </div>
                        </div>
                        <button onClick={downloadTemplate}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 transition-all">
                          <Download className="w-4 h-4" /> Download Template
                        </button>
                      </div>

                      {/* Drop Zone */}
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                          isDragging
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 scale-[1.01]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={e => { if (e.target.files?.[0]) parseImportFile(e.target.files[0]); e.target.value = ''; }}
                        />
                        <Upload className={`w-8 h-8 transition-colors ${ isDragging ? 'text-brand-600' : 'text-slate-300 dark:text-slate-600' }`} />
                        <div className="text-center">
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            {isDragging ? 'Drop to import!' : 'Drag & drop or click to upload'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">.xlsx, .xls or .csv • Columns: Question, Option A–D, Correct Answer (1-4)</p>
                        </div>
                      </div>

                      {/* Results */}
                      {(importSuccess > 0 || importErrors.length > 0) && (
                        <div className="space-y-3">
                          {importSuccess > 0 && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                              <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                ✅ {importSuccess} question{importSuccess !== 1 ? 's' : ''} imported successfully!
                              </p>
                              <button onClick={() => { setImportSuccess(0); setImportErrors([]); setShowImportPanel(false); }}
                                className="ml-auto text-xs font-bold text-emerald-600 hover:underline">Done</button>
                            </div>
                          )}
                          {importErrors.length > 0 && (
                            <div className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{importErrors.length} row{importErrors.length !== 1 ? 's' : ''} had issues:</p>
                              </div>
                              {importErrors.map((err, i) => (
                                <p key={i} className="text-xs text-rose-500 dark:text-rose-400 pl-6">• {err}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {questions.map((q, qi) => (
                  <div key={qi} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 group">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600 font-bold flex-shrink-0">{qi + 1}</div>
                        <input type="text" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Enter question..."
                          className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20" />
                      </div>
                      <button onClick={() => removeQuestion(qi)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-400 hover:text-rose-600 rounded-xl transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                          oi === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                        }`} onClick={() => updateQuestion(qi, 'correctAnswer', oi)}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            oi === q.correctAnswer ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {oi === q.correctAnswer && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <input type="text" value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`}
                            className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 sticky top-28">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Quiz Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Quiz Title</label>
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Duration (Minutes)</label>
                      <input type="number" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" min={1} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Start Time</label>
                      <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">End Time</label>
                      <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Quiz</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quiz Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Midterm Assessment"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Course</label>
                    <select value={form.course} onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold appearance-none">
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration (min)</label>
                    <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
                    <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">End Time</label>
                    <input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-bold" />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={createQuiz} className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20">Create & Add Questions</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

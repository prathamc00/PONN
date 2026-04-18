import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, RefreshCw, Award, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { cn } from '../../utils';

interface QuizAttempt {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  quiz: {
    _id: string;
    title: string;
    course: { title: string };
    totalQuestions: number;
  };
  score: number;
  totalMarks: number;
  startedAt: string;
  completedAt?: string;
}

export default function QuizResults() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/quiz-attempts');
      setAttempts(data.attempts || []);
      setFilteredAttempts(data.attempts || []);
    } catch (err) {
      console.error('Failed to fetch quiz attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowerTheme = searchTerm.toLowerCase();
      const filtered = attempts.filter(
        (a) =>
          a.student?.name?.toLowerCase().includes(lowerTheme) ||
          a.student?.email?.toLowerCase().includes(lowerTheme) ||
          a.quiz?.title?.toLowerCase().includes(lowerTheme) ||
          a.quiz?.course?.title?.toLowerCase().includes(lowerTheme)
      );
      setFilteredAttempts(filtered);
    } else {
      setFilteredAttempts(attempts);
    }
    setCurrentPage(1);
  }, [searchTerm, attempts]);

  const totalPages = Math.ceil(filteredAttempts.length / itemsPerPage);
  const currentItems = filteredAttempts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToCSV = () => {
    if (filteredAttempts.length === 0) return;

    const headers = [
      'Student Name',
      'Email',
      'Course',
      'Quiz Title',
      'Score',
      'Total Marks',
      'Percentage',
      'Status',
      'Started At',
      'Completed At'
    ];

    const csvData = filteredAttempts.map(attempt => {
      const percentage = attempt.totalMarks > 0 
        ? ((attempt.score / attempt.totalMarks) * 100).toFixed(2) + '%' 
        : '0%';
      const status = attempt.completedAt ? 'Completed' : 'Ongoing';
      
      return [
        `"${attempt.student?.name || 'Unknown'}"`,
        `"${attempt.student?.email || 'N/A'}"`,
        `"${attempt.quiz?.course?.title || 'Unknown'}"`,
        `"${attempt.quiz?.title || 'Unknown'}"`,
        attempt.score,
        attempt.totalMarks,
        `"${percentage}"`,
        `"${status}"`,
        `"${new Date(attempt.startedAt).toLocaleString()}"`,
        attempt.completedAt ? `"${new Date(attempt.completedAt).toLocaleString()}"` : '"-"'
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quiz_results_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Award className="w-6 h-6" />
            </div>
            Quiz Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Monitor student quiz attempts and export reports
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAttempts}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredAttempts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md shadow-brand-500/20"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, email, quiz or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 rounded-xl transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Records: <span className="text-brand-600">{filteredAttempts.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quiz & Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-flex flex-col items-center">
                        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mb-4" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-flex flex-col items-center text-slate-400 dark:text-slate-500">
                        <Award className="w-12 h-12 mb-4 opacity-20" />
                        <span className="font-medium text-lg text-slate-500 dark:text-slate-400">No records found</span>
                        <span className="text-sm mt-1">Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  currentItems.map((attempt) => {
                    const percentage = attempt.totalMarks > 0 
                      ? Math.round((attempt.score / attempt.totalMarks) * 100) 
                      : 0;
                    
                    return (
                      <motion.tr
                        key={attempt._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {attempt.student?.name || 'Unknown User'}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {attempt.student?.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col max-w-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                              {attempt.quiz?.title || 'Unknown Quiz'}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {attempt.quiz?.course?.title || 'Unknown Course'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {attempt.score} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {attempt.totalMarks}</span>
                              </span>
                            </div>
                            <div className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-bold",
                              percentage >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                              percentage >= 50 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                              'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                            )}>
                              {percentage}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {attempt.completedAt ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold">
                              <Clock className="w-4 h-4" />
                              Ongoing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          <span className="block text-xs text-slate-400 dark:text-slate-500">
                            {new Date(attempt.completedAt || attempt.startedAt).toLocaleTimeString()}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium px-4">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredAttempts.length)}</span> of{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{filteredAttempts.length}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

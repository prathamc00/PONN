import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  type: 'file_upload' | 'case_study' | 'code';
  dueDate?: string;
  maxMarks?: number;
  course: { title: string } | string;
}

export default function AssignmentUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState<string>(location.state?.assignmentId || '');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await apiFetch('/assignments');
        setAssignments(data.assignments || []);
        if (data.assignments?.length > 0 && !selectedId) {
          setSelectedId(data.assignments[0]._id);
        }
      } catch (err: any) {
        toast.error('Failed to load assignments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const selectedAssignment = assignments.find((a) => a._id === selectedId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !selectedAssignment) return;
    if (selectedAssignment.type === 'file_upload' && !file) return;
    if (selectedAssignment.type === 'case_study' && !textContent.trim()) return;
    if (selectedAssignment.type === 'code' && !codeContent.trim()) return;

    setIsUploading(true);
    try {
      if (selectedAssignment.type === 'file_upload') {
        const formData = new FormData();
        formData.append('file', file as File);
        await apiFetch(`/assignments/${selectedId}/submit`, {
          method: 'POST',
          body: formData
        });
      } else if (selectedAssignment.type === 'case_study') {
        await apiFetch(`/assignments/${selectedId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ textContent })
        });
      } else {
        await apiFetch(`/assignments/${selectedId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ codeContent })
        });
      }

      toast.success('Assignment submitted successfully!');
      navigate('/assignments');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit assignment');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/assignments')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm tracking-tight">Back to Assignments</span>
        </button>
      </div>

      <div className="space-y-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-2"
        >
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-purple">Submission Portal</span>
        </motion.div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Upload <span className="gradient-text">Assignment</span></h1>
        <p className="text-slate-400 font-medium leading-relaxed">Submit your work for academic review and grading.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 md:p-14 rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-purple to-brand-blue" />
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Select Assignment</label>
            <div className="relative group">
              <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || assignments.length === 0}
                className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold outline-none appearance-none focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <option>Loading assignments...</option>
                ) : assignments.length === 0 ? (
                  <option>No assignments available</option>
                ) : (
                  assignments.map((a) => (
                    <option key={a._id} value={a._id} className="bg-slate-900">
                      {a.title} ({typeof a.course === 'object' ? a.course.title : 'No Course'})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-brand-purple transition-colors">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {selectedAssignment && (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assignment Question</p>
              <h3 className="text-lg font-bold text-white tracking-tight">{selectedAssignment.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedAssignment.description?.trim() || 'No question text provided by instructor.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold bg-brand-purple/15 text-brand-purple border border-brand-purple/30">
                  {selectedAssignment.type.replace('_', ' ')}
                </span>
                {selectedAssignment.maxMarks != null && (
                  <span className="text-xs text-slate-400 font-medium">Max marks: {selectedAssignment.maxMarks}</span>
                )}
                {selectedAssignment.dueDate && (
                  <span className="text-xs text-slate-400 font-medium">
                    Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {selectedAssignment?.type === 'file_upload' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Upload Source File</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                className={`relative border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-500 group ${
                  isDragging 
                    ? 'border-brand-purple bg-brand-purple/10 scale-[0.98]' 
                    : 'border-white/10 hover:border-brand-purple/50 hover:bg-white/5'
                }`}
              >
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 ${
                    isDragging ? 'bg-brand-purple text-white rotate-12' : 'bg-white/5 text-slate-500 group-hover:text-brand-purple group-hover:scale-110'
                  }`}>
                    <CloudUpload className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight mb-2">
                    {file ? file.name : 'Drop your file here'}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse from your device'}
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <span>PDF</span>
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>DOCX</span>
                    <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>ZIP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedAssignment?.type === 'case_study' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Your Answer</label>
              <textarea
                rows={10}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write your case study answer here..."
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-purple/40 text-white font-medium resize-none"
              />
            </div>
          )}

          {selectedAssignment?.type === 'code' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Your Code</label>
              <textarea
                rows={12}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste your code solution here..."
                className="w-full px-5 py-4 bg-[#0b1020] border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-blue/40 text-slate-100 font-mono text-sm resize-none"
              />
            </div>
          )}

          <AnimatePresence>
            {selectedAssignment?.type === 'file_upload' && file && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                className="flex items-center justify-between p-6 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-purple/20 rounded-xl flex items-center justify-center text-brand-purple">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">{file.name}</p>
                    <p className="text-xs text-brand-purple font-bold uppercase tracking-widest mt-0.5">Ready for submission</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFile(null)} 
                  className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="button"
              onClick={() => navigate('/assignments')}
              className="flex-1 py-5 bg-white/5 text-slate-400 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={
                !selectedId ||
                isUploading ||
                !selectedAssignment ||
                (selectedAssignment.type === 'file_upload' && !file) ||
                (selectedAssignment.type === 'case_study' && !textContent.trim()) ||
                (selectedAssignment.type === 'code' && !codeContent.trim())
              }
              className="flex-[2] py-5 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-lg glow-shadow disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {isUploading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Submit Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="flex items-center gap-3 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
          Ensure your file is under 10MB and follows the naming convention: <span className="text-amber-400 font-bold">RollNo_AssignmentName.pdf</span>
        </p>
      </div>
    </div>
  );
}

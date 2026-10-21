import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Upload, FileText, Code, CheckCircle2, ArrowLeft, AlertCircle
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import { showSuccess, showError } from '../utils/dialog.js';

export default function AssignmentUploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedId = searchParams.get('assignmentId') || '';

  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(preselectedId);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [activeTab, setActiveTab] = useState('file');

  useEffect(() => {
    apiFetch('/assignments')
      .then(data => {
        const list = data.assignments || [];
        setAssignments(list);
        if (!selectedId && list.length > 0) {
          setSelectedId(list[0]._id || list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const selectedAsg = assignments.find(a => String(a._id || a.id) === String(selectedId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return showError('Error', 'Please select an assignment to submit.');

    setSubmitting(true);
    try {
      if (activeTab === 'file') {
        if (!file) throw new Error('Please select a file to upload.');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('submissionType', 'file_upload');

        await apiFetch(`/assignments/${selectedId}/submit`, {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!textContent.trim()) throw new Error('Please enter your written submission.');
        await apiFetch(`/assignments/${selectedId}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            submissionType: activeTab === 'code' ? 'code' : 'case_study',
            content: textContent,
          }),
        });
      }

      await showSuccess('Work Submitted', 'Your assignment has been received for grading.');
      navigate('/assignments');
    } catch (err) {
      showError('Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:px-8 lg:px-10 py-6 md:py-8 w-full">
      <Link to="/assignments" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-outline hover:text-primary transition-colors">
        <ArrowLeft size={14} /> Back to Assignments
      </Link>

      <div className="border-b border-outline-variant pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-outline">Coursework Submission Desk</span>
        <h1 className="text-3xl md:text-4xl font-serif text-primary mt-1">Upload Assignment</h1>
        <p className="text-on-surface-variant text-sm mt-1">Deliver project files, code exercises, or case study responses.</p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Assignment Selector */}
        <div>
          <label className="block font-mono uppercase text-xs text-outline mb-2">Target Assignment</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface font-medium"
          >
            {assignments.map(asg => (
              <option key={asg._id || asg.id} value={asg._id || asg.id}>
                {asg.title} (Max: {asg.maxScore || 100} pts)
              </option>
            ))}
          </select>
        </div>

        {selectedAsg && (
          <div className="p-4 bg-surface rounded-xl border border-outline-variant text-xs space-y-1">
            <span className="font-mono uppercase text-secondary font-semibold">Instructions:</span>
            <p className="text-on-surface-variant leading-relaxed">
              {selectedAsg.description || 'Follow standard project guidelines.'}
            </p>
          </div>
        )}

        {/* Format Selector Tabs */}
        <div className="flex border-b border-outline-variant gap-6 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-3 font-semibold uppercase flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <Upload size={14} /> File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-3 font-semibold uppercase flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <FileText size={14} /> Written Text / Case Study
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-3 font-semibold uppercase flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'code' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <Code size={14} /> Source Code
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center bg-surface hover:bg-surface-container transition-colors cursor-pointer relative">
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload size={36} className="text-primary mx-auto mb-3" />
              <h3 className="font-serif font-bold text-base text-primary">
                {file ? file.name : 'Select or drag your submission file'}
              </h3>
              <p className="text-xs text-outline mt-1 font-mono">
                Supported formats: PDF, ZIP, TAR, DOCX, TXT (Max 25MB)
              </p>
            </div>
          ) : (
            <div>
              <label className="block font-mono uppercase text-xs text-outline mb-2">
                {activeTab === 'code' ? 'Paste Source Code' : 'Enter Case Study Text'}
              </label>
              <textarea
                rows={10}
                required
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={activeTab === 'code' ? '// Paste React component or Python script here...' : 'Write your essay response...'}
                className="w-full p-4 bg-surface border border-outline-variant rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <Link to="/assignments" className="px-4 py-2 text-xs font-medium text-outline hover:text-on-surface">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded text-xs font-medium cursor-pointer shadow-sm"
            >
              {submitting ? 'Transmitting Work...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

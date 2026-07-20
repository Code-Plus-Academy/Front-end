'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function UploadForm({ action, initialNote }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState(initialNote?.title || '');
  const [description, setDescription] = useState(initialNote?.description || '');
  const [type, setType] = useState(initialNote?.type || 'notes');
  const [copyrightConsent, setCopyrightConsent] = useState(!!initialNote);
  
  const [pathType, setPathType] = useState(
    initialNote?.scope === 'both' 
      ? 'both' 
      : (initialNote?.scope === 'college' 
          ? 'college' 
          : (initialNote?.scope === 'global' ? 'department' : 'college'))
  );
  const [collegeId, setCollegeId] = useState(initialNote?.college_id || '');
  const [courseId, setCourseId] = useState(initialNote?.course_id || '');
  const [semester, setSemester] = useState(initialNote?.semester ? String(initialNote.semester) : '');
  const [subjectId, setSubjectId] = useState(initialNote?.subject_id || '');
  const [fieldId, setFieldId] = useState(initialNote?.field_id || '');
  const [topicId, setTopicId] = useState(initialNote?.topic_id || '');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');

  // Dropdown lists
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [fields, setFields] = useState([]);
  const [topics, setTopics] = useState([]);

  // File Upload states
  const [uploadMethod, setUploadMethod] = useState(initialNote?.file_url ? 'link' : 'link'); // 'link' or 'file'
  const [fileUrl, setFileUrl] = useState(initialNote?.file_url || '');
  const [fileType, setFileType] = useState(initialNote?.file_type || 'link');

  // Load initial dropdown data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [colRes, fieldRes] = await Promise.all([
          fetch('/api/notes/autosuggest/college').then(r => r.json()),
          fetch('/api/notes/autosuggest/field').then(r => r.json()).catch(() => ({ fields: [] })),
        ]);
        
        let initialColleges = colRes.colleges || [];
        if (initialNote?.college_id && !initialColleges.some(c => c.id === initialNote.college_id)) {
          initialColleges = [{ id: initialNote.college_id, name: initialNote.college_name || 'Selected College' }, ...initialColleges];
        }
        setColleges(initialColleges);

        let initialFields = fieldRes.fields || [];
        if (initialNote?.field_id && !initialFields.some(f => f.id === initialNote.field_id)) {
          initialFields = [{ id: initialNote.field_id, name: initialNote.field_name || 'Selected Field' }, ...initialFields];
        }
        setFields(initialFields);
      } catch (e) {
        console.error('Error fetching autosuggest lists:', e);
      }
    };
    fetchInitialData();
  }, [initialNote]);

  // Fetch courses when college changes
  useEffect(() => {
    if (!collegeId) return;
    fetch(`/api/notes/autosuggest/course?collegeId=${collegeId}`)
      .then(r => r.json())
      .then(data => {
        let initialCourses = data.courses || [];
        if (initialNote?.course_id && !initialCourses.some(c => c.id === initialNote.course_id)) {
          initialCourses = [{ id: initialNote.course_id, name: initialNote.course_name || 'Selected Course' }, ...initialCourses];
        }
        setCourses(initialCourses);
      })
      .catch(() => {});
  }, [collegeId, initialNote]);

  // Fetch subjects when course or semester changes
  useEffect(() => {
    if (!courseId || !semester) return;
    fetch(`/api/notes/autosuggest/subject?courseId=${courseId}&semester=${semester}`)
      .then(r => r.json())
      .then(data => {
        let initialSubjects = data.subjects || [];
        if (initialNote?.subject_id && !initialSubjects.some(s => s.id === initialNote.subject_id)) {
          initialSubjects = [{ id: initialNote.subject_id, name: initialNote.subject_name || 'Selected Subject' }, ...initialSubjects];
        }
        setSubjects(initialSubjects);
      })
      .catch(() => {});
  }, [courseId, semester, initialNote]);

  // Fetch topics when field changes
  useEffect(() => {
    if (!fieldId) return;
    fetch(`/api/notes/autosuggest/topic?fieldId=${fieldId}`)
      .then(r => r.json())
      .then(data => {
        let initialTopics = data.topics || [];
        if (initialNote?.topic_id && !initialTopics.some(t => t.id === initialNote.topic_id)) {
          initialTopics = [{ id: initialNote.topic_id, name: initialNote.topic_name || 'Selected Topic' }, ...initialTopics];
        }
        setTopics(initialTopics);
      })
      .catch(() => {});
  }, [fieldId, initialNote]);

  const handleNext = () => {
    if (step === 1 && (!title || title.trim().length < 3)) {
      toast.error('Title must be at least 3 characters.');
      return;
    }
    if (step === 2) {
      if (pathType === 'college') {
        if (!collegeId || !courseId || !semester || !subjectId) {
          toast.error('Please fill in all college classification fields.');
          return;
        }
        if (subjectId === 'other' && (!customSubjectName || customSubjectName.trim().length < 3)) {
          toast.error('Please specify a valid custom subject name (min 3 characters).');
          return;
        }
      }
      if (pathType === 'department') {
        if (!fieldId || !topicId) {
          toast.error('Please fill in all department classification fields.');
          return;
        }
        if (topicId === 'other' && (!customTopicName || customTopicName.trim().length < 3)) {
          toast.error('Please specify a valid custom topic name (min 3 characters).');
          return;
        }
      }
    }
    if (step === 3 && !fileUrl) {
      toast.error('Please provide a valid file link or upload a file.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      // Mocking file upload via existing API endpoint /upload/media
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: fd,
      });
        if (res.ok) {
          const data = await res.json();
          setFileUrl(data.url || '');
          setFileType(file.name.split('.').pop() || 'pdf');
          toast.success('File uploaded successfully!');
      } else {
        toast.error('Failed to upload file.');
      }
    } catch (err) {
      toast.error('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!copyrightConsent) {
      toast.error('You must declare copyright compliance before submitting.');
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      toast.error('Please enter a valid title (min 3 characters).');
      return;
    }

    if (!fileUrl) {
      toast.error('Please upload a file or provide a valid link before submitting.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('copyright_consent', 'true');
      formData.append('description', description);
      formData.append('type', type);
      formData.append('pathType', pathType);
      formData.append('fileUrl', fileUrl);
      formData.append('fileType', fileType);

      if (pathType !== 'department') {
        formData.append('collegeId', collegeId);
        formData.append('courseId', courseId);
        formData.append('semester', semester);
        formData.append('subjectId', subjectId);
        if (subjectId === 'other') {
          formData.append('customSubjectName', customSubjectName.trim());
        }
        const selectedCol = colleges.find(c => c.id === collegeId);
        if (selectedCol) formData.append('collegeSlug', selectedCol.slug);
      }
      if (pathType !== 'college') {
        formData.append('fieldId', fieldId);
        formData.append('topicId', topicId);
        if (topicId === 'other') {
          formData.append('customTopicName', customTopicName.trim());
        }
      }

      const result = await action(formData);

      // Inspect returned object from Server Action for errors
      if (!result || typeof result !== 'object') {
        const errMessage = 'Server action returned an invalid or empty response.';
        toast.error(errMessage);
        return;
      }

      if (result.success === false || result.error) {
        const errMessage = result.error || 'Submission failed. Please check your inputs.';
        toast.error(errMessage);
        return;
      }

      // Only execute redirection when success: true is explicitly returned
      if (result.success) {
        toast.success(initialNote ? 'Resource updated successfully!' : 'Resource submitted successfully!');
        const targetSlug = result.data?.slug || result.slug;
        if (targetSlug) {
          router.push(`/notes/resource/${targetSlug}`);
        } else {
          router.push('/notes');
        }
      }
    } catch (err) {
      console.error('[UploadForm Submit Error]:', err);
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      // Guarantee loading state cleanup
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .wizard-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
        }
        .wizard-steps::before {
          content: '';
          position: absolute;
          top: 14px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--border);
          z-index: 1;
        }
        .wizard-step {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--s2);
          border: 2px solid var(--border);
          color: var(--sub);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          position: relative;
          z-index: 2;
        }
        .wizard-step.active {
          background: var(--green-dim);
          border-color: var(--green);
          color: var(--green);
        }
        .wizard-step.completed {
          background: var(--green);
          border-color: var(--green);
          color: #000;
        }
        .upload-input-group {
          margin-bottom: 20px;
        }
        .upload-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }
        .toggle-tab-bar {
          display: flex;
          background: var(--s2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 20px;
        }
        .toggle-tab {
          flex: 1;
          padding: 8px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--sub);
          cursor: pointer;
          border-radius: 6px;
        }
        .toggle-tab.active {
          background: var(--surface);
          color: var(--green);
          box-shadow: var(--shadow-card);
        }
      `}</style>

      {/* Step Tracker */}
      <div className="wizard-steps">
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s} 
            className={`wizard-step${step === s ? ' active' : (step > s ? ' completed' : '')}`}
          >
            {step > s ? '✓' : s}
          </div>
        ))}
      </div>

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div>
          <div className="upload-input-group">
            <label className="upload-label">Resource Title <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="text" 
              placeholder="e.g. DBMS Semester 2 Previous Year Papers 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="upload-input-group">
            <label className="upload-label">Description / Topics Covered</label>
            <textarea 
              placeholder="Describe what is inside this note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%' }}
            />
          </div>

          <div className="upload-input-group">
            <label className="upload-label">Resource Type <span style={{ color: 'var(--red)' }}>*</span></label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="notes">Lecture Notes</option>
              <option value="question_paper">Previous Year Paper (PYQ)</option>
              <option value="book">Reference Book</option>
              <option value="assignment">Assignment File</option>
              <option value="cheatsheet">Cheat Sheet</option>
              <option value="lab_manual">Lab Manual</option>
              <option value="roadmap">Roadmap / Syllabus</option>
              <option value="other">Other Reference</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 2: Classification */}
      {step === 2 && (
        <div>
          <div className="upload-input-group">
            <label className="upload-label">Classification Path <span style={{ color: 'var(--red)' }}>*</span></label>
            <div className="toggle-tab-bar">
              <div 
                className={`toggle-tab${pathType === 'college' ? ' active' : ''}`}
                onClick={() => setPathType('college')}
              >
                College Curriculum
              </div>
              <div 
                className={`toggle-tab${pathType === 'department' ? ' active' : ''}`}
                onClick={() => setPathType('department')}
              >
                Department / Topic
              </div>
            </div>
          </div>

          {pathType === 'college' && (
            <>
              <div className="upload-input-group">
                <label className="upload-label">Select College <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
                  <option value="">-- Select College --</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="upload-input-group">
                <label className="upload-label">Select Course <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!collegeId}>
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="upload-input-group">
                <label className="upload-label">Select Semester <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!courseId}>
                  <option value="">-- Select Semester --</option>
                  {[...Array(8)].map((_, i) => <option key={i+1} value={i+1}>Semester {i+1}</option>)}
                </select>
              </div>

              <div className="upload-input-group">
                <label className="upload-label">Select Subject <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!semester}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="other">Other Subject (Specify below)</option>
                </select>
              </div>

              {subjectId === 'other' && (
                <div className="upload-input-group" style={{ marginTop: 12 }}>
                  <label className="upload-label">Specify Custom Subject Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input 
                    type="text"
                    placeholder="e.g. Advanced Quantum Computing & Physics"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    required
                  />
                </div>
              )}
            </>
          )}

          {pathType === 'department' && (
            <>
              <div className="upload-input-group">
                <label className="upload-label">Select Department / Field <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
                  <option value="">-- Select Field --</option>
                  {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="upload-input-group">
                <label className="upload-label">Select Topic <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!fieldId}>
                  <option value="">-- Select Topic --</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  <option value="other">Other Topic / Subject (Specify below)</option>
                </select>
              </div>

              {topicId === 'other' && (
                <div className="upload-input-group" style={{ marginTop: 12 }}>
                  <label className="upload-label">Specify Custom Topic / Subject Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input 
                    type="text"
                    placeholder="e.g. Machine Learning & Neural Networks"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    required
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 3: File Input */}
      {step === 3 && (
        <div>
          <div className="upload-input-group">
            <label className="upload-label">Resource Source <span style={{ color: 'var(--red)' }}>*</span></label>
            <div className="toggle-tab-bar">
              <div 
                className={`toggle-tab${uploadMethod === 'link' ? ' active' : ''}`}
                onClick={() => {
                  setUploadMethod('link');
                  setFileUrl('');
                }}
              >
                Paste Google Drive / YouTube Link
              </div>
              <div 
                className={`toggle-tab${uploadMethod === 'file' ? ' active' : ''}`}
                onClick={() => {
                  setUploadMethod('file');
                  setFileUrl('');
                }}
              >
                Direct File Upload (PDF/Image)
              </div>
            </div>
          </div>

          {uploadMethod === 'link' ? (
            <div className="upload-input-group">
              <label className="upload-label">Host URL Link <span style={{ color: 'var(--red)' }}>*</span></label>
              <input 
                type="url" 
                placeholder="e.g. https://drive.google.com/... or https://github.com/..."
                value={fileUrl ?? ''}
                onChange={(e) => {
                  setFileUrl(e.target.value ?? '');
                  setFileType('link');
                }}
                required
              />
            </div>
          ) : (
            <div className="upload-input-group">
              <label className="upload-label">Select File <span style={{ color: 'var(--red)' }}>*</span></label>
              <input 
                type="file" 
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                required
              />
              {loading && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 8 }}>Uploading file...</p>}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Submit Review */}
      {step === 4 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Review Submission</h3>
          <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--sub)', display: 'block' }}>Title</span>
              <strong style={{ fontSize: 14, color: 'var(--text)' }}>{title}</strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--sub)', display: 'block' }}>Type</span>
              <strong style={{ fontSize: 14, color: 'var(--text)' }}>{type.toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--sub)', display: 'block' }}>Source URL</span>
              <strong style={{ fontSize: 12, color: 'var(--green)', wordBreak: 'break-all' }}>{fileUrl}</strong>
            </div>
          </div>
          
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text)', lineHeight: '1.4' }}>
              <input 
                type="checkbox" 
                checked={copyrightConsent} 
                onChange={(e) => setCopyrightConsent(e.target.checked)} 
                style={{ cursor: 'pointer', marginTop: 3, flexShrink: 0 }}
              />
              <span>
                I declare that this resource does not violate any copyright or intellectual property rights, and I agree to the platform's content upload terms. <span style={{ color: 'var(--red)' }}>*</span>
              </span>
            </label>
          </div>

          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 16 }}>
            {initialNote ? 'By clicking save, your resource updates will be applied immediately.' : 'By clicking submit, your file will be processed and placed in the moderation queue. Thank you for contributing to the community!'}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {step > 1 && (
          <button 
            type="button" 
            onClick={handleBack} 
            className="btn-secondary"
            style={{ flex: 1, padding: 12 }}
          >
            Back
          </button>
        )}
        
        {step < 4 ? (
          <button 
            type="button" 
            onClick={handleNext} 
            className="btn-primary"
            style={{ flex: 1, padding: 12 }}
          >
            Continue
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading}
            className="btn-primary"
            style={{ flex: 1, padding: 12 }}
          >
            {loading ? (initialNote ? 'Saving...' : 'Submitting...') : (initialNote ? 'Save Changes' : 'Submit Resource')}
          </button>
        )}
      </div>
    </>
  );
}

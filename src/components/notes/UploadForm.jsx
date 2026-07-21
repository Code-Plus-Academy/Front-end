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
  const [customCourseName, setCustomCourseName] = useState('');
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(!!initialNote?.file_url);

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
    fetch(`/api/notes/autosuggest/subject?courseId=${courseId}&semester=${semester}&collegeId=${collegeId}`)
      .then(r => r.json())
      .then(data => {
        let initialSubjects = data.subjects || [];
        if (initialNote?.subject_id && !initialSubjects.some(s => s.id === initialNote.subject_id)) {
          initialSubjects = [{ id: initialNote.subject_id, name: initialNote.subject_name || 'Selected Subject' }, ...initialSubjects];
        }
        setSubjects(initialSubjects);
      })
      .catch(() => {});
  }, [courseId, semester, collegeId, initialNote]);

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

  // Similar suggestions helpers for deduplication
  const getCourseSuggestions = () => {
    if (!customCourseName || customCourseName.trim().length < 2) return [];
    const q = customCourseName.toLowerCase().trim();
    return courses.filter(c => c.id !== 'other' && c.name.toLowerCase().includes(q)).slice(0, 4);
  };

  const getSubjectSuggestions = () => {
    if (!customSubjectName || customSubjectName.trim().length < 2) return [];
    const q = customSubjectName.toLowerCase().trim();
    return subjects.filter(s => s.id !== 'other' && s.name.toLowerCase().includes(q)).slice(0, 4);
  };

  const getTopicSuggestions = () => {
    if (!customTopicName || customTopicName.trim().length < 2) return [];
    const q = customTopicName.toLowerCase().trim();
    return topics.filter(t => t.id !== 'other' && t.name.toLowerCase().includes(q)).slice(0, 4);
  };

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
        if (courseId === 'other' && (!customCourseName || customCourseName.trim().length < 3)) {
          toast.error('Please specify a valid custom course name (min 3 characters).');
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

  const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf', 'epub', 'png', 'jpg', 'jpeg', 'webp'];
  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setSelectedFileName(file.name);
    setSelectedFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(10);

    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      const errMsg = `Invalid format (.${ext}). Allowed: Documents (.pdf, .doc, .docx, .ppt, .txt) and Images (.png, .jpg, .webp).`;
      setUploadError(errMsg);
      toast.error(errMsg);
      e.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      const errMsg = `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 20MB limit. Switch to "Paste Google Drive Link" tab for large files.`;
      setUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    setLoading(true);
    setUploadProgress(25);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 250);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('resource_type', IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'raw');

    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: fd,
      });

      clearInterval(progressTimer);

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || data.fileUrl || data.secure_url || data.path || '';
        if (uploadedUrl) {
          setUploadProgress(100);
          setFileUrl(uploadedUrl);
          setFileType(ext || 'pdf');
          setUploadSuccess(true);
          toast.success(`File (${ext.toUpperCase()}) uploaded successfully!`);
        } else {
          setUploadProgress(0);
          const errMsg = 'File uploaded, but server did not return a valid URL. Please try Google Drive link option.';
          setUploadError(errMsg);
          toast.error(errMsg);
        }
      } else {
        setUploadProgress(0);
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || errData.message || 'Server upload failed. Switch to "Paste Google Drive Link" for instant alternative.';
        setUploadError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      console.error('File Upload Exception:', err);
      const errMsg = err.message || 'Network exception during file transfer. Check connection or use Google Drive link.';
      setUploadError(errMsg);
      toast.error(errMsg);
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
        if (courseId === 'other') {
          formData.append('customCourseName', customCourseName.trim());
        }
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
                  <option value="other">Other Course (Specify below)</option>
                </select>
              </div>

              {courseId === 'other' && (
                <div className="upload-input-group" style={{ marginTop: 12 }}>
                  <label className="upload-label">Specify Custom Course Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input 
                    type="text"
                    placeholder="e.g. Bachelor of Engineering (IT)"
                    value={customCourseName}
                    onChange={(e) => setCustomCourseName(e.target.value)}
                    required
                  />

                  {getCourseSuggestions().length > 0 && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(0, 180, 216, 0.08)', border: '1px solid var(--green)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lightbulb</span>
                        <span>Existing Similar Courses Found (Click to select & avoid duplicate):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {getCourseSuggestions().map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCourseId(c.id);
                              setCustomCourseName('');
                              toast.success(`Selected existing course: "${c.name}"`);
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{c.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Use this</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

                  {getSubjectSuggestions().length > 0 && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(0, 180, 216, 0.08)', border: '1px solid var(--green)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lightbulb</span>
                        <span>Existing Similar Subjects Found (Click to select & avoid duplicate):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {getSubjectSuggestions().map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSubjectId(s.id);
                              setCustomSubjectName('');
                              toast.success(`Selected existing subject: "${s.name}"`);
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{s.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Use this</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {getTopicSuggestions().length > 0 && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(0, 180, 216, 0.08)', border: '1px solid var(--green)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lightbulb</span>
                        <span>Existing Similar Topics Found (Click to select & avoid duplicate):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {getTopicSuggestions().map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTopicId(t.id);
                              setCustomTopicName('');
                              toast.success(`Selected existing topic: "${t.name}"`);
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{t.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Use this</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
              <label className="upload-label">
                Attach Document or Image File (.pdf, .doc, .docx, .ppt, .png, .jpg) <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              
              <input 
                id="file-upload-input"
                type="file" 
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,.epub,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                style={{ display: uploadSuccess || loading ? 'none' : 'block' }}
              />

              {/* Progress Bar Component */}
              {loading && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                    <span>Uploading {selectedFileName} ({selectedFileSize})...</span>
                    <span style={{ color: 'var(--green)' }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'var(--s3)', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--green-dim), var(--green))', transition: 'width 0.25s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 6 }}>Please wait while your file is securely transferred to Cloudinary...</p>
                </div>
              )}

              {/* Success Card */}
              {uploadSuccess && fileUrl && !loading && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'rgba(0, 180, 216, 0.08)', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: 'var(--green)' }}>✓</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{selectedFileName || 'Document File Attached'}</div>
                      <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Upload Completed ({selectedFileSize || 'Ready'})</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setUploadSuccess(false);
                      setFileUrl('');
                      setSelectedFileName('');
                    }}
                    style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--red)', cursor: 'pointer' }}
                  >
                    Replace File
                  </button>
                </div>
              )}

              {/* Visual Error Card with Action Buttons */}
              {uploadError && !loading && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--red)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, color: 'var(--red)', marginTop: 1 }}>⚠️</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Upload Failed</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>{uploadError}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadError(null);
                        document.getElementById('file-upload-input')?.click();
                      }}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadError(null);
                        setUploadMethod('link');
                      }}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(0, 180, 216, 0.15)', border: '1px solid var(--green)', color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Use Google Drive Link Instead
                    </button>
                  </div>
                </div>
              )}
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

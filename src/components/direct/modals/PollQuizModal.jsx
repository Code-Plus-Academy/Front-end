import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check,
  PieChart,
  GraduationCap,
  GripVertical,
  Lightbulb,
  BarChart2,
} from 'lucide-react';

export default function PollQuizModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [isQuiz, setIsQuiz] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([0]); // For poll multi-select demonstration / defaults
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setQuestion('');
      setOptions(['', '']);
      setCorrectOptionIndex(0);
      setSelectedOptions([0]);
      setError(null);
      setIsQuiz(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctOptionIndex >= index && correctOptionIndex > 0) {
      setCorrectOptionIndex((prev) => prev - 1);
    }
    setSelectedOptions((prev) =>
      prev
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i))
    );
  };

  const handleOptionChange = (index, value) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleToggleOptionCheck = (idx) => {
    if (isQuiz) {
      setCorrectOptionIndex(idx);
    } else {
      // Toggle in poll mode
      setSelectedOptions((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    const filledOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    const formattedOptions = filledOptions.map((text, idx) => ({
      id: `opt-${idx + 1}`,
      text,
      votes: [], // array of voter user_ids
    }));

    const payload = {
      type: 'poll',
      is_quiz: isQuiz,
      allow_multiple_answers: !isQuiz,
      question: question.trim(),
      correct_option_id: isQuiz ? `opt-${correctOptionIndex + 1}` : null,
      options: formattedOptions,
    };

    onSend(
      payload,
      isQuiz ? `Quiz: ${question.trim()}` : `Poll: ${question.trim()}`
    );
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[92dvh] overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle for Mobile View */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-200/70 dark:border-indigo-900/40 shadow-xs">
                <BarChart2 size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Create Poll or Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Engage your community with interactive polls and quizzes ✨
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Mode Selector Tabs (Matches Reference Image) */}
          <div className="p-1 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setIsQuiz(false)}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isQuiz
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border-b-2 border-indigo-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
              }`}
            >
              <PieChart size={15} />
              <span>Standard Poll</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQuiz(true)}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isQuiz
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border-b-2 border-indigo-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
              }`}
            >
              <GraduationCap size={16} />
              <span>Educational Quiz</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Question Input with Character Counter */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {isQuiz ? 'Quiz Question' : 'Poll Question'}
              </label>
              <div className="rounded-2xl border border-purple-200/80 dark:border-purple-600/40 bg-white dark:bg-slate-900/60 p-3 flex flex-col justify-between min-h-[90px] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-2xs">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={150}
                  rows={2}
                  placeholder="e.g. Which hook triggers on unmount in React?"
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-normal resize-none leading-relaxed"
                />
                <div className="flex justify-end pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    {question.length}/150
                  </span>
                </div>
              </div>
            </div>

            {/* Options Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Options
                </label>
                <span className="text-xs font-medium text-slate-400">
                  {options.length}/6 options
                </span>
              </div>

              {/* Options Rows */}
              <div className="flex flex-col gap-2.5">
                {options.map((opt, idx) => {
                  const isChecked = isQuiz
                    ? correctOptionIndex === idx
                    : selectedOptions.includes(idx);

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      {/* Drag Grip Handle */}
                      <div className="text-slate-400/70 hover:text-slate-600 flex items-center justify-center cursor-grab">
                        <GripVertical size={16} />
                      </div>

                      {/* Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleOptionCheck(idx)}
                        title={
                          isQuiz
                            ? isChecked
                              ? 'Correct Answer'
                              : 'Mark as Correct Answer'
                            : 'Select option'
                        }
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border-2 border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/30'
                        }`}
                      >
                        {isChecked && <Check size={16} strokeWidth={2.6} />}
                      </button>

                      {/* Option Input Field */}
                      <div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03] px-3.5 py-2.5 focus-within:border-purple-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-2xs">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-normal"
                        />
                      </div>

                      {/* Delete Option Button */}
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0 cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Option Button */}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full mt-2.5 py-2.5 px-4 rounded-2xl border-2 border-dashed border-purple-300/80 dark:border-purple-600/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus size={15} />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {/* Tip Helper Note (Matches Reference Image) */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1 pt-0.5">
              <Lightbulb size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span>
                {isQuiz
                  ? 'Tap the checkbox on the left to mark the correct answer.'
                  : 'For polls, users can select multiple options.'}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-xl">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.35)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isQuiz ? 'Create Quiz' : 'Create Poll'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

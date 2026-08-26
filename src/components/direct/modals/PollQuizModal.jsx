import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BarChart2, Plus, Trash2, CheckCircle2, AlertCircle, Check } from 'lucide-react';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  };

  const handleOptionChange = (index, value) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[88dvh] overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-amber-500/20 text-amber-400 flex-shrink-0">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Create Poll or Quiz</h3>
              <p className="text-xs opacity-60">Interactive community voting & quizzes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          className="flex rounded-xl p-1 mb-4"
          style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }}
        >
          <button
            type="button"
            onClick={() => setIsQuiz(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isQuiz
                ? 'bg-amber-500 text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Standard Poll
          </button>
          <button
            type="button"
            onClick={() => setIsQuiz(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isQuiz
                ? 'bg-purple-600 text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Educational Quiz
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Question Input */}
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-75">
              {isQuiz ? 'Quiz Question' : 'Poll Question'}
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which hook triggers on unmount in React?"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDark ? '#F1F5F9' : '#0F172A',
              }}
            />
          </div>

          {/* Options Header */}
          <div className="flex items-center justify-between mt-1">
            <label className="text-xs font-semibold opacity-75">
              Options {isQuiz && <span className="text-purple-400 font-normal">(Select correct answer)</span>}
            </label>
            <span className="text-[11px] opacity-50">{options.length}/6 options</span>
          </div>

          {/* Options Rows */}
          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {isQuiz && (
                  <button
                    type="button"
                    onClick={() => setCorrectOptionIndex(idx)}
                    title={correctOptionIndex === idx ? 'Correct Answer' : 'Mark as Correct Answer'}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      correctOptionIndex === idx
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
                    }`}
                  >
                    <Check size={14} />
                  </button>
                )}
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 opacity-60 hover:opacity-100 transition-opacity"
                    title="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-1 py-1.5 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
              style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)', color: themeAccent }}
            >
              <Plus size={14} />
              <span>Add Option</span>
            </button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl mt-1">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 mt-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              style={{
                background: isQuiz ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              }}
            >
              <CheckCircle2 size={14} />
              <span>{isQuiz ? 'Launch Quiz' : 'Create Poll'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

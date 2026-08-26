'use client';

import React, { useState } from 'react';
import { BarChart2, Check, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function PollMessageCard({ attachment, isMine }) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'viewer';

  // Local state for interactive voting
  const [pollData, setPollData] = useState(() => {
    return attachment || { question: '', options: [] };
  });

  const [selectedOptionId, setSelectedOptionId] = useState(() => {
    // Check if current user already voted in the initial payload
    const found = attachment?.options?.find((opt) =>
      Array.isArray(opt.votes) && opt.votes.includes(currentUserId)
    );
    return found ? found.id : null;
  });

  if (!pollData || !pollData.question) return null;

  const isQuiz = Boolean(pollData.is_quiz);
  const correctOptionId = pollData.correct_option_id;

  // Calculate total votes
  const totalVotes = (pollData.options || []).reduce(
    (acc, opt) => acc + (Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0)),
    0
  );

  const hasVoted = Boolean(selectedOptionId);

  const handleVote = (optId) => {
    if (hasVoted) return; // single vote lock

    setSelectedOptionId(optId);

    setPollData((prev) => {
      const nextOptions = (prev.options || []).map((opt) => {
        if (opt.id === optId) {
          const currentVotes = Array.isArray(opt.votes) ? opt.votes : [];
          return { ...opt, votes: [...currentVotes, currentUserId] };
        }
        return opt;
      });
      return { ...prev, options: nextOptions };
    });
  };

  return (
    <div
      className="rounded-2xl p-4 shadow-xl"
      style={{
        maxWidth: '380px',
        width: '100%',
        backgroundColor: isMine ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Header Badge & Question */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"
          style={{
            backgroundColor: isQuiz ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: isQuiz ? '#C084FC' : '#FBBF24',
            border: isQuiz ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          }}
        >
          {isQuiz ? <HelpCircle size={11} /> : <BarChart2 size={11} />}
          <span>{isQuiz ? 'Quiz' : 'Community Poll'}</span>
        </span>
        <span className="text-[11px] opacity-60 font-mono">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>

      <h4 className="text-sm font-bold leading-snug mb-3 text-white">
        {pollData.question}
      </h4>

      {/* Options List */}
      <div className="flex flex-col gap-2">
        {(pollData.options || []).map((opt) => {
          const optVotesCount = Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0);
          const percentage = totalVotes > 0 ? Math.round((optVotesCount / totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === opt.id;
          const isCorrect = isQuiz && correctOptionId === opt.id;
          const isWrongSelection = isQuiz && isSelected && !isCorrect;

          let borderColor = 'rgba(255, 255, 255, 0.12)';
          let barBgColor = 'rgba(255, 255, 255, 0.1)';

          if (hasVoted) {
            if (isQuiz) {
              if (isCorrect) {
                borderColor = 'rgba(16, 185, 129, 0.6)';
                barBgColor = 'rgba(16, 185, 129, 0.25)';
              } else if (isWrongSelection) {
                borderColor = 'rgba(239, 68, 68, 0.6)';
                barBgColor = 'rgba(239, 68, 68, 0.25)';
              }
            } else if (isSelected) {
              borderColor = '#8B5CF6';
              barBgColor = 'rgba(139, 92, 246, 0.35)';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted}
              className="relative w-full text-left rounded-xl p-2.5 overflow-hidden transition-all text-xs font-medium cursor-pointer disabled:cursor-default"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: `1px solid ${borderColor}`,
              }}
            >
              {/* Progress Bar Fill */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: barBgColor,
                  }}
                />
              )}

              {/* Option Text and Percent */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {hasVoted && isQuiz ? (
                    isCorrect ? (
                      <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    ) : isWrongSelection ? (
                      <XCircle size={14} className="text-rose-400 flex-shrink-0" />
                    ) : (
                      <span className="w-3.5" />
                    )
                  ) : isSelected ? (
                    <Check size={14} className="text-purple-400 flex-shrink-0" />
                  ) : null}
                  <span className={`truncate ${isSelected ? 'font-bold text-white' : 'text-slate-200'}`}>
                    {opt.text}
                  </span>
                </div>

                {hasVoted && (
                  <span className="text-[11px] font-mono font-bold text-slate-300 flex-shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

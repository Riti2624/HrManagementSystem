import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Send, CheckCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface InterviewFeedbackFormProps {
  interviewId: string;
  interviewerName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function RatingStars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-bold text-blue-600">{value > 0 ? `${value}/5` : '—'}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={20}
              className={cn(
                'transition-colors',
                (hovered || value) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const RECOMMENDATIONS = [
  { value: 'Proceed', label: 'Proceed', icon: ThumbsUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  { value: 'Hold',    label: 'Hold',    icon: Minus,     color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-300'   },
  { value: 'Reject',  label: 'Reject',  icon: ThumbsDown, color: 'text-rose-700',  bg: 'bg-rose-50 border-rose-300'    }
] as const;

export function InterviewFeedbackForm({ interviewId, interviewerName = '', onSuccess, onCancel }: InterviewFeedbackFormProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    reviewerName: interviewerName,
    communication: 0,
    technical: 0,
    cultureFit: 0,
    leadership: 0,
    recommendation: 'Hold' as 'Proceed' | 'Hold' | 'Reject',
    comments: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const overallScore = Math.round(
    ([form.communication, form.technical, form.cultureFit, form.leadership]
      .filter(Boolean)
      .reduce((a, b) => a + b, 0)) /
    ([form.communication, form.technical, form.cultureFit, form.leadership].filter(Boolean).length || 1)
    * 20 // convert 1-5 to 0-100
  );

  const mutation = useMutation({
    mutationFn: () => api.submitFeedback(interviewId, {
      ...form,
      overallScore
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setSubmitted(true);
      setTimeout(() => onSuccess?.(), 1200);
    }
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle size={32} />
        </div>
        <p className="mt-4 text-base font-semibold text-slate-900">Feedback submitted!</p>
        <p className="text-sm text-slate-500">Your review has been recorded.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Reviewer Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Interviewer name"
          value={form.reviewerName}
          onChange={(e) => updateField('reviewerName', e.target.value)}
        />
      </div>

      {/* Ratings */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluation Criteria</p>
        <RatingStars label="Communication" value={form.communication} onChange={(v) => updateField('communication', v)} />
        <RatingStars label="Technical Skills" value={form.technical} onChange={(v) => updateField('technical', v)} />
        <RatingStars label="Culture Fit" value={form.cultureFit} onChange={(v) => updateField('cultureFit', v)} />
        <RatingStars label="Leadership Potential" value={form.leadership} onChange={(v) => updateField('leadership', v)} />
        {overallScore > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-xs font-bold text-slate-700">Overall Score</span>
            <span className={cn(
              'text-sm font-black',
              overallScore >= 80 ? 'text-emerald-600' : overallScore >= 60 ? 'text-amber-600' : 'text-rose-600'
            )}>{overallScore}/100</span>
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">Recommendation</p>
        <div className="grid grid-cols-3 gap-2">
          {RECOMMENDATIONS.map(({ value, label, icon: Icon, color, bg }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateField('recommendation', value)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all',
                form.recommendation === value ? `${bg} ${color}` : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Comments</label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          placeholder="Add detailed notes about the candidate's performance..."
          value={form.comments}
          onChange={(e) => updateField('comments', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.reviewerName.trim() || overallScore === 0}
        >
          <Send size={14} />
          {mutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-xs text-rose-600 font-medium">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to submit feedback.'}
        </p>
      )}
    </div>
  );
}

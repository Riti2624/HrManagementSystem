import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, User, Brain, Trophy, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const STAGE_ORDER = [
  'New',
  'Shortlisted',
  'HR Interview',
  'Tech Interview',
  'Managerial Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;

type Stage = typeof STAGE_ORDER[number];

const STAGE_CONFIG: Record<Stage, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  'New':                  { color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200', icon: Clock },
  'Shortlisted':          { color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',  icon: CheckCircle2 },
  'HR Interview':         { color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: User },
  'Tech Interview':       { color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',  icon: Brain },
  'Managerial Interview': { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: Trophy },
  'Offer':                { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Sparkles },
  'Hired':                { color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200', icon: CheckCircle2 },
  'Rejected':             { color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',  icon: XCircle }
};

interface Application {
  id: string;
  name: string;
  score: number;
  aiScore?: number;
  stage: string;
  jobCode?: string;
  applicationCode?: string;
}

interface Job {
  id: string;
  jobCode: string;
  title: string;
  department: string;
}

interface ATSKanbanBoardProps {
  applications: Application[];
  jobs: Job[];
  onStageChange: (id: string, newStage: string) => void;
  onCardClick?: (app: Application) => void;
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? 'success' : score >= 70 ? 'warning' : score > 0 ? 'danger' : 'neutral';
  if (!score) return null;
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
      tone === 'success' && 'bg-emerald-100 text-emerald-700',
      tone === 'warning' && 'bg-amber-100 text-amber-700',
      tone === 'danger'  && 'bg-rose-100 text-rose-700',
      tone === 'neutral' && 'bg-slate-100 text-slate-500'
    )}>
      {score}%
    </span>
  );
}

export function ATSKanbanBoard({ applications, jobs, onStageChange, onCardClick }: ATSKanbanBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const dragCardId = useRef<string | null>(null);

  const grouped = STAGE_ORDER.reduce<Record<Stage, Application[]>>((acc, stage) => {
    acc[stage] = applications.filter(a => a.stage === stage);
    return acc;
  }, {} as Record<Stage, Application[]>);

  function handleDragStart(e: React.DragEvent, id: string) {
    dragCardId.current = id;
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stage);
  }

  function handleDrop(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    if (dragCardId.current) {
      onStageChange(dragCardId.current, stage);
    }
    setDragging(null);
    setDragOver(null);
    dragCardId.current = null;
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragCardId.current = null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '420px' }}>
      {STAGE_ORDER.map((stage) => {
        const cfg = STAGE_CONFIG[stage];
        const Icon = cfg.icon;
        const cards = grouped[stage];
        const isOver = dragOver === stage;

        return (
          <div
            key={stage}
            className={cn(
              'flex min-w-[200px] flex-col rounded-2xl border-2 transition-all duration-150',
              isOver ? `${cfg.border} ${cfg.bg} shadow-md` : 'border-slate-200 bg-slate-50/60'
            )}
            style={{ flex: '0 0 200px' }}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={() => setDragOver(null)}
          >
            {/* Column header */}
            <div className={cn('flex items-center gap-2 rounded-t-xl px-3 py-2.5', cfg.bg, cfg.border.replace('border', 'border-b'))}>
              <Icon size={13} className={cfg.color} />
              <span className={cn('text-xs font-semibold', cfg.color)}>{stage}</span>
              <span className={cn('ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold', cfg.color, 'bg-white/80')}>
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2 p-2">
              <AnimatePresence>
                {cards.map((app) => {
                  const job = jobs.find(j => j.jobCode === app.jobCode);
                  const displayScore = Number(app.aiScore) || Number(app.score) || 0;
                  return (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: dragging === app.id ? 0.5 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, app.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCardClick?.(app)}
                      className="group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical size={12} className="shrink-0 text-slate-300 group-hover:text-slate-400" />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-slate-900">{app.name}</div>
                            {job && <div className="truncate text-[10px] text-slate-500">{job.title}</div>}
                          </div>
                        </div>
                        <ScoreBadge score={displayScore} />
                      </div>
                      {app.aiScore && app.aiScore > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                app.aiScore >= 85 ? 'bg-emerald-500' : app.aiScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                              )}
                              style={{ width: `${app.aiScore}%` }}
                            />
                          </div>
                          <Sparkles size={10} className="text-violet-400 shrink-0" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {cards.length === 0 && (
                <div className={cn('flex h-16 items-center justify-center rounded-xl border-2 border-dashed text-xs', isOver ? `${cfg.border} ${cfg.color}` : 'border-slate-200 text-slate-400')}>
                  {isOver ? 'Drop here' : 'Empty'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

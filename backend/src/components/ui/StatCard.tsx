import { motion } from 'framer-motion';
import { Card } from './Card';

export function StatCard({ label, value, subtext, accent }: { label: string; value: string; subtext: string; accent: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
      <Card className="relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />
        <div className="relative">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">{subtext}</div>
        </div>
      </Card>
    </motion.div>
  );
}

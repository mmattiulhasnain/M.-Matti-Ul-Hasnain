import React from 'react';
import { motion } from 'motion/react';
import { Candidate, PipelineStage } from '../types';
import { updateCandidateInFirestore } from '../services/candidateService';
import { THEME_CONFIGS } from '../theme';
import { Edit2, MessageSquare, Star, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const STAGES: PipelineStage[] = [
  'Available on Bench',
  'Screening',
  'Client Submitted',
  'Interviewing',
  'Placed / Engaged'
];

export function CandidatePipelineDashboard({ 
  records, 
  theme,
  onEditCandidate
}: { 
  records: Candidate[], 
  theme: typeof THEME_CONFIGS['light'],
  onEditCandidate: (candidate: Candidate) => void
}) {
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('candidate_id', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidate_id');
    if (!candidateId) return;

    const candidate = records.find(r => r.id === candidateId);
    if (!candidate || candidate.pipelineStage === targetStage) return;

    try {
      await updateCandidateInFirestore(candidate.id, { pipelineStage: targetStage });
    } catch (error) {
      console.error('Error updating candidate stage', error);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-slate-400 text-xs italic">Unrated</span>;
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(star => (
          <Star key={star} className={`w-3 h-3 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 items-stretch">
      {STAGES.map(stage => {
        const stageCandidates = records.filter(r => (r.pipelineStage || 'Available on Bench') === stage);
        return (
          <div 
            key={stage}
            className={`min-w-[320px] max-w-[320px] flex flex-col ${theme.bgCard} ${theme.border} border rounded-2xl flex-shrink-0 h-full overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className={`p-4 ${theme.border} border-b sticky top-0 bg-inherit z-10 flex justify-between items-center`}>
              <h3 className={`font-bold ${theme.textPrimary}`}>{stage}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${theme.badgePrimary}`}>
                {stageCandidates.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {stageCandidates.map(candidate => (
                <motion.div
                  key={candidate.id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, candidate.id)}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className={`p-4 rounded-xl ${theme.bgTableRowHover} border ${theme.border} cursor-grab active:cursor-grabbing shadow-sm flex flex-col gap-2 relative`}
                >
                  <button 
                    onClick={() => onEditCandidate(candidate)}
                    className={`absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-500/20 ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="pr-6">
                    <h4 className={`font-bold ${theme.textPrimary} text-sm line-clamp-1`}>{candidate.name}</h4>
                    <p className={`text-xs ${theme.textSecondary} font-medium line-clamp-1 mt-0.5`}>{candidate.role}</p>
                  </div>

                  {/* Scorecard Snippet */}
                  <div className={`mt-2 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>Tech</span>
                      {renderStars(candidate.scorecard?.technicalRating)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>Comm</span>
                      {renderStars(candidate.scorecard?.communicationClarity)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>English</span>
                      <span className={`text-[11px] font-bold ${theme.textPrimary}`}>
                        {candidate.scorecard?.englishProficiency || '-'}
                      </span>
                    </div>
                  </div>

                  {(candidate.preferredTimezones && candidate.preferredTimezones.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.preferredTimezones.map(tz => (
                        <span key={tz} className={`text-[10px] px-1.5 py-0.5 rounded border ${theme.border} ${theme.textSecondary}`}>
                          {tz}
                        </span>
                      ))}
                    </div>
                  )}

                </motion.div>
              ))}
              
              {stageCandidates.length === 0 && (
                <div className={`p-8 text-center text-sm ${theme.textMuted} border-2 border-dashed ${theme.border} rounded-xl`}>
                  No candidates in this stage. Drag and drop here.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

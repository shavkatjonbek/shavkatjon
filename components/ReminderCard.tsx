import React from 'react';
import { ReminderData } from '../types';

interface ReminderCardProps {
  data: ReminderData;
  isLatest?: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ data, isLatest = false }) => {
  const isValid = data.confidence_score >= 0.5 && data.scheduled_time !== "";
  
  // Format date for display
  const formattedDate = isValid 
    ? new Date(data.scheduled_time).toLocaleString(undefined, { 
        dateStyle: 'full', 
        timeStyle: 'short' 
      })
    : 'N/A';
  
  const confidencePercent = Math.round(data.confidence_score * 100);
  
  let confidenceColor = 'text-red-400';
  if (confidencePercent > 80) confidenceColor = 'text-green-400';
  else if (confidencePercent > 50) confidenceColor = 'text-yellow-400';

  return (
    <div className={`w-full max-w-md bg-surface border ${isLatest ? 'border-primary-500/50 shadow-[0_0_30px_-10px_rgba(20,184,166,0.3)]' : 'border-slate-700'} rounded-xl p-6 overflow-hidden relative transition-all duration-500`}>
      
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isValid ? 'bg-primary-900/30 text-primary-300' : 'bg-red-900/30 text-red-300'}`}>
          {isValid ? 'Scheduled' : 'Failed'}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
           <span>Confidence:</span>
           <span className={`font-bold ${confidenceColor}`}>{confidencePercent}%</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-medium text-slate-100 mb-2 leading-snug">
        {data.reminder_content || "Could not understand reminder."}
      </h3>

      {/* Time Display */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-700/50">
        <div className="bg-slate-800 p-2 rounded-lg text-primary-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Time</span>
          <span className="text-slate-200 font-mono text-sm">{formattedDate}</span>
        </div>
      </div>

      {/* Raw Time (Debug style) */}
      <div className="mt-2 pl-[3.25rem]">
        <span className="text-[10px] text-slate-600 font-mono">{data.scheduled_time}</span>
      </div>
      
    </div>
  );
};

export default ReminderCard;

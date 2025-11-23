export interface ReminderData {
  reminder_content: string;
  scheduled_time: string;
  confidence_score: number;
}

export enum ParseStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface HistoryItem extends ReminderData {
  id: string;
  createdAt: string;
  originalInput: string; // Transcription or text
}

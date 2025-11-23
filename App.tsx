import React, { useState, useRef, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import ReminderCard from './components/ReminderCard';
import { parseInput } from './services/geminiService';
import { ReminderData, ParseStatus, HistoryItem } from './types';
import { v4 as uuidv4 } from 'uuid'; // We'll use a simple random ID generator function instead of importing uuid to keep it dependency-free as per constraints? No, prompt says "Use popular libraries". I'll simulate uuid to avoid extra import issues if environment is strict, or just use crypto.randomUUID.

const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
}

const App: React.FC = () => {
  const [status, setStatus] = useState<ParseStatus>(ParseStatus.IDLE);
  const [textInput, setTextInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // For sticky header scroll effect
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    await processInput(textInput);
    setTextInput("");
  };

  const handleAudioComplete = async (base64Data: string, mimeType: string) => {
    await processInput({ data: base64Data, mimeType });
  };

  const processInput = async (input: string | { data: string; mimeType: string }) => {
    setStatus(ParseStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const { data, rawText } = await parseInput(input);
      
      const newItem: HistoryItem = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        originalInput: rawText
      };

      setHistory(prev => [newItem, ...prev]);
      setStatus(ParseStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setStatus(ParseStatus.ERROR);
      setErrorMsg("Failed to process input. Please try again.");
    } finally {
      // Reset status after a delay to allow users to see the result state or just keep showing the list
      setTimeout(() => {
        if (status !== ParseStatus.RECORDING) {
           setStatus(ParseStatus.IDLE);
        }
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center font-sans selection:bg-primary-500/30">
      
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-background/80 backdrop-blur-md border-slate-800 py-3' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              Chronos
            </h1>
          </div>
          <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500 font-mono hidden sm:block">
                 UTC: {new Date().toISOString().split('T')[1].split('.')[0]}Z
              </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl px-6 pt-32 pb-20 flex flex-col gap-12">
        
        {/* Hero / Input Section */}
        <section className="flex flex-col gap-8 animate-[fadeIn_0.8s_ease-out]">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Capture Time <span className="text-primary-400">&</span> Intent
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
              Speak or type naturally. Chronos uses Gemini 2.5 to extract precise schedules and reminders from your chaotic thoughts.
            </p>
          </div>

          {/* Tabs / Input Methods */}
          <div className="space-y-6">
            <AudioRecorder 
              onRecordingComplete={handleAudioComplete} 
              isProcessing={status === ParseStatus.PROCESSING} 
            />
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-4 text-slate-600 text-xs uppercase tracking-widest">Or type it</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleTextSubmit} className="relative group">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g., 'Remind me to call John regarding the project next Tuesday at 2pm'"
                className="w-full bg-surface border border-slate-700 rounded-xl px-6 py-4 pr-14 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-lg"
                disabled={status === ParseStatus.PROCESSING}
              />
              <button 
                type="submit"
                disabled={!textInput.trim() || status === ParseStatus.PROCESSING}
                className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-500 text-white px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {status === ParseStatus.PROCESSING ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm text-center animate-pulse">
              {errorMsg}
            </div>
          )}
        </section>

        {/* Results Feed */}
        {history.length > 0 && (
           <section className="flex flex-col gap-6 animate-[slideUp_0.5s_ease-out]">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                Recent Parses
              </div>
              
              <div className="flex flex-col gap-4 items-center">
                {history.map((item, index) => (
                  <ReminderCard 
                    key={item.id} 
                    data={item} 
                    isLatest={index === 0}
                  />
                ))}
              </div>
           </section>
        )}
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/10 rounded-full blur-[128px]"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[128px]"></div>
      </div>
    </div>
  );
};

export default App;

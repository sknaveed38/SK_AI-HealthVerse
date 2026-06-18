import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Frown, Meh, Loader2, Sparkles, Brain } from 'lucide-react';

export function MentalHealthAI({ patientId }: { patientId: string }) {
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/mental-health/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal_entry: entry, patient_id: patientId }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Mental health analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 h-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 opacity-30" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">MindCare AI</h2>
          <p className="text-slate-400 text-sm">Emotional Wellness Analytics</p>
        </div>
        <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
          <Brain className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="How are you feeling today? Talk about your stress, sleep, or mood..."
            className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-600 resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !entry.trim()}
            className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 p-2 rounded-xl transition-all shadow-lg"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Stress Level</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{analysis.stress_level}</span>
                  <span className="text-sm text-slate-400 pb-1">/ 10</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${analysis.stress_level > 7 ? 'bg-red-500' : analysis.stress_level > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${analysis.stress_level * 10}%` }}
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-2xl flex flex-col justify-center items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 w-full text-left">Mood</p>
                {analysis.sentiment === 'Positive' ? <Smile className="w-8 h-8 text-green-400" /> : analysis.sentiment === 'Negative' ? <Frown className="w-8 h-8 text-red-400" /> : <Meh className="w-8 h-8 text-yellow-400" />}
                <p className="text-sm font-medium text-slate-200 mt-2">{analysis.sentiment}</p>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Brain className="w-12 h-12" />
              </div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">AI Wellness Tip</p>
              <p className="text-sm text-slate-200 leading-relaxed italic">"{analysis.wellness_tip}"</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

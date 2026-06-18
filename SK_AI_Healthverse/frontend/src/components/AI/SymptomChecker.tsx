import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Activity, ChevronRight, Loader2 } from 'lucide-react';

const BODY_PARTS = [
  { id: 'head', name: 'Head & Neck', icon: '🧠' },
  { id: 'chest', name: 'Chest & Torso', icon: '🫁' },
  { id: 'back', name: 'Back & Spine', icon: '🦴' },
  { id: 'arms', name: 'Arms & Hands', icon: '💪' },
  { id: 'legs', name: 'Legs & Feet', icon: '🦵' },
];

export function SymptomChecker({ patientId }: { patientId: string }) {
  const [step, setStep] = useState(1);
  const [selectedPart, setSelectedPart] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/check-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_part: selectedPart, symptoms, patient_id: patientId }),
      });
      const data = await response.json();
      setResult(data);
      setStep(3);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 h-full overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50 opacity-30" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Diagnostic Suite</h2>
          <p className="text-slate-400 text-sm">Precision Symptom Mapping</p>
        </div>
        <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
          <Activity className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Step 1: Select Affected Area</p>
            <div className="grid grid-cols-1 gap-3">
              {BODY_PARTS.map((part) => (
                <button
                  key={part.id}
                  onClick={() => { setSelectedPart(part.id); setStep(2); }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all group/btn"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{part.icon}</span>
                    <span className="font-medium text-slate-200">{part.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover/btn:text-blue-400 group-hover/btn:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Step 2: Describe Symptoms</p>
              <button onClick={() => setStep(1)} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Change Area</button>
            </div>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Sharp pain when breathing, persistent cough..."
              className="w-full h-40 bg-slate-950/50 border border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symptoms.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Run AI Diagnostics"}
            </button>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
              <AlertCircle className={`w-6 h-6 ${result.urgency === 'HIGH' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
              <div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Triage Level: {result.urgency}</p>
                <p className="text-sm text-slate-200">{result.advice}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Potential Conditions</h3>
              {result.conditions?.map((cond: any, i: number) => (
                <div key={i} className="p-4 bg-slate-800/30 border border-slate-700 rounded-2xl">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-slate-200">{cond.name}</span>
                    <span className="text-xs text-blue-400 font-mono">{(cond.probability * 100).toFixed(0)}% Match</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cond.probability * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-blue-500" 
                    />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => { setStep(1); setResult(null); setSymptoms(''); }}
              className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              Start New Analysis
            </button>

            <p className="text-[10px] text-slate-500 italic text-center leading-relaxed">
              Disclaimer: This AI analysis is for educational purposes and simulation only. Not a substitute for professional medical advice.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

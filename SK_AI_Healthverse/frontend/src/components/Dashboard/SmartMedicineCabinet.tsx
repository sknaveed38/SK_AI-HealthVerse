import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react';

export function SmartMedicineCabinet({ patient, onUpdate }: { patient: any, onUpdate: (p: any) => void }) {
  const [newMed, setNewMed] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);

  const checkInteraction = async () => {
    if (!newMed.trim()) return;
    setIsChecking(true);
    setInteractionResult(null);
    
    try {
      const response = await fetch('/api/chat?message=' + encodeURIComponent(`Drug Interaction Check: Is it safe to take ${newMed} with my current medications: ${patient.medications.join(', ')}? Return a JSON with 'safe' (boolean), 'warning' (string), and 'details' (string).`) + `&patient_id=${patient.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      const jsonMatch = data.response.match(/\{.*\}/s);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setInteractionResult(result);
        if (result.safe) {
          const updatedMeds = [...patient.medications, newMed];
          const updateRes = await fetch(`/api/patient/${patient.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medications: updatedMeds }),
          });
          const updateData = await updateRes.json();
          onUpdate(updateData.patient);
          setNewMed('');
        }
      }
    } catch (err) {
      console.error("Check failed");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold">Smart Medicine Cabinet</h2>
          <p className="text-xs text-slate-500">AI-Powered Interaction Safety</p>
        </div>
        <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
          <Pill className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newMed}
            onChange={(e) => setNewMed(e.target.value)}
            placeholder="Add new medication..."
            className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={checkInteraction}
            disabled={isChecking || !newMed.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 px-4 rounded-xl transition-all"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check & Add"}
          </button>
        </div>

        {interactionResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl border ${interactionResult.safe ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-3 mb-2">
              {interactionResult.safe ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
              <p className={`font-bold text-sm ${interactionResult.safe ? 'text-green-400' : 'text-red-400'}`}>{interactionResult.safe ? "Safe to add" : "Safety Warning"}</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{interactionResult.warning || interactionResult.details}</p>
          </motion.div>
        )}

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {patient?.medications?.map((med: string, i: number) => (
            <div key={i} className="p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium text-slate-200">{med}</span>
              </div>
              <button className="text-slate-600 hover:text-red-400 transition-colors p-1"><Info className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {(!patient?.medications || patient.medications.length === 0) && <p className="text-center py-6 text-xs text-slate-500 italic">No medications tracked yet.</p>}
        </div>
      </div>
    </div>
  );
}

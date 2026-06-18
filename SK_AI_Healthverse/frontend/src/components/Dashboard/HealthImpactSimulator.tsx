import { useState } from 'react';
import { Play, TrendingDown, TrendingUp, Activity } from 'lucide-react';

export function HealthImpactSimulator() {
  const [exercise, setExercise] = useState(30);
  const [sugar, setSugar] = useState(50);
  const [sleep, setSleep] = useState(7);

  // Simple heuristic simulation
  const cvRiskReduction = (exercise / 60) * 0.15 + (sleep > 7 ? 0.05 : 0);
  const diabetesRiskReduction = (1 - (sugar / 100)) * 0.2 + (exercise / 60) * 0.1;
  const totalImprovement = Math.min(100, (cvRiskReduction + diabetesRiskReduction) * 200);

  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold">Health Impact Simulator</h2>
          <p className="text-xs text-slate-500">Visualize Lifestyle Modifications</p>
        </div>
        <div className="bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
          <Activity className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      <div className="space-y-8">
        <SimulatorSlider label="Daily Exercise (mins)" value={exercise} min={0} max={120} unit="min" onChange={setExercise} color="bg-blue-500" />
        <SimulatorSlider label="Sugar Intake (grams)" value={sugar} min={0} max={150} unit="g" onChange={setSugar} color="bg-red-500" reversed />
        <SimulatorSlider label="Sleep Duration (hrs)" value={sleep} min={4} max={10} unit="hrs" onChange={setSleep} color="bg-purple-500" />

        <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Reduction</p>
            <div className="flex items-center gap-2 text-green-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xl font-bold">{(cvRiskReduction * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vitality Score</p>
            <div className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xl font-bold">+{totalImprovement.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-blue-900/20 transition-all">
          <Play className="w-4 h-4 fill-current" />
          Apply to Personalized Plan
        </button>
      </div>
    </div>
  );
}

function SimulatorSlider({ label, value, min, max, unit, onChange, color }: any) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-mono text-white">{value}{unit}</span>
      </div>
      <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`absolute h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
        <input 
          type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

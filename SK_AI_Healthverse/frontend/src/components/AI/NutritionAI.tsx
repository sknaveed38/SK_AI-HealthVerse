import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Utensils, Moon, RefreshCw, ShoppingCart, Loader2, Apple } from 'lucide-react';

export function NutritionAI({ patientId }: { patientId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/nutrition-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });
      const data = await response.json();
      setPlan(data);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 h-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">AI Nutritionist</h2>
          <p className="text-slate-400 text-sm">Bio-Synced Meal Planning</p>
        </div>
        <div className="bg-green-500/10 p-3 rounded-2xl border border-green-500/20">
          <Apple className="w-6 h-6 text-green-500" />
        </div>
      </div>

      {!plan ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <Utensils className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 max-w-xs text-sm">Our AI will analyze your latest vitals and blood markers to create a heart-healthy meal plan.</p>
          <button
            onClick={generatePlan}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-green-900/20 flex items-center gap-3"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Generate My Plan
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar"
        >
          {Object.entries(plan.days || plan.meal_plan || {}).map(([, meals]: any, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-900/80 py-2 backdrop-blur-sm">Day {idx + 1}</h3>
              <div className="grid grid-cols-1 gap-3">
                <MealCard icon={<Coffee className="w-4 h-4 text-orange-400" />} type="Breakfast" name={meals.breakfast} />
                <MealCard icon={<Utensils className="w-4 h-4 text-blue-400" />} type="Lunch" name={meals.lunch} />
                <MealCard icon={<Moon className="w-4 h-4 text-purple-400" />} type="Dinner" name={meals.dinner} />
              </div>
            </div>
          ))}
          
          <div className="pt-6 border-t border-slate-800">
            <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl text-sm font-bold transition-all">
              <ShoppingCart className="w-4 h-4" />
              Generate Smart Shopping List
            </button>
            <button onClick={() => setPlan(null)} className="w-full text-xs text-slate-500 hover:text-slate-300 mt-4 transition-colors">Reset and regenerate</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MealCard({ icon, type, name }: any) {
  return (
    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-colors">
      <div className="bg-slate-900 p-2 rounded-xl border border-slate-700">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type}</p>
        <p className="text-sm font-medium text-slate-200">{name}</p>
      </div>
    </div>
  );
}

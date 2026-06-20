import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Heart as HeartIcon, Sparkles, Wind, Flame } from 'lucide-react';

interface OrganInfo {
  name: string;
  icon: any;
  status: string;
  statusColor: string;
  telemetry: { label: string; value: string }[];
  recommendations: string[];
}

const ORGANS: Record<string, OrganInfo> = {
  brain: {
    name: "Brain & Nervous System",
    icon: Brain,
    status: "Optimal Sync",
    statusColor: "text-blue-400",
    telemetry: [
      { label: "Cognitive State", value: "Balanced" },
      { label: "EEG Frequency", value: "10.2 Hz (Alpha)" },
      { label: "Sleep Quality", value: "88% (Restful)" }
    ],
    recommendations: [
      "Practice mindfulness/deep breathing for 10 minutes",
      "Prioritize 7+ hours of quality sleep",
      "Stay hydrated to support cognitive function"
    ]
  },
  heart: {
    name: "Cardiovascular System",
    icon: HeartIcon,
    status: "Healthy Rhythm",
    statusColor: "text-emerald-400",
    telemetry: [
      { label: "Heart Rate", value: "72 BPM" },
      { label: "ECG Status", value: "Normal Sinus" },
      { label: "BP (Est.)", value: "118/76 mmHg" }
    ],
    recommendations: [
      "Complete 30 mins of moderate aerobic exercise today",
      "Incorporate omega-3 rich foods like salmon",
      "Limit sodium and high-caffeine stimulants"
    ]
  },
  lungs: {
    name: "Respiratory System",
    icon: Wind,
    status: "Optimal Capacity",
    statusColor: "text-cyan-400",
    telemetry: [
      { label: "Oxygen Saturation (SpO2)", value: "98%" },
      { label: "Respiration Rate", value: "14 bpm" },
      { label: "VO2 Max Estimate", value: "44 ml/kg/min" }
    ],
    recommendations: [
      "Practice diaphragmatic breathing for 5 minutes",
      "Open windows to maintain fresh air circulation",
      "Avoid dry, air-conditioned rooms for prolonged periods"
    ]
  },
  stomach: {
    name: "Digestive System",
    icon: Flame,
    status: "Active / Stable",
    statusColor: "text-orange-400",
    telemetry: [
      { label: "Digestive Activity", value: "Regular" },
      { label: "Gut Biome Index", value: "Good (85%)" },
      { label: "Metabolic State", value: "Balanced" }
    ],
    recommendations: [
      "Consume fiber-rich whole foods and vegetables",
      "Incorporate probiotic yogurt or fermented food",
      "Avoid lying down for 2-3 hours after eating"
    ]
  },
  limbs: {
    name: "Musculoskeletal System",
    icon: Activity,
    status: "Active Recovery",
    statusColor: "text-purple-400",
    telemetry: [
      { label: "Total Steps", value: "8,432 / 10k" },
      { label: "Joint Mobility", value: "Normal" },
      { label: "Muscle Recovery", value: "92% Restored" }
    ],
    recommendations: [
      "Perform a 10-minute hamstring and calf stretch",
      "Aim for another 1,500 steps to reach your daily target",
      "Ensure adequate Calcium and Vitamin D intake"
    ]
  }
};

export function DigitalTwin() {
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);

  const activeOrgan = selectedOrgan ? ORGANS[selectedOrgan] : null;

  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold">Interactive Digital Twin</h2>
          <p className="text-xs text-slate-500">Tap hotspots on your twin to query organ health</p>
        </div>
        <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
          <Activity className="w-5 h-5 text-blue-500 animate-[pulse_2s_infinite]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[350px]">
        {/* Human Body SVG Hotspot Grid */}
        <div className="relative w-full h-80 bg-slate-950/40 rounded-3xl border border-slate-800/50 overflow-hidden flex items-center justify-center">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
          
          {/* Scanning Line */}
          <motion.div 
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent z-10 opacity-30 pointer-events-none"
          />

          <div className="relative h-72 w-36">
            <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              {/* Human Outline */}
              <path 
                d="M50 5 C58 5 65 12 65 20 C65 28 58 35 50 35 C42 35 35 28 35 20 C35 12 42 5 50 5 M35 40 L65 40 M65 40 L80 110 L70 115 L60 70 L65 130 L65 190 L55 190 L55 140 L45 140 L45 190 L35 190 L35 130 L40 70 L30 115 L20 110 L35 40" 
                fill="none" 
                stroke={selectedOrgan ? "#1e293b" : "#3b82f6"} 
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-50 transition-colors duration-300"
              />

              {/* Head / Brain Hotspot */}
              <motion.circle 
                cx="50" cy="20" r="9" 
                fill={selectedOrgan === 'brain' ? '#3b82f6' : '#1e3a8a'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-blue-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('brain')}
              />
              <circle cx="50" cy="20" r="14" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3,3" className="animate-[spin_12s_linear_infinite] pointer-events-none" />

              {/* Heart Hotspot */}
              <motion.circle 
                cx="53" cy="62" r="7" 
                fill={selectedOrgan === 'heart' ? '#ef4444' : '#991b1b'}
                className="opacity-90 cursor-pointer hover:opacity-100 hover:fill-red-500 transition-all duration-300"
                onClick={() => setSelectedOrgan('heart')}
                animate={{ scale: selectedOrgan === 'heart' ? [1, 1.25, 1] : [1, 1.15, 1] }}
                transition={{ duration: selectedOrgan === 'heart' ? 0.6 : 0.9, repeat: Infinity }}
              />

              {/* Lungs Hotspots */}
              <motion.ellipse 
                cx="42" cy="65" rx="5" ry="8"
                fill={selectedOrgan === 'lungs' ? '#06b6d4' : '#0891b2'}
                className="opacity-70 cursor-pointer hover:opacity-100 hover:fill-cyan-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('lungs')}
              />
              <motion.ellipse 
                cx="58" cy="65" rx="5" ry="8"
                fill={selectedOrgan === 'lungs' ? '#06b6d4' : '#0891b2'}
                className="opacity-70 cursor-pointer hover:opacity-100 hover:fill-cyan-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('lungs')}
              />

              {/* Stomach Hotspot */}
              <motion.circle 
                cx="50" cy="88" r="8" 
                fill={selectedOrgan === 'stomach' ? '#f97316' : '#c2410c'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-orange-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('stomach')}
              />

              {/* Limbs / Skeletal Hotspots */}
              <motion.circle 
                cx="26" cy="100" r="5" 
                fill={selectedOrgan === 'limbs' ? '#a855f7' : '#7e22ce'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-purple-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('limbs')}
              />
              <motion.circle 
                cx="74" cy="100" r="5" 
                fill={selectedOrgan === 'limbs' ? '#a855f7' : '#7e22ce'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-purple-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('limbs')}
              />
              <motion.circle 
                cx="40" cy="170" r="5" 
                fill={selectedOrgan === 'limbs' ? '#a855f7' : '#7e22ce'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-purple-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('limbs')}
              />
              <motion.circle 
                cx="60" cy="170" r="5" 
                fill={selectedOrgan === 'limbs' ? '#a855f7' : '#7e22ce'}
                className="opacity-80 cursor-pointer hover:opacity-100 hover:fill-purple-400 transition-all duration-300"
                onClick={() => setSelectedOrgan('limbs')}
              />
            </svg>
          </div>

          {/* Floating Instructions */}
          {!selectedOrgan && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 inset-x-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-center backdrop-blur-sm pointer-events-none"
            >
              <p className="text-[10px] text-blue-400 font-semibold tracking-wide flex items-center justify-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Tap nodes to scan organ analytics
              </p>
            </motion.div>
          )}
        </div>

        {/* Selected Organ Diagnostics Pane */}
        <div className="h-full flex flex-col justify-center min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeOrgan ? (
              <motion.div
                key={selectedOrgan}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Organ Header */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl">
                    <activeOrgan.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{activeOrgan.name}</h3>
                    <p className={`text-xs font-bold ${activeOrgan.statusColor} uppercase tracking-wider`}>
                      {activeOrgan.status}
                    </p>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {activeOrgan.telemetry.map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/30 border border-slate-800 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {t.label}
                      </p>
                      <p className="text-xs font-bold text-slate-100">{t.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      AI Wellness Actions
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeOrgan.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedOrgan(null)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1.5 hover:bg-slate-800/30 border border-transparent hover:border-slate-800 rounded-xl transition-all"
                >
                  Deselect Node
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center p-6 space-y-4 h-full"
              >
                <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-full">
                  <Activity className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Select Organ System</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Hover and select hotspots on the twin (e.g. Brain, Heart, Lungs) to review synced clinical sensor reports.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

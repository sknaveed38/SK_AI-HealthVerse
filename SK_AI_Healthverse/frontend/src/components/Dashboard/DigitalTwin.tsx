import { motion } from 'framer-motion';

export function DigitalTwin({ risks }: { risks: any[] }) {
  const hasHighRisk = risks.some(r => r.score > 0.6);

  return (
    <div className="relative w-full h-80 bg-slate-950/20 rounded-3xl border border-slate-800/50 overflow-hidden flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
      
      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent z-10 opacity-50"
      />

      {/* Stylized Human SVG */}
      <div className="relative h-64 w-32">
        <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          {/* Head */}
          <motion.circle 
            cx="50" cy="20" r="15" 
            fill={hasHighRisk ? '#ef4444' : '#3b82f6'} 
            className="opacity-20"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Torso */}
          <motion.path 
            d="M35 40 L65 40 L75 120 L25 120 Z" 
            fill={hasHighRisk ? '#ef4444' : '#3b82f6'} 
            className="opacity-20"
          />
          {/* Heart Glow */}
          <motion.circle 
            cx="55" cy="65" r="5" 
            fill="#ef4444"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          {/* Outline */}
          <path 
            d="M50 5 C58 5 65 12 65 20 C65 28 58 35 50 35 C42 35 35 28 35 20 C35 12 42 5 50 5 M35 40 L65 40 M65 40 L80 110 L70 115 L60 70 L65 130 L65 190 L55 190 L55 140 L45 140 L45 190 L35 190 L35 130 L40 70 L30 115 L20 110 L35 40" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
        </svg>
      </div>

      {/* Floating Status Cards */}
      <div className="absolute top-6 left-6 text-left">
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Status</p>
        <p className="text-sm font-bold text-white uppercase tracking-tight">Optimal Sync</p>
      </div>

      <div className="absolute bottom-6 right-6 text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${hasHighRisk ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Node: US-E</p>
        </div>
        <p className="text-[10px] font-mono text-slate-500 tracking-tighter">COORD: 34.0522° N, 118.2437° W</p>
      </div>

      {/* Center Shield */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="w-56 h-56 border border-blue-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>
    </div>
  );
}

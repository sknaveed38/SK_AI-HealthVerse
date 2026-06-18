
export interface Vitals {
  patient_id: string;
  timestamp: string;
  heart_rate: number;
  steps: number;
  oxygen_level: number;
  calories: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  global_id: string;
  profile_image?: string;
  location?: string;
  medical_history: string[];
  medications: string[];
  allergies: string[];
  family_history: string[];
  lifestyle: {
    smoking: string;
    alcohol: string;
    exercise: string;
  };
  blood_markers: any;
}

export interface Risk {
  category: string;
  score: number;
  trend: string;
  recommendation: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  type: string;
  message: string;
  timestamp: string;
}

export function Sparkline({ data, color }: { data: number[], color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatCard({ icon, label, value, unit, trend, status, history }: any) {
  const statusColors: any = {
    good: "text-green-500 bg-green-500/10",
    normal: "text-blue-500 bg-blue-500/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    critical: "text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
  };

  return (
    <div className={`bg-slate-900 p-6 rounded-2xl border ${status === 'critical' ? 'border-red-500/50' : 'border-slate-800'} glass-card metric-card-hover group transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${statusColors[status] || statusColors.normal} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold ${status === 'critical' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'} px-2 py-1 rounded-full block mb-2`}>{trend}</span>
          {history && history.length > 0 && <Sparkline data={history} color={status === 'critical' ? '#ef4444' : '#3b82f6'} />}
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tracking-tight ${status === 'critical' ? 'text-red-500' : ''}`}>{value}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export function RiskItem({ label, risk, color }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-800">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{risk}</span>
    </div>
  );
}

export function BloodWorkVisualizer({ markers }: { markers: any }) {
  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
      {Object.values(markers).map((marker: any, i: number) => {
        const isHigh = marker.value > marker.max;
        const isLow = marker.value < marker.min;
        const status = isHigh ? 'high' : isLow ? 'low' : 'normal';
        const percentage = Math.min(100, (marker.value / (marker.max * 1.2)) * 100);
        
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300">{marker.name}</span>
              <span className={isHigh || isLow ? 'text-red-400' : 'text-green-400'}>
                {marker.value} {marker.unit} ({status.toUpperCase()})
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/50">
              <div 
                className={`h-full transition-all duration-1000 ${isHigh || isLow ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`}
                style={{ width: `${percentage}%` }}
              />
              {/* Range Markers */}
              <div className="absolute top-0 bottom-0 border-l border-slate-500/30" style={{ left: `${(marker.min / (marker.max * 1.2)) * 100}%` }} />
              <div className="absolute top-0 bottom-0 border-l border-slate-500/30" style={{ left: `${(marker.max / (marker.max * 1.2)) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{marker.min}</span>
              <span>Ref Range</span>
              <span>{marker.max}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, Thermometer, Shield, User, 
  Upload, MessageSquare, Send, Mic, MicOff, Loader2, 
  ArrowRight, LayoutDashboard, FileText, Settings, 
  LogOut, Apple, Brain, Zap, Bell, Volume2, VolumeX
} from 'lucide-react';
import { StatCard, BloodWorkVisualizer } from './DashboardComponents';
import { RecordsView } from '../Records/RecordsView';
import { ProfileView } from '../Profile/ProfileView';
import { SymptomChecker } from '../AI/SymptomChecker';
import { NutritionAI } from '../AI/NutritionAI';
import { MentalHealthAI } from '../AI/MentalHealthAI';
import { DigitalTwin } from './DigitalTwin';
import { VitalHistoryChart } from './VitalHistoryChart';
import { SmartMedicineCabinet } from './SmartMedicineCabinet';
import { HealthImpactSimulator } from './HealthImpactSimulator';
import { AppointmentScheduler } from './AppointmentScheduler';
import { useHealthData } from '../../hooks/useHealthData';

export function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const patientId = user?.patient_id || 'P124';
  const { 
    patient, vitals, alerts, vitalsHistory, healthPlan, loading 
  } = useHealthData(patientId);
  
  const [localPatient, setLocalPatient] = useState(patient);
  useEffect(() => { setLocalPatient(patient); }, [patient]);

  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'nutrition' | 'wellness' | 'records' | 'profile'>('overview');
  
  const [reportMarkers, setReportMarkers] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (event: any) => {
        setChatMessage(event.results[0][0].transcript);
        setIsListening(false);
      };
    }
  }, []);

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setChatMessage("");
    setIsChatting(true);
    try {
      const res = await fetch(`/api/chat?message=${encodeURIComponent(msg)}&patient_id=${patientId}`, { method: 'POST' });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Connection error." }]);
    } finally { setIsChatting(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/analyze?patient_id=${patientId}`, { method: 'POST', body: formData });
      const data = await res.json();
      setReportMarkers(data.markers);
    } catch {
      console.error("Upload error");
    } finally { setIsChatting(false); }
    };

    if (loading || !localPatient) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <Shield className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Syncing Medical Profile</h2>
          <p className="text-slate-500 text-sm animate-pulse uppercase tracking-widest font-bold">Connecting to Healthverse Global Nodes</p>
        </div>
      </div>
    );
    }

    return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex overflow-hidden">

      <aside className="w-72 bg-slate-900/50 backdrop-blur-2xl border-r border-slate-800 p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter">HEALTHVERSE<span className="text-blue-500">.AI</span></span>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarLink icon={<LayoutDashboard />} label="Executive Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarLink icon={<Activity />} label="AI Diagnostics" active={activeTab === 'diagnostics'} onClick={() => setActiveTab('diagnostics')} />
          <SidebarLink icon={<Apple />} label="Nutrition Hub" active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} />
          <SidebarLink icon={<Brain />} label="Mind Wellness" active={activeTab === 'wellness'} onClick={() => setActiveTab('wellness')} />
          <SidebarLink icon={<FileText />} label="Medical Records" active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
          <SidebarLink icon={<User />} label="My Bio-Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
              {localPatient?.profile_image ? <img src={localPatient.profile_image} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name || "Dr. User"}</p>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{patientId}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Secure Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-10 bg-slate-950/20 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h1>
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Global Sync Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all relative">
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />}
            </button>
            <button className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard icon={<Heart className="text-red-500" />} label="Avg Heart Rate" value={vitals?.heart_rate || "--"} unit="BPM" trend="Optimal" status={(vitals?.heart_rate || 0) > 90 ? 'warning' : 'good'} />
                  <StatCard icon={<Zap className="text-blue-500" />} label="Activity Pulse" value={vitals?.steps.toLocaleString() || "--"} unit="Steps" trend="+12%" status="normal" />
                  <StatCard icon={<Thermometer className="text-orange-500" />} label="Oxygen Saturation" value={vitals?.oxygen_level || "--"} unit="%" trend="Stable" status="good" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
                    <div className="flex justify-between items-center mb-8">
                      <div><h2 className="text-xl font-bold">Health Digital Twin</h2><p className="text-xs text-slate-500">Real-time Biometric Visualization</p></div>
                      <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-lg border border-blue-500/20 uppercase">3D Model</span>
                    </div>
                    <DigitalTwin />
                  </div>
                  <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-green-500 w-5 h-5" /> Optimized Plan</h2>
                    <div className="space-y-4">
                      {healthPlan.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 flex items-center gap-4 group hover:bg-blue-600/5 transition-all">
                          <div className="w-6 h-6 rounded-lg border-2 border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors">{item.completed && <Activity className="w-3 h-3 text-blue-500" />}</div>
                          <span className="text-sm font-medium text-slate-300">{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <SmartMedicineCabinet patient={localPatient} onUpdate={setLocalPatient} />
                  <AppointmentScheduler patientId={patientId} />
                </div>

                <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
                  <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Vitals Trend Analysis</h2></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Heart Rate History</p><VitalHistoryChart data={vitalsHistory} dataKey="heart_rate" color="#ef4444" /></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Step Count Progression</p><VitalHistoryChart data={vitalsHistory} dataKey="steps" color="#3b82f6" /></div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'diagnostics' && (
              <motion.div key="diagnostics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                <SymptomChecker patientId={patientId} />
                <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card flex flex-col">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Upload className="text-purple-500" /> Report Analyzer</h2>
                  <label className="flex-1 border-2 border-dashed border-slate-700/50 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer group">
                    <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.png" />
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{isAnalyzing ? <Loader2 className="w-10 h-10 text-blue-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-500" />}</div>
                    <p className="font-bold text-slate-300">Drop Medical Report</p>
                    <p className="text-xs text-slate-500 mt-2 text-center uppercase tracking-widest">PDF, JPG, PNG up to 10MB</p>
                  </label>
                  {reportMarkers && <BloodWorkVisualizer markers={reportMarkers} />}
                </div>
              </motion.div>
            )}
            {activeTab === 'nutrition' && <motion.div key="nutrition" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto h-full"><NutritionAI patientId={patientId} /></motion.div>}
            {activeTab === 'wellness' && <motion.div key="wellness" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto h-full"><MentalHealthAI patientId={patientId} /></motion.div>}
            {activeTab === 'records' && <RecordsView key="records" patient={localPatient} onUpdate={setLocalPatient} onBack={() => setActiveTab('overview')} />}
            {activeTab === 'profile' && <ProfileView key="profile" patient={localPatient} onUpdate={setLocalPatient} onBack={() => setActiveTab('overview')} />}
          </AnimatePresence>
        </div>

        <div className="fixed bottom-10 right-10 z-[100]">
          <AIChatOverlay history={chatHistory} message={chatMessage} setMessage={setChatMessage} isChatting={isChatting} isListening={isListening} toggleListening={() => setIsListening(!isListening)} onSend={handleChat} />
        </div>
      </main>

      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function AIChatOverlay({ history, message, setMessage, isChatting, isListening, toggleListening, onSend }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (history.length > 0 && !isMuted && isOpen) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'ai') {
        const cleanText = lastMsg.content.replace(/[\*\#\_`\-]/g, ''); // Strip simple markdown characters
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [history, isMuted, isOpen]);

  useEffect(() => {
    if (isMuted || !isOpen) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted, isOpen]);

  return (
    <div className="flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-96 h-[600px] bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden glass-card">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-600">
              <div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-xl"><MessageSquare className="w-5 h-5 text-white" /></div><div><h3 className="font-bold text-white leading-none mb-1">Health Assistant</h3><p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">24/7 Clinical AI</p></div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                  {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors"><ArrowRight className="w-5 h-5 rotate-90" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/50">
              {history.length === 0 && <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-sm text-slate-300">Hello! I'm your AI health partner. I can help analyze symptoms, explain medications, or discuss your latest vitals.</div>}
              {history.map((h: any, i: number) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl ${h.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}><p className="text-sm leading-relaxed whitespace-pre-wrap">{h.content}</p></div></div>
              ))}
              {isChatting && <div className="flex justify-start"><div className="bg-slate-800 p-3 rounded-xl animate-pulse"><Loader2 className="w-4 h-4 text-slate-500 animate-spin" /></div></div>}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 px-3 focus-within:border-blue-500 transition-colors">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()} placeholder={isListening ? "Listening..." : "Ask your assistant..."} className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2" />
                <button onClick={toggleListening} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-slate-500 hover:text-white'}`}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                <button onClick={onSend} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/20"><Send className="w-4 h-4 text-white" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className={`p-5 rounded-3xl shadow-2xl transition-all flex items-center gap-3 font-bold border ${isOpen ? 'bg-slate-900 border-slate-800 text-white' : 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40'}`}>
        <MessageSquare className="w-6 h-6" />
        {isOpen ? 'Minimize Assistant' : 'AI Support Online'}
      </motion.button>
    </div>
  );
}

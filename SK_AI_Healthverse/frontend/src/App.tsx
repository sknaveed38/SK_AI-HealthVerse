import React, { useState, useEffect, useRef } from 'react';
import { Heart, Activity, Thermometer, User, Shield, MessageSquare, Upload, AlertCircle, Send, Loader2, Mic, MicOff, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { Vitals, Patient, Risk, Alert } from './components/Dashboard/DashboardComponents';

// ... (interfaces remain same)

function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [healthPlan, setHealthPlan] = useState<{task: string, completed: boolean}[]>([]);
  //const [, setSimulationResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'profile' | 'records'>('dashboard');
  const [reportAnalysis, setReportAnalysis] = useState<string | null>(null);
  const [heartAnalysis, setHeartAnalysis] = useState<any | null>(null);
  const [reportMarkers, setReportMarkers] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingHeart, setIsAnalyzingHeart] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Fetch Initial Patient Data
    // We map 'admin' to P123, others will have their own IDs in a real app
    const patientId = user?.email === 'admin@healthverse.ai' ? 'P123' : 'P124';
    
    /*fetch(`/api/patient/${patientId}`)
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error("Error fetching patient:", err));*/

      fetch(`/api/patient/${patientId}`)
  .then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    return res.json();
  })
  .then((data) => setPatient(data))
  .catch((err) => console.error(err));

    // Fetch Vitals
    const fetchVitals = () => {
      fetch(`/api/vitals/${patientId}`)
        .then(res => res.json())
        .then(data => setVitals(data))
        .catch(err => console.error("Error fetching vitals:", err));
    };

    // Fetch Risks
    const fetchRisks = () => {
      fetch(`/api/risk/${patientId}`)
        .then(res => res.json())
        .then(data => setRisks(data))
        .catch(err => console.error("Error fetching risks:", err));
    };

    // Fetch Alerts
    const fetchAlerts = () => {
      fetch(`/api/alerts/${patientId}`)
        .then(res => res.json())
        .then(data => setAlerts(data))
        .catch(err => console.error("Error fetching alerts:", err));
    };

    // Fetch History
    const fetchHistory = () => {
      fetch(`/api/vitals/${patientId}/history`)
        .then(res => res.json())
        .then(data => setVitalsHistory(data))
        .catch(err => console.error("Error fetching history:", err));
    };

    // Fetch Health Plan
    const fetchHealthPlan = () => {
      fetch(`/api/health-plan/${patientId}`)
        .then(res => res.json())
        .then(data => setHealthPlan(data))
        .catch(err => console.error("Error fetching health plan:", err));
    };

    fetchVitals();
    fetchRisks();
    fetchAlerts();
    fetchHistory();
    fetchHealthPlan();
    const interval = setInterval(() => {
      fetchVitals();
      fetchRisks();
      fetchAlerts();
    }, 10000); // Update every 10s

    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setReportAnalysis("AI is analyzing your report... Extracting Glucose, Cholesterol, and Hemoglobin levels.");

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setReportAnalysis(data.report.analysis_summary);
      setReportMarkers(data.markers);
      
      // Refresh patient and risks to reflect new markers
      fetch('/api/patient/P123').then(res => res.json()).then(p => setPatient(p));
      fetch('/api/risk/P123').then(res => res.json()).then(r => setRisks(r));
    } catch (error) {
      setReportAnalysis("Error analyzing report. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHeartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingHeart(true);
    setHeartAnalysis({ prediction: "Analyzing Heart Image...", explanation: "AI is processing the image patterns." });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze-heart', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setHeartAnalysis(data);
      
      // Update chat history with analysis result for the chatbot to explain
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: `**Heart Diagnostic Result:** ${data.prediction}\n\n${data.explanation}\n\nConfidence: ${(data.confidence * 100).toFixed(2)}%` 
      }]);
    } catch (error) {
      setHeartAnalysis({ prediction: "Error", explanation: "Failed to analyze heart image." });
    } finally {
      setIsAnalyzingHeart(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage("");
    setIsChatting(true);

    try {
      const patientId = user?.email === 'admin@healthverse.ai' ? 'P123' : 'P124';
      const response = await fetch(`/api/chat?message=${encodeURIComponent(userMsg)}&patient_id=${patientId}`, {
        method: 'POST',
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsChatting(false);
    }
  };

  /*const handleSimulate = async (changes: any) => {
    try {
      const patientId = user?.email === 'sknaveedsk20@gmail.com' ? 'P123' : 'P124';
      const response = await fetch(`/api/simulate/${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      setSimulationResult(data);
    } catch (error) {
      console.error("Simulation error:", error);
    }
  };*/

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SK_AI HealthVerse</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`${activeView === 'dashboard' ? 'text-white' : 'text-slate-400'} hover:text-white transition-colors font-medium`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('records')}
            className={`${activeView === 'records' ? 'text-white' : 'text-slate-400'} hover:text-white transition-colors font-medium`}
          >
            Records
          </button>
          <div 
            className={`flex items-center gap-3 bg-slate-800/50 py-1 px-3 rounded-full border ${activeView === 'profile' ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700'} transition-all`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{user?.name || "Loading..."}</p>
              <p className="text-[10px] text-slate-500">{user?.email === 'admin@healthverse.ai' ? 'P123' : 'P124'}</p>
            </div>
            <button 
              onClick={() => setActiveView('profile')}
              className={`w-8 h-8 ${activeView === 'profile' ? 'bg-blue-600' : 'bg-slate-800'} rounded-full flex items-center justify-center border border-slate-600 transition-colors overflow-hidden`}
            >
              {patient?.profile_image ? (
                <img src={patient.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg"
            title="Logout"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </nav>

      {/* Emergency SOS Banner */}
      {alerts.some(a => a.type === 'CRITICAL') && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between animate-pulse sticky top-[73px] z-40 shadow-lg shadow-red-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold text-sm">EMERGENCY ALERT DETECTED</p>
              <p className="text-xs opacity-90">{alerts.find(a => a.type === 'CRITICAL')?.message}</p>
            </div>
          </div>
          <button className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 hover:scale-105 transition-all">
            CONTACT DOCTOR
          </button>
        </div>
      )}

      {activeView === 'dashboard' ? (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          
          {/* Left Column: Vitals & Digital Twin */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" /> Live Health Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                  icon={<Heart className="text-red-500" />} 
                  label="Heart Rate" 
                  value={vitals?.heart_rate || "--"} 
                  unit="BPM" 
                  trend="+2%" 
                  status={alerts.some(a => a.message.includes('Heart Rate') && a.type === 'CRITICAL') ? 'critical' : vitals?.heart_rate && vitals.heart_rate > 90 ? 'warning' : 'normal'} 
                  history={vitalsHistory.map(h => h.heart_rate)}
                />
                <StatCard 
                  icon={<Activity className="text-blue-500" />} 
                  label="Steps" 
                  value={vitals?.steps.toLocaleString() || "--"} 
                  unit="steps" 
                  trend="+15%" 
                  status="good" 
                  history={vitalsHistory.map(h => h.steps)}
                />
                <StatCard 
                  icon={<Thermometer className="text-orange-500" />} 
                  label="Oxygen" 
                  value={vitals?.oxygen_level || "--"} 
                  unit="%" 
                  trend="0%" 
                  status={alerts.some(a => a.message.includes('Oxygen') && a.type === 'CRITICAL') ? 'critical' : 'normal'} 
                  history={vitalsHistory.map(h => h.oxygen_level)}
                />
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 relative overflow-hidden glass-card">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-green-500/10 text-green-500 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">GLOBAL SYNC ACTIVE</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Health Digital Twin</h2>
              <p className="text-slate-400 mb-8 max-w-md">Your personalized health profile is synchronized globally across Amazon Aurora DSQL nodes.</p>
              <div className="h-64 bg-slate-800/30 rounded-2xl flex items-center justify-center border border-slate-700/50 relative overflow-hidden">
                <div className="scan-line"></div>
                <div className="digital-twin-orb">
                  <Shield className="w-16 h-16 text-blue-500/40" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>COORD: 34.0522° N, 118.2437° W</span>
                  <span>STATUS: STABLE</span>
                  <span>NODE: DSQL-PRIMARY-US-EAST</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 glass-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="text-green-500 w-5 h-5" /> AI Daily Health Plan
                </h3>
                <div className="space-y-3">
                  {healthPlan.length > 0 ? healthPlan.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-800/50 group hover:bg-slate-800/50 transition-colors">
                      <div className={`w-5 h-5 rounded-md border ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-600'} flex items-center justify-center`}>
                        {item.completed && <Activity className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.task}</span>
                    </div>
                  )) : (
                    <div className="p-4 text-center">
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Generating personalized plan...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 glass-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="text-red-500 w-5 h-5" /> Heart Image Diagnostic (HF)
                </h3>
                <label className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-red-500 transition-colors cursor-pointer block mb-4">
                  <input type="file" className="hidden" onChange={handleHeartUpload} accept="image/*" />
                  {isAnalyzingHeart ? (
                    <Loader2 className="w-10 h-10 text-red-500 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-slate-400">{isAnalyzingHeart ? "Detecting..." : "Upload Heart Scan/Image"}</p>
                </label>
                
                {heartAnalysis && (
                  <div className={`p-4 rounded-xl border ${heartAnalysis.prediction?.includes('Detected') ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <p className={`font-bold text-sm mb-1 ${heartAnalysis.prediction?.includes('Detected') ? 'text-red-400' : 'text-green-400'}`}>
                      {heartAnalysis.prediction}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{heartAnalysis.explanation}</p>
                    {heartAnalysis.confidence && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${heartAnalysis.prediction?.includes('Detected') ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${heartAnalysis.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{(heartAnalysis.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 glass-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="text-purple-500 w-5 h-5" /> Medical Report Analyzer
                </h3>
                <label className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer block">
                  <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.png" />
                  {isAnalyzing ? (
                    <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-slate-400">{isAnalyzing ? "Processing..." : "Click to upload medical report"}</p>
                </label>
                
                {reportMarkers && <BloodWorkVisualizer markers={reportMarkers} />}

                {reportAnalysis && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-200">{reportAnalysis}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 glass-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-500 w-5 h-5" /> Predictive Risk Detection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {risks.length > 0 ? risks.map((risk, i) => (
                    <div key={i} className="p-4 bg-slate-800/30 rounded-xl border border-slate-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-300">{risk.category}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${risk.score < 0.3 ? 'bg-green-500/10 text-green-500' : risk.score < 0.6 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                          {risk.score < 0.3 ? 'LOW' : risk.score < 0.6 ? 'MODERATE' : 'HIGH'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full transition-all duration-1000 ${risk.score < 0.3 ? 'bg-green-500' : risk.score < 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${risk.score * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 italic">{risk.recommendation}</p>
                    </div>
                  )) : (
                    <div className="col-span-3 p-4 text-center">
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Calculating risks...</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: AI Assistant Chat */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col h-[calc(100vh-120px)] sticky top-24">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">SK_AI Health Assistant</h3>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[85%]">
                <p className="text-sm">Hello! I'm your AI health assistant. I can analyze your symptoms or explain your medical reports. How are you feeling today?</p>
              </div>
              
              {chatHistory.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'bg-blue-600 ml-auto rounded-tr-none' : 'bg-slate-800 rounded-tl-none border border-slate-700'} p-4 rounded-2xl max-w-[85%] shadow-lg`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split('\n').map((line, j) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={j} className="font-bold text-blue-400 mb-1">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.includes('**')) {
                        // Simple regex to handle inline bolding
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={j} className="mb-2">
                            {parts.map((part, k) => 
                              part.startsWith('**') ? <strong key={k} className="text-blue-300">{part.replace(/\*\*/g, '')}</strong> : part
                            )}
                          </p>
                        );
                      }
                      return <p key={j} className="mb-2">{line}</p>;
                    })}
                  </div>
                </div>
              ))}
              
              {isChatting && (
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] border border-slate-700">
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 rounded-b-3xl">
              <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="relative flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask anything about your health..."}
                    className={`w-full bg-slate-800 border ${isListening ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'} rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm`}
                  />
                  <button 
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 top-1.5 p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-white'}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button 
                  type="submit"
                  className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  disabled={isChatting}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-widest font-semibold">Protected by Amazon Aurora DSQL</p>
            </div>
          </div>

        </main>
      ) : activeView === 'records' ? (
        <RecordsView 
          patient={patient} 
          onUpdate={(updatedPatient) => setPatient(updatedPatient)} 
          onBack={() => setActiveView('dashboard')} 
        />
      ) : (
        <ProfileView 
          patient={patient} 
          onUpdate={(updatedPatient) => setPatient(updatedPatient)} 
          onBack={() => setActiveView('dashboard')} 
        />
      )}
    </div>
  );
}

function RecordsView({ patient, onUpdate, onBack }: { patient: Patient | null, onUpdate: (data: Patient) => void, onBack: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(patient);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedPatient(patient);
  }, [patient]);

  if (!patient || !editedPatient) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/patient/P123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPatient),
      });
      const data = await response.json();
      onUpdate(data.patient);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving records:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addListItem = (field: keyof Patient) => {
    const currentList = (editedPatient[field] as string[]) || [];
    setEditedPatient({ ...editedPatient, [field]: [...currentList, ""] });
  };

  const updateListItem = (field: keyof Patient, index: number, value: string) => {
    const newList = [...((editedPatient[field] as string[]) || [])];
    newList[index] = value;
    setEditedPatient({ ...editedPatient, [field]: newList });
  };

  const removeListItem = (field: keyof Patient, index: number) => {
    const newList = ((editedPatient[field] as string[]) || []).filter((_, i) => i !== index);
    setEditedPatient({ ...editedPatient, [field]: newList });
  };

  return (
    <main className="max-w-5xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <Shield className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setEditedPatient(patient); }} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Records
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20">Edit Records</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RecordSection title="Medical History" icon={<Activity className="text-blue-500" />}>
          <ListEditor 
            items={editedPatient.medical_history || []} 
            isEditing={isEditing} 
            onAdd={() => addListItem('medical_history')} 
            onUpdate={(i: number, v: string) => updateListItem('medical_history', i, v)}
            onRemove={(i: number) => removeListItem('medical_history', i)}
            placeholder="e.g. Hypertension, Diabetes"
          />
        </RecordSection>

        <RecordSection title="Current Medications" icon={<Shield className="text-purple-500" />}>
          <ListEditor 
            items={editedPatient.medications || []} 
            isEditing={isEditing} 
            onAdd={() => addListItem('medications')} 
            onUpdate={(i: number, v: string) => updateListItem('medications', i, v)}
            onRemove={(i: number) => removeListItem('medications', i)}
            placeholder="e.g. Metformin 500mg"
          />
        </RecordSection>

        <RecordSection title="Allergies" icon={<AlertCircle className="text-red-500" />}>
          <ListEditor 
            items={editedPatient.allergies || []} 
            isEditing={isEditing} 
            onAdd={() => addListItem('allergies')} 
            onUpdate={(i: number, v: string) => updateListItem('allergies', i, v)}
            onRemove={(i: number) => removeListItem('allergies', i)}
            placeholder="e.g. Peanuts, Penicillin"
          />
        </RecordSection>

        <RecordSection title="Lifestyle & Habits" icon={<Heart className="text-green-500" />}>
          <div className="space-y-4 mt-4">
            <LifestyleItem 
              label="Smoking Status" 
              value={editedPatient.lifestyle?.smoking || ""} 
              isEditing={isEditing} 
              options={["Never", "Former", "Occasional", "Frequent"]}
              onChange={(v: string) => setEditedPatient({...editedPatient, lifestyle: {...editedPatient.lifestyle!, smoking: v}})}
            />
            <LifestyleItem 
              label="Alcohol Consumption" 
              value={editedPatient.lifestyle?.alcohol || ""} 
              isEditing={isEditing} 
              options={["None", "Occasional", "Moderate", "High"]}
              onChange={(v: string) => setEditedPatient({...editedPatient, lifestyle: {...editedPatient.lifestyle!, alcohol: v}})}
            />
            <LifestyleItem 
              label="Exercise Level" 
              value={editedPatient.lifestyle?.exercise || ""} 
              isEditing={isEditing} 
              options={["Sedentary", "Light", "Moderate", "Active"]}
              onChange={(v: string) => setEditedPatient({...editedPatient, lifestyle: {...editedPatient.lifestyle!, exercise: v}})}
            />
          </div>
        </RecordSection>
      </div>
    </main>
  );
}

function RecordSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 glass-card">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ListEditor({ items, isEditing, onAdd, onUpdate, onRemove, placeholder }: any) {
  return (
    <div className="space-y-2 mt-2">
      {items.map((item: string, index: number) => (
        <div key={index} className="flex gap-2">
          {isEditing ? (
            <>
              <input 
                type="text" 
                value={item} 
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button onClick={() => onRemove(index)} className="text-slate-500 hover:text-red-500 p-1">
                <AlertCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1 text-sm text-slate-300 w-full">
              {item}
            </div>
          )}
        </div>
      ))}
      {isEditing && (
        <button onClick={onAdd} className="text-xs text-blue-500 hover:text-blue-400 font-bold mt-2 flex items-center gap-1">
          + Add Item
        </button>
      )}
      {!isEditing && items.length === 0 && (
        <p className="text-sm text-slate-500 italic">No records added.</p>
      )}
    </div>
  );
}

function LifestyleItem({ label, value, isEditing, options, onChange }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      {isEditing ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
        >
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <span className="text-sm font-medium text-slate-200">{value}</span>
      )}
    </div>
  );
}

function ProfileView({ patient, onUpdate, onBack }: { patient: Patient | null, onUpdate: (data: Patient) => void, onBack: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(patient);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedPatient(patient);
  }, [patient]);

  if (!patient || !editedPatient) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/patient/P123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPatient),
      });
      const data = await response.json();
      onUpdate(data.patient);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/patient/P123/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setEditedPatient({ ...editedPatient, profile_image: data.image_url });
      // Also update main patient data immediately if not in edit mode, or just wait for save?
      // Better to update main state so it reflects everywhere
      const updatedPatient = { ...patient, profile_image: data.image_url };
      onUpdate(updatedPatient);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <Shield className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden glass-card">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-slate-800 rounded-3xl border-4 border-slate-900 flex items-center justify-center shadow-xl overflow-hidden">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : editedPatient.profile_image ? (
                  <img src={editedPatient.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageUpload} 
                accept="image/*"
              />
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1 mr-4">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editedPatient.name}
                  onChange={(e) => setEditedPatient({...editedPatient, name: e.target.value})}
                  className="text-3xl font-bold bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h1 className="text-3xl font-bold mb-1">{patient.name}</h1>
              )}
              <p className="text-slate-400 flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {patient.global_id}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  Export Passport
                </button>
              )}
              {isEditing ? (
                <>
                  <button 
                    onClick={() => { setIsEditing(false); setEditedPatient(patient); }}
                    className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <EditInfoItem 
                  label="Age" 
                  value={editedPatient.age} 
                  isEditing={isEditing} 
                  type="number"
                  onChange={(val) => setEditedPatient({...editedPatient, age: parseInt(val) || 0})}
                />
                <EditInfoItem 
                  label="Gender" 
                  value={editedPatient.gender} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient, gender: val})}
                />
                <EditInfoItem 
                  label="Blood Group" 
                  value={editedPatient.blood_group} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient, blood_group: val})}
                />
                <EditInfoItem 
                  label="Location" 
                  value={editedPatient.location || "Los Angeles, CA"} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient, location: val})}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b border-slate-800 pb-2">Medical Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Last Checkup" value="2 weeks ago" />
                <InfoItem label="Active Risks" value="1 Moderate" />
                <InfoItem label="Sync Status" value="Global Active" />
                <InfoItem label="Data Node" value="US-EAST-1" />
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-600/5 rounded-2xl border border-blue-500/10 flex items-center gap-4">
            <div className="bg-blue-600/20 p-3 rounded-xl">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-100">DSQL Multi-Region Consistency</h4>
              <p className="text-sm text-slate-400">Your health data is replicated with full ACID compliance across the global network.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function EditInfoItem({ label, value, isEditing, onChange, type = "text" }: { label: string, value: any, isEditing: boolean, onChange: (val: string) => void, type?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <p className="text-lg font-medium text-slate-200">{value}</p>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
      <p className="text-lg font-medium text-slate-200">{value}</p>
    </div>
  );
}


function Sparkline({ data, color }: { data: number[], color: string }) {
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

function BloodWorkVisualizer({ markers }: { markers: any }) {
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

function StatCard({ icon, label, value, unit, trend, status, history }: any) {
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

/*function RiskItem({ label, risk, color }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-800">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{risk}</span>
    </div>
  );
}*/

function LoginPage({ onLogin }: { onLogin: (data: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch('/api/login', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Invalid email or password');

        const data = await response.json();
        localStorage.setItem('health_token', data.access_token);
        localStorage.setItem('health_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password, name }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Registration failed');
        }

        setSuccess('Account created! Please sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-xl relative">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-blue-600/20 to-blue-500/5 rounded-3xl mb-6 ring-1 ring-blue-500/30 shadow-xl shadow-blue-500/10">
              <Heart className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">AI HealthVerse</h1>
            <p className="text-slate-400 text-lg">Your Personal AI Healthcare Companion</p>
          </div>

          <div className="flex p-1 bg-slate-950/50 rounded-2xl mb-8 border border-slate-800/50">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm animate-in fade-in slide-in-from-top-2">
              <Shield className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Shaik Naveed"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@healthverse.ai"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                {isLogin && <button type="button" className="text-sm text-blue-500 hover:text-blue-400 transition-colors font-medium">Forgot Password?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] text-lg"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In to Dashboard' : 'Create Your Account'}
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50 flex flex-col items-center gap-4">
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" /> Biometric-Grade 256-bit Encryption
            </p>
            {!isLogin && (
              <p className="text-slate-400 text-sm">
                Already have an account? <button onClick={() => setIsLogin(true)} className="text-blue-500 font-bold hover:underline">Sign In</button>
              </p>
            )}
            {isLogin && (
              <p className="text-slate-400 text-sm">
                New to HealthVerse? <button onClick={() => setIsLogin(false)} className="text-blue-500 font-bold hover:underline">Sign Up Free</button>
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-4 rounded-2xl text-center">
            <p className="text-blue-500 font-bold text-lg">99.9%</p>
            <p className="text-slate-500 text-xs">Uptime Guarantee</p>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-4 rounded-2xl text-center">
            <p className="text-red-500 font-bold text-lg">AI Ready</p>
            <p className="text-slate-500 text-xs">Hugging Face Models</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <Dashboard onLogout={onLogout} user={user} />
  );
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('health_token');
    const savedUser = localStorage.getItem('health_user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <MainApp user={user} onLogout={handleLogout} />;
};

export default App;

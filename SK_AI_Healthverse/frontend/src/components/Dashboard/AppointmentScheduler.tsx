import { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2 } from 'lucide-react';

export function AppointmentScheduler({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApp, setNewApp] = useState({ doctor_name: '', date_time: '', reason: '' });

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments/${patientId}`);
      if (res.ok) setAppointments(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/appointments/${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
      setNewApp({ doctor_name: '', date_time: '', reason: '' });
      fetchAppointments();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 p-8 glass-card">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-blue-500" /> Appointments</h2>
      
      <form onSubmit={handleCreate} className="space-y-4 mb-8">
        <input className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700" placeholder="Doctor Name" value={newApp.doctor_name} onChange={e => setNewApp({...newApp, doctor_name: e.target.value})} />
        <input type="datetime-local" className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700" value={newApp.date_time} onChange={e => setNewApp({...newApp, date_time: e.target.value})} />
        <input className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700" placeholder="Reason" value={newApp.reason} onChange={e => setNewApp({...newApp, reason: e.target.value})} />
        <button type="submit" className="w-full bg-blue-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Schedule</button>
      </form>

      <div className="space-y-4">
        {loading ? <Loader2 className="animate-spin text-blue-500" /> : appointments.map((app, i) => (
          <div key={i} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700 flex justify-between items-center">
            <div>
              <p className="font-bold">{app.doctor_name}</p>
              <p className="text-xs text-slate-400">{new Date(app.date_time).toLocaleString()}</p>
              <p className="text-sm text-slate-300">{app.reason}</p>
            </div>
            <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-lg">{app.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

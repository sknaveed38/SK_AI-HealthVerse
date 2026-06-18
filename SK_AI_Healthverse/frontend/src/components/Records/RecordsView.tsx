import { useState, useEffect } from 'react';
import { Activity, Shield, AlertCircle, Heart, Loader2 } from 'lucide-react';
import type { Patient } from '../Dashboard/DashboardComponents';

export function RecordsView({ patient, onUpdate, onBack }: { patient: Patient | null, onUpdate: (data: Patient) => void, onBack: () => void }) {
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
      const patientId = patient.id;
      const response = await fetch(`/api/patient/${patientId}`, {
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
            items={editedPatient?.medical_history || []} 
            isEditing={isEditing} 
            onAdd={() => addListItem('medical_history')} 
            onUpdate={(i: number, v: string) => updateListItem('medical_history', i, v)}
            onRemove={(i: number) => removeListItem('medical_history', i)}
            placeholder="e.g. Hypertension, Diabetes"
          />
        </RecordSection>

        <RecordSection title="Current Medications" icon={<Shield className="text-purple-500" />}>
          <ListEditor 
            items={editedPatient?.medications || []} 
            isEditing={isEditing} 
            onAdd={() => addListItem('medications')} 
            onUpdate={(i: number, v: string) => updateListItem('medications', i, v)}
            onRemove={(i: number) => removeListItem('medications', i)}
            placeholder="e.g. Metformin 500mg"
          />
        </RecordSection>

        <RecordSection title="Allergies" icon={<AlertCircle className="text-red-500" />}>
          <ListEditor 
            items={editedPatient?.allergies || []} 
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
              value={editedPatient?.lifestyle?.smoking || ""} 
              isEditing={isEditing} 
              options={["Never", "Former", "Occasional", "Frequent"]}
              onChange={(v: string) => setEditedPatient({...editedPatient!, lifestyle: {...editedPatient!.lifestyle!, smoking: v}})}
            />
            <LifestyleItem 
              label="Alcohol Consumption" 
              value={editedPatient?.lifestyle?.alcohol || ""} 
              isEditing={isEditing} 
              options={["None", "Occasional", "Moderate", "High"]}
              onChange={(v: string) => setEditedPatient({...editedPatient!, lifestyle: {...editedPatient!.lifestyle!, alcohol: v}})}
            />
            <LifestyleItem 
              label="Exercise Level" 
              value={editedPatient?.lifestyle?.exercise || ""} 
              isEditing={isEditing} 
              options={["Sedentary", "Light", "Moderate", "Active"]}
              onChange={(v: string) => setEditedPatient({...editedPatient!, lifestyle: {...editedPatient!.lifestyle!, exercise: v}})}
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

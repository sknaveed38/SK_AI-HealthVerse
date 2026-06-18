import { useState, useEffect, useRef } from 'react';
import { User, Shield, Upload, Loader2 } from 'lucide-react';
import type { Patient } from '../Dashboard/DashboardComponents';

export function ProfileView({ patient, onUpdate, onBack }: { patient: Patient | null, onUpdate: (data: Patient) => void, onBack: () => void }) {
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
      const patientId = patient.id;
      const response = await fetch(`/api/patient/${patientId}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      const updatedWithImage = { ...editedPatient, profile_image: data.image_url };
      setEditedPatient(updatedWithImage);
      onUpdate(updatedWithImage);
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
                  value={editedPatient?.age || 0} 
                  isEditing={isEditing} 
                  type="number"
                  onChange={(val) => setEditedPatient({...editedPatient!, age: parseInt(val) || 0})}
                />
                <EditInfoItem 
                  label="Gender" 
                  value={editedPatient?.gender || ""} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient!, gender: val})}
                />
                <EditInfoItem 
                  label="Blood Group" 
                  value={editedPatient?.blood_group || ""} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient!, blood_group: val})}
                />
                <EditInfoItem 
                  label="Location" 
                  value={editedPatient?.location || "Los Angeles, CA"} 
                  isEditing={isEditing} 
                  onChange={(val) => setEditedPatient({...editedPatient!, location: val})}
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

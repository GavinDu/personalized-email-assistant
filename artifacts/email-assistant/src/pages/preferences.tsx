import React, { useState } from "react";
import { usePreferences, useCreatePreference, useUpdatePreference, useDeletePreference, type SenderPreference } from "@/hooks/use-api";
import { Plus, Trash2, Edit2, X, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/components/layout";

export default function PreferencesPage() {
  const { data: preferences, isLoading } = usePreferences();
  const { mutate: deletePref } = useDeletePreference();
  const [isEditing, setIsEditing] = useState<SenderPreference | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Sender Preferences</h1>
          <p className="text-muted-foreground text-sm">Manage how the AI handles specific senders, default tones, and actions.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Sender
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Sender</th>
                <th className="px-6 py-4 font-medium">Importance</th>
                <th className="px-6 py-4 font-medium">Default Tone</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading preferences...</td>
                </tr>
              ) : preferences?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No preferences configured.</td>
                </tr>
              ) : (
                preferences?.map((pref) => (
                  <tr key={pref.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{pref.sender_name || 'Unknown'}</div>
                      <div className="text-muted-foreground text-xs">{pref.sender_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium border",
                        pref.importance === 'high' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        pref.importance === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      )}>
                        {pref.importance}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/80 capitalize">{pref.default_tone}</td>
                    <td className="px-6 py-4 text-white/80 capitalize">{pref.default_action}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setIsEditing(pref)}
                          className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Delete this preference?')) deletePref(pref.id);
                          }}
                          className="p-1.5 hover:bg-rose-500/20 rounded-md text-rose-400/60 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || isEditing) && (
        <PreferenceModal 
          pref={isEditing} 
          onClose={() => { setIsEditing(null); setIsCreating(false); }} 
        />
      )}
    </div>
  );
}

function PreferenceModal({ pref, onClose }: { pref: SenderPreference | null, onClose: () => void }) {
  const isEdit = !!pref;
  const { mutateAsync: create } = useCreatePreference();
  const { mutateAsync: update } = useUpdatePreference();
  
  const [formData, setFormData] = useState<Partial<SenderPreference>>(pref || {
    sender_email: "",
    sender_name: "",
    importance: "medium",
    default_tone: "professional",
    default_action: "reply",
    reply_priority: "medium",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && pref) {
      await update({ id: pref.id, ...formData });
    } else {
      await create(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-white/10 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
          <h3 className="text-xl font-display font-bold text-white">
            {isEdit ? "Edit Preference" : "New Sender Preference"}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Sender Email</label>
              <input 
                required type="email" value={formData.sender_email} onChange={e => setFormData({...formData, sender_email: e.target.value})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Sender Name</label>
              <input 
                type="text" value={formData.sender_name ?? ""} onChange={e => setFormData({...formData, sender_name: e.target.value})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Importance</label>
              <select 
                value={formData.importance} onChange={e => setFormData({...formData, importance: e.target.value as SenderPreference["importance"]})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Default Tone</label>
              <select 
                value={formData.default_tone} onChange={e => setFormData({...formData, default_tone: e.target.value})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition"
              >
                <option value="professional">Professional</option>
                <option value="concise">Concise</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Action</label>
              <select 
                value={formData.default_action} onChange={e => setFormData({...formData, default_action: e.target.value})}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition"
              >
                <option value="reply">Reply</option>
                <option value="ignore">Ignore</option>
                <option value="delegate">Delegate</option>
                <option value="escalate">Escalate</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Context Notes (for AI)</label>
            <textarea 
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition h-24 resize-none"
              placeholder="e.g., Direct manager, always reply same day with short updates."
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-primary/20">
              Save Preference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

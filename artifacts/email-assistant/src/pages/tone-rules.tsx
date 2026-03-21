import React, { useState } from "react";
import { useToneRules, useCreateToneRule, useUpdateToneRule, useDeleteToneRule, type ToneRule } from "@/hooks/use-api";
import { Plus, Trash2, Edit2, X, Check, Power, PowerOff } from "lucide-react";
import { cn } from "@/components/layout";

export default function ToneRulesPage() {
  const { data: rules, isLoading } = useToneRules();
  const { mutate: deleteRule } = useDeleteToneRule();
  const { mutate: updateRule } = useUpdateToneRule();
  
  const [isEditing, setIsEditing] = useState<ToneRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toggleActive = (rule: ToneRule) => {
    updateRule({
      id: rule.id,
      name: rule.name,
      rule_type: rule.rule_type,
      value: rule.value,
      is_active: !rule.is_active,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Global Tone Rules</h1>
          <p className="text-muted-foreground text-sm">System-wide instructions applied to every AI draft generation.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-semibold text-sm transition shadow-[0_0_20px_rgba(192,132,252,0.3)] flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading && <p className="text-white">Loading rules...</p>}
        
        {/* Render columns by type */}
        {['style', 'length', 'banned_phrase'].map(type => (
          <div key={type} className="flex flex-col space-y-4">
            <h3 className="font-display font-semibold text-white/80 uppercase tracking-wide text-sm border-b border-white/10 pb-2">
              {type.replace('_', ' ')}
            </h3>
            
            {rules?.filter(r => r.rule_type === type).map(rule => (
              <div 
                key={rule.id} 
                className={cn(
                  "glass-card p-4 rounded-xl border relative group transition-all duration-300",
                  rule.is_active ? "border-white/10" : "border-white/5 opacity-50 bg-black/40"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm text-white">{rule.name}</h4>
                  <button 
                    onClick={() => toggleActive(rule)}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center transition",
                      rule.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"
                    )}
                  >
                    {rule.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  "{rule.value}"
                </p>
                
                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsEditing(rule)} className="p-1.5 hover:bg-white/10 rounded text-white/60">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if(confirm('Delete rule?')) deleteRule(rule.id) }} className="p-1.5 hover:bg-rose-500/20 rounded text-rose-400/60">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            
            {rules?.filter(r => r.rule_type === type).length === 0 && (
              <p className="text-xs text-white/30 italic">No rules of this type.</p>
            )}
          </div>
        ))}
      </div>

      {(isCreating || isEditing) && (
        <ToneRuleModal 
          rule={isEditing} 
          onClose={() => { setIsEditing(null); setIsCreating(false); }} 
        />
      )}
    </div>
  );
}

function ToneRuleModal({ rule, onClose }: { rule: ToneRule | null, onClose: () => void }) {
  const isEdit = !!rule;
  const { mutateAsync: create } = useCreateToneRule();
  const { mutateAsync: update } = useUpdateToneRule();
  
  const [formData, setFormData] = useState<Partial<ToneRule>>(rule || {
    name: "",
    rule_type: "style",
    value: "",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && rule) {
      await update({ id: rule.id, ...formData });
    } else {
      await create(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
          <h3 className="text-lg font-display font-bold text-white">
            {isEdit ? "Edit Rule" : "New Tone Rule"}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Rule Name</label>
            <input 
              required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition"
              placeholder="e.g. No generic greetings"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Type</label>
            <select 
              value={formData.rule_type} onChange={e => setFormData({...formData, rule_type: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition"
            >
              <option value="style">Style Guideline</option>
              <option value="length">Length Constraint</option>
              <option value="banned_phrase">Banned Phrase</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Instruction Prompt</label>
            <textarea 
              required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition h-24 resize-none"
              placeholder="Provide explicit instructions for the AI prompt..."
            />
          </div>

          <label className="flex items-center space-x-3 cursor-pointer mt-2">
            <input 
              type="checkbox" 
              checked={formData.is_active} 
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 rounded bg-black/30 border border-white/20 text-accent focus:ring-accent/50"
            />
            <span className="text-sm text-white/80 font-medium">Rule is active</span>
          </label>

          <div className="pt-4 flex justify-end space-x-3 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-accent/20">
              Save Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useEmails, useEmail, useGenerateDraft, useSubmitFeedback, useSeedData, type Email, type DraftOut, type SimilarEmail } from "@/hooks/use-api";
import { cn } from "@/components/layout";
import { 
  Check, Edit3, Trash2, Mail, Search, Sparkles, User, 
  Clock, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2,
  RefreshCcw, Info
} from "lucide-react";

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const { data: listData, isLoading: listLoading } = useEmails({ priority: filterPriority });
  const { mutate: seed, isPending: isSeeding } = useSeedData();

  // Auto-seed if empty
  useEffect(() => {
    if (listData?.emails && listData.emails.length === 0) {
      seed();
    }
  }, [listData, seed]);

  return (
    <div className="flex h-full w-full">
      {/* List Pane */}
      <div className="w-[400px] border-r border-white/5 flex flex-col bg-black/10 backdrop-blur-sm z-10 relative shadow-2xl">
        <div className="h-16 px-4 flex items-center border-b border-white/5 shrink-0 justify-between">
          <h2 className="font-display font-semibold text-white">Inbox</h2>
          <select 
            className="bg-transparent border border-white/10 rounded-lg text-xs px-2 py-1 text-white focus:outline-none focus:border-primary"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="" className="bg-background">All Priorities</option>
            <option value="high" className="bg-background">High Priority</option>
            <option value="medium" className="bg-background">Medium Priority</option>
            <option value="low" className="bg-background">Low Priority</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {listLoading && (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <RefreshCcw className="w-6 h-6 animate-spin mb-2" />
              Loading emails...
            </div>
          )}
          {!listLoading && listData?.emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelectedId(email.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-200 border",
                selectedId === email.id 
                  ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]" 
                  : "bg-transparent border-transparent hover:bg-white/5"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn("font-medium text-sm truncate pr-2", !email.is_read ? "text-white" : "text-white/70")}>
                  {email.sender_name}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                  {format(new Date(email.received_at), "MMM d, h:mm a")}
                </span>
              </div>
              <p className={cn("text-xs truncate mb-2.5", !email.is_read ? "text-white font-medium" : "text-muted-foreground")}>
                {email.subject}
              </p>
              
              <div className="flex flex-wrap gap-1.5">
                <Badge intent={email.intent} />
                <Badge priority={email.priority} />
                <Badge action={email.recommended_action} />
              </div>
            </button>
          ))}
          {listData?.emails.length === 0 && !listLoading && (
            <div className="text-center p-8">
              <Mail className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Inbox is empty</p>
              <button 
                onClick={() => seed()}
                disabled={isSeeding}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition"
              >
                {isSeeding ? "Seeding..." : "Load Sample Data"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
        {selectedId ? (
          <EmailDetail emailId={selectedId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-48 h-48 mb-6 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full"></div>
              <img 
                src={`${import.meta.env.BASE_URL}images/empty-inbox.png`} 
                alt="Empty Inbox" 
                className="w-full h-full object-contain relative z-10 opacity-80"
              />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Select an email</h2>
            <p className="text-muted-foreground max-w-sm">
              Review AI classifications, generate intelligent drafts, and provide feedback to improve your personalized model.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailDetail({ emailId }: { emailId: number }) {
  const { data: email, isLoading } = useEmail(emailId);
  
  if (isLoading || !email) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Email Content */}
      <div className="flex-1 border-r border-white/5 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-white/5 shrink-0 bg-black/10">
          <h2 className="text-2xl font-display font-bold text-white mb-4">{email.subject}</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {email.sender_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-white text-sm">{email.sender_name}</p>
                <p className="text-xs text-muted-foreground">{email.sender_email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">{format(new Date(email.received_at), "PPP 'at' p")}</p>
            </div>
          </div>
        </div>

        <div className="p-6 shrink-0 bg-primary/5 border-b border-primary/10">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">AI Analysis</h4>
              <p className="text-sm text-white/70 mb-3">{email.classification_notes}</p>
              <div className="flex space-x-2">
                <Badge priority={email.priority} />
                <Badge intent={email.intent} />
                <Badge action={email.recommended_action} />
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {(email.classification_confidence * 100).toFixed(0)}% Match
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans">
          {email.body}
        </div>
      </div>

      {/* Draft Panel */}
      <DraftPanel email={email} />
    </div>
  );
}

function DraftPanel({ email }: { email: Email }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState<DraftOut | null>(null);
  const [editedDraft, setEditedDraft] = useState("");
  
  const { mutateAsync: generateDraft } = useGenerateDraft();
  const { mutateAsync: submitFeedback, isPending: isSubmitting } = useSubmitFeedback();

  // Reset when email changes
  useEffect(() => {
    setDraftResult(null);
    setEditedDraft("");
  }, [email.id]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateDraft({ id: email.id });
      setDraftResult(res);
      setEditedDraft(res.draft);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = async (action: string) => {
    if (!draftResult) return;
    
    // Simple edit distance calculation
    const distance = action === "edited" ? Math.abs(editedDraft.length - draftResult.draft.length) : 0;
    
    await submitFeedback({
      id: email.id,
      user_action: action,
      final_output: editedDraft,
      tone_used: draftResult.tone_used,
      edit_distance: distance
    });
    
    // Clear draft after feedback
    setDraftResult(null);
  };

  return (
    <div className="w-[450px] flex flex-col bg-card/30 backdrop-blur-md relative shadow-2xl z-20">
      <div className="h-16 px-6 border-b border-white/5 flex items-center shrink-0">
        <h3 className="font-display font-semibold text-white">Response Copilot</h3>
      </div>

      <div className="flex-1 p-6 flex flex-col overflow-y-auto">
        {!draftResult && !isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-white font-medium mb-2">Ready to Draft</h4>
            <p className="text-sm text-muted-foreground mb-6">
              I'll analyze the context, check your preferences for {email.sender_name}, and apply active tone rules.
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Generate Draft
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
              <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-white/70 animate-pulse">Composing your reply...</p>
          </div>
        )}

        {draftResult && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full space-y-4"
          >
            <div className="glass-card rounded-xl p-3 text-xs flex items-start space-x-2 border-primary/20 bg-primary/5">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-primary/90">{draftResult.style_notes}</p>
            </div>

            <textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-inner"
              placeholder="Draft text..."
            />

            {draftResult.similar_past_emails.length > 0 && (
              <div className="shrink-0">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Retrieved Style Examples</p>
                <div className="space-y-2">
                  {draftResult.similar_past_emails.map((ex: SimilarEmail, i: number) => (
                    <div key={i} className="glass-card rounded-lg p-2.5 border border-white/5 text-xs">
                      <p className="text-white/50 truncate mb-1">{ex.subject}</p>
                      <p className="text-white/70 line-clamp-2 leading-relaxed">{ex.reply}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 shrink-0 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleFeedback(editedDraft === draftResult.draft ? "approved" : "edited")}
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                  {editedDraft === draftResult.draft ? (
                    <><Check className="w-4 h-4 mr-2" /> Approve (+1.0)</>
                  ) : (
                    <><Edit3 className="w-4 h-4 mr-2" /> Edit & Approve</>
                  )}
                </button>
                <button
                  onClick={() => handleFeedback("discarded")}
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Discard (-1.0)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-sky-400 bg-sky-400/10 border-sky-400/20",
};

const ACTION_COLORS: Record<string, string> = {
  reply: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  escalate: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  ignore: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  delegate: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  schedule: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

function Badge({ priority, intent, action }: { priority?: string; intent?: string; action?: string }) {
  if (priority) {
    const color = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium;
    const dotColor = priority === "high" ? "bg-rose-400" : priority === "medium" ? "bg-amber-400" : "bg-sky-400";
    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider flex items-center", color)}>
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColor)}></span>
        {priority}
      </span>
    );
  }
  if (intent) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10 bg-white/5 text-white/70 capitalize flex items-center">
        {intent}
      </span>
    );
  }
  if (action) {
    const color = ACTION_COLORS[action] ?? ACTION_COLORS.ignore;
    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider", color)}>
        {action}
      </span>
    );
  }
  return null;
}

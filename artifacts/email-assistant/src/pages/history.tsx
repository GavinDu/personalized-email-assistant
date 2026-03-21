import React from "react";
import { format } from "date-fns";
import { useHistory, type HistoryItem } from "@/hooks/use-api";
import { cn } from "@/components/layout";
import { CheckCircle2, Edit3, XCircle, Clock, RefreshCcw, History } from "lucide-react";

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, label: string, color: string, reward: string }> = {
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    reward: "+1.0",
  },
  edited: {
    icon: Edit3,
    label: "Edited",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    reward: "−0.3+",
  },
  discarded: {
    icon: XCircle,
    label: "Discarded",
    color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    reward: "−1.0",
  },
};

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();

  return (
    <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Feedback History</h1>
        <p className="text-muted-foreground text-sm">
          All draft interactions used to train your personalized email model.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCcw className="w-6 h-6 animate-spin text-primary mr-3" />
          <span className="text-white/60">Loading history...</span>
        </div>
      )}

      {!isLoading && (!history || history.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-display font-semibold text-white mb-2">No feedback yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Generate and review drafts in the Inbox to start building your model's history.
          </p>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="space-y-3">
          {history.map((item) => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const config = ACTION_CONFIG[item.user_action] ?? {
    icon: Clock,
    label: item.user_action,
    color: "text-white/50 bg-white/5 border-white/10",
    reward: "0.0",
  };
  const Icon = config.icon;

  const rewardSign = item.reward > 0 ? "+" : "";
  const rewardColor = item.reward >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0", config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.email_subject}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.email_sender}
          {item.tone_used && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 text-[10px]">
              {item.tone_used}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <span className={cn("px-2 py-1 rounded-md text-xs font-semibold border", config.color)}>
          {config.label}
        </span>
        <span className={cn("font-mono text-sm font-bold w-14 text-right", rewardColor)}>
          {rewardSign}{item.reward.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground w-28 text-right">
          {format(new Date(item.created_at), "MMM d, h:mm a")}
        </span>
      </div>
    </div>
  );
}

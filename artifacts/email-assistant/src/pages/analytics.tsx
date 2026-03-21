import React from "react";
import { useAnalytics } from "@/hooks/use-api";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Activity, Mail, Target, Award } from "lucide-react";
import { cn } from "@/components/layout";

const COLORS = ['#4f46e5', '#c084fc', '#10b981', '#f43f5e', '#f59e0b'];

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-primary animate-pulse font-display font-semibold">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">System Analytics</h1>
        <p className="text-muted-foreground text-sm">Reinforcement Learning metrics and usage statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Processed" value={data.total_emails_processed} icon={Mail} color="text-sky-400" bg="bg-sky-400/10" />
        <StatCard title="Avg Overall Reward" value={(data.avg_overall_reward > 0 ? "+" : "") + data.avg_overall_reward.toFixed(2)} icon={Award} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard title="Learning Status" value="Active" icon={Activity} color="text-primary" bg="bg-primary/10" />
        <StatCard title="Top Policy" value={data.bandit_state[0]?.tone || "N/A"} icon={Target} color="text-accent" bg="bg-accent/10" capitalize />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reward Trend Line Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-6">Reward Trend Over Time</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.reward_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="avg_reward" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tone Distribution Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-6">Tone Usage & Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tone_distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="tone" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar yAxisId="left" dataKey="count" fill="#c084fc" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Breakdown */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-display font-semibold text-white mb-2">Action Breakdown</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.action_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="action"
                  stroke="none"
                >
                  {data.action_breakdown.map((entry, index) => {
                    let color = '#4f46e5';
                    if (entry.action === 'approved') color = '#10b981';
                    if (entry.action === 'edited') color = '#3b82f6';
                    if (entry.action === 'discarded') color = '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification Breakdown — Priority & Intent */}
        <div className="glass-panel p-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 bg-black/20">
            <h3 className="text-lg font-display font-semibold text-white">Priority Distribution</h3>
            <p className="text-xs text-muted-foreground mt-1">LLM-classified email priorities across the inbox</p>
          </div>
          <div className="p-6 flex flex-col gap-3">
            {data.priority_breakdown.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-20 text-xs font-semibold capitalize shrink-0 ${item.label === "high" ? "text-red-400" : item.label === "medium" ? "text-yellow-400" : "text-green-400"}`}>{item.label}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${item.label === "high" ? "bg-red-500/70" : item.label === "medium" ? "bg-yellow-500/70" : "bg-green-500/70"}`} style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-xs text-white/50 w-14 text-right shrink-0">{item.count} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 bg-black/20">
            <h3 className="text-lg font-display font-semibold text-white">Intent Distribution</h3>
            <p className="text-xs text-muted-foreground mt-1">LLM-classified email intents across the inbox</p>
          </div>
          <div className="p-6 flex flex-col gap-3">
            {data.intent_breakdown.map((item, i) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold capitalize shrink-0 text-white/70">{item.label}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${item.percentage}%`, opacity: 1 - i * 0.12 }} />
                </div>
                <span className="text-xs text-white/50 w-14 text-right shrink-0">{item.count} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bandit State Table */}
        <div className="lg:col-span-2 glass-panel p-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 bg-black/20">
            <h3 className="text-lg font-display font-semibold text-white">Bandit Policy State</h3>
            <p className="text-xs text-muted-foreground mt-1">Multi-armed bandit exploration vs exploitation metrics</p>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase bg-black/10 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Tone Policy</th>
                  <th className="px-6 py-4 font-medium">Usage Count</th>
                  <th className="px-6 py-4 font-medium">Avg Reward</th>
                  <th className="px-6 py-4 font-medium">Expected Reward (UCB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.bandit_state.map((bandit, idx) => (
                  <tr key={bandit.tone} className={cn("hover:bg-white/[0.02]", idx === 0 ? "bg-primary/5" : "")}>
                    <td className="px-6 py-4 font-medium text-white capitalize flex items-center">
                      {idx === 0 && <Award className="w-4 h-4 text-primary mr-2" />}
                      {bandit.tone}
                    </td>
                    <td className="px-6 py-4 text-white/80">{bandit.count}</td>
                    <td className="px-6 py-4 text-white/80">{(bandit.avg_reward > 0 ? "+" : "")}{bandit.avg_reward.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-primary font-medium">{bandit.expected_reward.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  capitalize?: boolean;
}

function StatCard({ title, value, icon: Icon, color, bg, capitalize }: StatCardProps) {
  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bg, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
        <p className={cn("text-2xl font-display font-bold text-white", capitalize && "capitalize")}>{value}</p>
      </div>
    </div>
  );
}

import React from "react";
import { Link, useLocation } from "wouter";
import { Inbox, Settings, BookOpen, BarChart3, History, Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Inbox & Drafts", icon: Inbox },
    { href: "/preferences", label: "Preferences", icon: Settings },
    { href: "/tone-rules", label: "Tone Rules", icon: BookOpen },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Sparkles className="w-6 h-6 text-primary mr-3" />
          <h1 className="font-display font-bold text-lg tracking-wide text-white">MailMind <span className="text-primary">AI</span></h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 mr-3 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="glass-card rounded-xl p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-display font-bold text-white text-sm">AI</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Agent Active</p>
              <p className="text-xs text-emerald-400 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Processing
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

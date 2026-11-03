"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Mail,
  Users2,
  FolderTree,
  UserCheck,
  Bot,
  ListTodo,
  BarChart3,
  ScrollText,
  Settings,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      title: "TỔNG QUAN",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Thống kê chi tiết", href: "/statistics", icon: BarChart3 },
      ],
    },
    {
      title: "HẠ TẦNG MAIL & EMAIL",
      items: [
        { name: "Host Mail", href: "/host-mail", icon: Server },
        { name: "Email Center", href: "/email-center", icon: Mail },
      ],
    },
    {
      title: "TÀI KHOẢN TIKTOK",
      items: [
        { name: "TikTok Accounts", href: "/accounts", icon: Users2 },
        { name: "Account Groups", href: "/groups", icon: FolderTree },
        { name: "Profile Manager", href: "/profiles", icon: UserCheck },
      ],
    },
    {
      title: "TỰ ĐỘNG HÓA & TÁC VỤ",
      items: [
        { name: "Automation Center", href: "/automation", icon: Bot },
        { name: "Task Manager", href: "/tasks", icon: ListTodo },
      ],
    },
    {
      title: "HỆ THỐNG",
      items: [
        { name: "Activity Logs", href: "/activity-logs", icon: ScrollText },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide text-foreground">TIKTOK MANAGER</span>
          <span className="text-[10px] text-primary font-medium tracking-wider uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SaaS Platform v1.0
          </span>
        </div>
      </div>

      {/* Role / User Badge */}
      <div className="px-4 py-3 mx-3 my-3 bg-[#171E2B] rounded-lg border border-[#232D40] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">Nguyễn Hoàng Nam</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Super Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h4>
            <div className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold"
                        : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-sidebar-border bg-[#0B0E14]/40">
        <div className="p-2.5 rounded-lg bg-[#111620] border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-muted-foreground">Queue Worker:</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono font-medium">Hoạt động</span>
        </div>
      </div>
    </aside>
  );
}


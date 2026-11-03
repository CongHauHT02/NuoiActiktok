"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Plus,
  Server,
  UserPlus,
  FileSpreadsheet,
  PlayCircle,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Check,
  ChevronDown,
  Sparkles,
  Link2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { VideoCampaignModal } from "@/components/campaigns/VideoCampaignModal";

export function Header() {
  const { success, info } = useToast();
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications (unread messages + tasks)
    fetch("/api/emails?limit=4")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setRecentNotifications(data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-[#111620] border-b border-border sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản, host mail, email, tác vụ... (Ctrl+K)"
            className="w-full bg-[#0B0E14] border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* System Health Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#171E2B] border border-border text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Hạ tầng:</span>
          <span className="text-emerald-400 font-medium">Bình thường (4 Host)</span>
        </div>

        {/* Video Campaign Seeding Button */}
        <button
          onClick={() => setIsVideoModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mồi tương tác Video</span>
        </button>

        {/* Quick Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thao tác nhanh</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-[#171E2B] border border-card-border shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setShowQuickMenu(false)}
            >
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-emerald-400 font-semibold hover:bg-[#1F293D] transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Chiến dịch Video (Seeding Link)</span>
              </button>
              <Link
                href="/accounts?action=autoreg"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-indigo-300 font-medium hover:bg-[#1F293D] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Tự động tạo tài khoản (Auto-Reg)</span>
              </Link>
              <Link
                href="/accounts?action=new"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-[#1F293D] transition-colors"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Thêm tài khoản TikTok</span>
              </Link>
              <Link
                href="/accounts?action=import"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-[#1F293D] transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Nhập hàng loạt (CSV/Excel)</span>
              </Link>
              <Link
                href="/host-mail?action=new"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-[#1F293D] transition-colors"
              >
                <Server className="w-4 h-4 text-amber-400" />
                <span>Thêm Host Mail mới</span>
              </Link>
              <Link
                href="/automation"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-[#1F293D] transition-colors"
              >
                <PlayCircle className="w-4 h-4 text-purple-400" />
                <span>Chạy quy trình tự động</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#171E2B] hover:bg-[#1F293D] border border-border text-slate-300 hover:text-white transition-colors relative"
            title="Thông báo & Mã OTP"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#111620]" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl bg-[#171E2B] border border-card-border shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Thông báo & Mã OTP mới</span>
                <Link
                  href="/email-center"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Xem tất cả <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-card-border">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Không có thông báo mới</div>
                ) : (
                  recentNotifications.map((msg) => (
                    <div key={msg.id} className="p-3 hover:bg-[#1F293D]/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {msg.verificationCode ? (
                            <KeyRound className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-foreground truncate max-w-[170px]">
                            {msg.subject}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(msg.receivedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {msg.verificationCode && (
                        <div className="mt-1.5 flex items-center justify-between bg-[#111620] px-2.5 py-1 rounded border border-border">
                          <span className="text-[11px] text-muted-foreground">OTP:</span>
                          <span className="font-mono font-bold text-xs text-emerald-400 tracking-wider">
                            {msg.verificationCode}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.verificationCode);
                              success("Đã sao chép mã OTP", msg.verificationCode);
                            }}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Sao chép
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <Link
          href="/settings"
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#171E2B] transition-colors"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Admin Avatar"
            className="w-7 h-7 rounded-full object-cover border border-primary/40"
          />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-medium text-foreground leading-tight">Nam Nguyễn</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Admin</span>
          </div>
        </Link>
      </div>

      <VideoCampaignModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </header>
  );
}


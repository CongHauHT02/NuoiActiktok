"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Server,
  KeyRound,
  ShieldAlert,
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Inbox,
  Filter,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function EmailCenterPage() {
  const { success, error: toastError, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [selectedHostId, setSelectedHostId] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedHostId !== "ALL") params.set("hostId", selectedHostId);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchTerm) params.set("q", searchTerm);
      params.set("limit", "50");

      const res = await fetch(`/api/emails?${params.toString()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMessages(json.data || []);
      setHosts(json.hosts || []);
      if (json.data && json.data.length > 0 && !selectedEmail) {
        setSelectedEmail(json.data[0]);
      }
    } catch (err: any) {
      toastError("Lỗi tải danh sách email", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [selectedHostId, selectedCategory]);

  const handleSyncMailbox = async () => {
    try {
      setSyncing(true);
      info("Đang đồng bộ hộp thư...", "Đọc các email mới nhất từ Host Mail");
      // Simulate sync delay
      await new Promise((r) => setTimeout(r, 800));
      await fetchEmails();
      success("Đã đồng bộ hộp thư hoàn tất", "Hộp thư đã cập nhật các email mới nhất");
    } catch (err: any) {
      toastError("Lỗi đồng bộ", err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAsRead = async (email: any) => {
    if (email.isRead) return;
    try {
      await fetch(`/api/emails/${email.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === email.id ? { ...m, isRead: true } : m))
      );
      if (selectedEmail?.id === email.id) {
        setSelectedEmail((prev: any) => ({ ...prev, isRead: true }));
      }
    } catch {}
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.sender.toLowerCase().includes(q) ||
      m.recipient.toLowerCase().includes(q) ||
      (m.verificationCode && m.verificationCode.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Email Center & Hộp thư tập trung</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Auto OTP Parser
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý email đến, tự động phát hiện và trích xuất mã xác thực OTP từ TikTok an toàn và tập trung.
          </p>
        </div>

        <button
          onClick={handleSyncMailbox}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Đang đồng bộ..." : "Đồng bộ hộp thư ngay"}</span>
        </button>
      </div>

      {/* Main Inbox 3-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Filter Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-xl bg-card border border-card-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phân loại thư</h3>
            <div className="space-y-1">
              {[
                { id: "ALL", label: "Tất cả email", icon: Inbox },
                { id: "VERIFICATION_CODE", label: "Mã OTP TikTok", icon: KeyRound, color: "text-emerald-400" },
                { id: "SECURITY_ALERT", label: "Cảnh báo bảo mật", icon: ShieldAlert, color: "text-amber-400" },
                { id: "NOTIFICATION", label: "Thông báo chung", icon: Bell, color: "text-blue-400" },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSel ? "bg-primary text-white font-semibold" : "text-slate-300 hover:bg-[#111620]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cat.color || ""}`} />
                      <span>{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-card-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lọc theo Host Mail</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedHostId("ALL")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedHostId === "ALL" ? "bg-primary text-white font-semibold" : "text-slate-300 hover:bg-[#111620]"
                }`}
              >
                <span>Toàn bộ Host Mail</span>
              </button>
              {hosts.map((h) => {
                const isSel = selectedHostId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHostId(h.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSel ? "bg-primary text-white font-semibold" : "text-slate-300 hover:bg-[#111620]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Server className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{h.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">({h._count?.emailMessages || 0})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Email List (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-card border border-card-border flex flex-col">
          <div className="mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm người gửi, tiêu đề, mã OTP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111620] border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[580px]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-xs space-y-1">
                <Mail className="w-7 h-7 mx-auto text-slate-500" />
                <p>Không có email nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedEmail?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedEmail(msg);
                      handleMarkAsRead(msg);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#1F293D] border-primary/50 shadow-md"
                        : "bg-[#111620] border-border hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-semibold truncate max-w-[150px] ${!msg.isRead ? "text-primary" : "text-slate-300"}`}>
                        {msg.sender.split("@")[0]}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {new Date(msg.receivedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className={`text-xs truncate ${!msg.isRead ? "font-bold text-foreground" : "text-slate-300"}`}>
                      {msg.subject}
                    </p>

                    {msg.verificationCode && (
                      <div className="mt-2 flex items-center justify-between bg-[#171E2B] px-2 py-1 rounded border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 font-medium">OTP TikTok:</span>
                        <span className="font-mono font-bold text-xs text-emerald-400 tracking-wider">
                          {msg.verificationCode}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                      <span className="truncate max-w-[150px]">{msg.recipient}</span>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Email Detail View (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between">
          {!selectedEmail ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground text-xs space-y-2">
              <Mail className="w-10 h-10 text-slate-600" />
              <p>Chọn một thư từ danh sách để xem nội dung chi tiết</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Email Detail Header */}
              <div className="pb-4 border-b border-card-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold text-foreground leading-snug">{selectedEmail.subject}</h2>
                  {selectedEmail.verificationCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEmail.verificationCode);
                        success("Đã sao chép mã OTP", selectedEmail.verificationCode);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-all shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy OTP: {selectedEmail.verificationCode}</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#111620] p-3 rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Người gửi:</span>
                    <span className="font-mono text-slate-200">{selectedEmail.sender}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hộp thư nhận:</span>
                    <span className="font-mono text-slate-200">{selectedEmail.recipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thời gian:</span>
                    <span className="text-slate-300 font-mono">
                      {new Date(selectedEmail.receivedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Host Mail:</span>
                    <span className="text-primary font-medium">{selectedEmail.mailHost?.name || "Hệ thống"}</span>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="flex-1 overflow-y-auto pr-1">
                {selectedEmail.bodyHtml ? (
                  <div
                    className="p-4 rounded-lg bg-[#0B0E14] border border-border text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-[#0B0E14] border border-border font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.bodyText}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


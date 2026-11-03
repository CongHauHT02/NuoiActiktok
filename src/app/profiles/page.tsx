"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Search,
  RefreshCw,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Copy,
  Save,
  Globe,
  Share2,
  Heart,
  Grid,
  Bookmark,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ProfileManagerPage() {
  const { success, error: toastError, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Editable Profile Form State
  const [formData, setFormData] = useState({
    targetDisplayName: "",
    targetBio: "",
    targetAvatarUrl: "",
    targetCountry: "VN",
    targetLanguage: "vi",
    setupStatus: "PENDING",
    templateId: "",
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (statusFilter !== "ALL") params.set("setupStatus", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/profiles?${params.toString()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setProfiles(json.data || []);
      setTemplates(json.templates || []);

      if (json.data && json.data.length > 0 && !selectedProfile) {
        selectProfileItem(json.data[0]);
      }
    } catch (err: any) {
      toastError("Lỗi tải danh sách hồ sơ", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [statusFilter]);

  const selectProfileItem = (item: any) => {
    setSelectedProfile(item);
    setFormData({
      targetDisplayName: item.targetDisplayName || item.tiktokAccount?.displayName || "",
      targetBio: item.targetBio || item.tiktokAccount?.bio || "",
      targetAvatarUrl: item.targetAvatarUrl || item.tiktokAccount?.avatarUrl || "",
      targetCountry: item.targetCountry || item.tiktokAccount?.country || "VN",
      targetLanguage: item.targetLanguage || item.tiktokAccount?.language || "vi",
      setupStatus: item.setupStatus || "PENDING",
      templateId: item.templateId || "",
    });
  };

  const handleApplyTemplate = (template: any) => {
    setFormData((prev) => ({
      ...prev,
      targetBio: template.bioSample,
      targetCountry: template.country,
      targetLanguage: template.language,
      templateId: template.id,
    }));
    success(`Đã áp dụng mẫu "${template.name}"`);
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    try {
      setSaving(true);
      const res = await fetch("/api/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          ...formData,
          applyToAccount: true,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã cập nhật hồ sơ thành công");
      // Update local state
      setProfiles((prev) =>
        prev.map((p) => (p.id === selectedProfile.id ? { ...p, ...json.data } : p))
      );
      setSelectedProfile((prev: any) => ({ ...prev, ...json.data }));
    } catch (err: any) {
      toastError("Lỗi lưu hồ sơ", err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const username = p.tiktokAccount?.username?.toLowerCase() || "";
    const displayName = p.tiktokAccount?.displayName?.toLowerCase() || "";
    return username.includes(q) || displayName.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Thiết lập Hồ sơ & Xem trước TikTok</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Profile Manager
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tối ưu hóa thông tin hồ sơ (Avatar, Bio, Display Name) theo mẫu chuẩn Creator/Shop và xem trước giao diện TikTok di động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Mẫu gợi ý:</span>
              {templates.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 rounded bg-[#171E2B] hover:bg-[#1F293D] text-slate-300 hover:text-white border border-border text-[11px] transition-colors"
                >
                  {tpl.name.split("-")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3-Column Layout: Profile List, Editor Form, TikTok Phone Simulator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: Accounts with Profile Setup status (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-card border border-card-border flex flex-col min-h-[640px]">
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm username hoặc display name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111620] border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#111620] border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả tiến độ hồ sơ</option>
                <option value="PENDING">Chờ thiết lập (Pending)</option>
                <option value="IN_PROGRESS">Đang xử lý (In Progress)</option>
                <option value="COMPLETED">Hoàn tất (Completed)</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[560px]">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-xs">Không tìm thấy tài khoản nào.</div>
            ) : (
              filteredProfiles.map((p) => {
                const isSelected = selectedProfile?.id === p.id;
                const statusColors = {
                  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  PENDING: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                  FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                };
                const statusLabels = {
                  COMPLETED: "Đã hoàn tất",
                  IN_PROGRESS: "Đang xử lý",
                  PENDING: "Chờ thiết lập",
                  FAILED: "Thất bại",
                };

                return (
                  <div
                    key={p.id}
                    onClick={() => selectProfileItem(p)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#1F293D] border-primary/50 shadow-md"
                        : "bg-[#111620] border-border hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground block">
                        @{p.tiktokAccount?.username}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${(statusColors as any)[p.setupStatus]}`}
                      >
                        {(statusLabels as any)[p.setupStatus]}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.targetDisplayName || p.tiktokAccount?.displayName}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-card-border">
                      <span>{p.targetCountry || "VN"}</span>
                      <span>{p.tiktokAccount?.group?.name || "Chưa phân nhóm"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Middle Editor: Form (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between">
          {!selectedProfile ? (
            <div className="text-center py-24 text-muted-foreground text-xs">Chọn tài khoản từ danh sách</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-card-border">
                <h3 className="text-sm font-semibold text-foreground">
                  Cấu hình hồ sơ: @{selectedProfile.tiktokAccount?.username}
                </h3>
                <span className="text-[11px] text-primary font-mono">{selectedProfile.tiktokAccount?.country}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tên hiển thị (Display Name)</label>
                  <input
                    type="text"
                    value={formData.targetDisplayName}
                    onChange={(e) => setFormData({ ...formData, targetDisplayName: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                  <input
                    type="text"
                    value={formData.targetAvatarUrl}
                    onChange={(e) => setFormData({ ...formData, targetAvatarUrl: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Tiểu sử kênh (Bio)</label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formData.targetBio.length}/80 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.targetBio}
                    onChange={(e) => setFormData({ ...formData, targetBio: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Quốc gia</label>
                    <select
                      value={formData.targetCountry}
                      onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
                      className="w-full bg-[#111620] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="VN">Việt Nam (VN)</option>
                      <option value="US">Hoa Kỳ (US)</option>
                      <option value="UK">Vương quốc Anh (UK)</option>
                      <option value="TH">Thái Lan (TH)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Trạng thái hồ sơ</label>
                    <select
                      value={formData.setupStatus}
                      onChange={(e) => setFormData({ ...formData, setupStatus: e.target.value })}
                      className="w-full bg-[#111620] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="PENDING">Chờ thiết lập</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Đã hoàn tất</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Đang lưu cấu hình..." : "Lưu cấu hình hồ sơ"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview: Interactive TikTok Mobile Phone Mockup (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-card border border-card-border flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary" />
              <span>Xem trước hồ sơ TikTok (Mobile Simulator)</span>
            </h3>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[280px] bg-black border-4 border-[#232D40] rounded-[36px] shadow-2xl overflow-hidden p-3 relative text-white select-none">
            {/* Phone Notch & Status bar */}
            <div className="flex items-center justify-between px-3 pt-1 pb-2 text-[10px] text-slate-300">
              <span>09:41</span>
              <div className="w-16 h-3 bg-zinc-800 rounded-full" />
              <span>5G 100%</span>
            </div>

            {/* TikTok Header */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-900">
              <span className="text-xs font-bold font-mono">
                @{selectedProfile?.tiktokAccount?.username || "username"}
              </span>
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {/* Profile Content */}
            <div className="py-4 flex flex-col items-center text-center space-y-2.5 px-3">
              {/* Avatar with TikTok ring */}
              <div className="relative">
                <img
                  src={
                    formData.targetAvatarUrl ||
                    selectedProfile?.tiktokAccount?.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775?w=120"
                  }
                  alt="TikTok Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-rose-500 shadow-md"
                />
                <span className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                  +
                </span>
              </div>

              {/* Display Name & Verified Badge */}
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white flex items-center justify-center gap-1">
                  <span>{formData.targetDisplayName || "Tên hiển thị"}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                </p>
                <p className="text-[10px] text-zinc-400">
                  @{selectedProfile?.tiktokAccount?.username || "username"}
                </p>
              </div>

              {/* Followers Counters */}
              <div className="flex items-center justify-center gap-5 text-center pt-1 pb-1">
                <div>
                  <p className="text-xs font-bold font-mono">
                    {selectedProfile?.tiktokAccount?.followingCount || 128}
                  </p>
                  <p className="text-[9px] text-zinc-400">Đang follow</p>
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-emerald-400">
                    {(selectedProfile?.tiktokAccount?.followersCount || 24500).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-zinc-400">Follower</p>
                </div>
                <div>
                  <p className="text-xs font-bold font-mono">
                    {(selectedProfile?.tiktokAccount?.likesCount || 89200).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-zinc-400">Thích</p>
                </div>
              </div>

              {/* TikTok Buttons Mockup */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button className="flex-1 py-1.5 rounded-md bg-[#EF4444] text-white text-[11px] font-semibold">
                  Follow
                </button>
                <button className="px-3 py-1.5 rounded-md bg-zinc-800 text-white text-[11px] font-semibold">
                  Nhắn tin
                </button>
              </div>

              {/* Bio Preview */}
              <div className="w-full text-left pt-1">
                <p className="text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {formData.targetBio || "🎯 Chia sẻ video hấp dẫn mỗi ngày. Nhấn link bên dưới!"}
                </p>
              </div>

              {/* Tabs Mockup */}
              <div className="w-full flex items-center justify-around border-t border-zinc-900 pt-2 text-zinc-400">
                <Grid className="w-4 h-4 text-white" />
                <Bookmark className="w-4 h-4" />
                <Heart className="w-4 h-4" />
              </div>

              {/* Video Grid Mockup */}
              <div className="grid grid-cols-3 gap-1 w-full pt-1 pb-2">
                {[1, 2, 3].map((v) => (
                  <div key={v} className="aspect-[3/4] bg-zinc-800 rounded relative overflow-hidden">
                    <span className="absolute bottom-1 left-1 text-[8px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                      ▶ 12.{v}K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


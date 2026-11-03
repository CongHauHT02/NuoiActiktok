"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users2,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import Papa from "papaparse";
import { AccountStatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

function TikTokAccountsContent() {
  const { success, error: toastError, info } = useToast();
  const searchParams = useSearchParams();

  // Table Data State
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  // Single Account Form
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    birthDate: "",
    avatarUrl: "",
    bio: "",
    country: "VN",
    language: "vi",
    status: "NEW",
    groupId: "",
    notes: "",
    sessionCookies: "",
  });

  // Import State
  const [importTab, setImportTab] = useState<"file" | "paste">("paste");
  const [importText, setImportText] = useState("");
  const [importGroupId, setImportGroupId] = useState("");
  const [importValidating, setImportValidating] = useState(false);
  const [importCommitting, setImportCommitting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);

  // Auto-Reg State
  const [isAutoRegModalOpen, setIsAutoRegModalOpen] = useState(false);
  const [autoRegMode, setAutoRegMode] = useState<"free_cloud" | "domain" | "paste">("free_cloud");
  const [autoRegDomain, setAutoRegDomain] = useState("creatorhost.net");
  const [autoRegEmails, setAutoRegEmails] = useState("");
  const [autoRegCount, setAutoRegCount] = useState(1);
  const [autoRegDelay, setAutoRegDelay] = useState(10);
  const [autoRegStarting, setAutoRegStarting] = useState(false);

  const fetchAccounts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (groupFilter !== "ALL") params.set("groupId", groupFilter);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/accounts?${params.toString()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setAccounts(json.data || []);
      setGroups(json.groups || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      setSelectedIds([]);
    } catch (err: any) {
      toastError("Lỗi tải danh sách tài khoản", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(1);
  }, [statusFilter, groupFilter]);

  // Handle URL query actions (e.g. ?action=new or ?action=import)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") handleOpenAdd();
    if (action === "import") setIsImportModalOpen(true);
    if (action === "autoreg") setIsAutoRegModalOpen(true);
    const filterStatus = searchParams.get("status");
    if (filterStatus) setStatusFilter(filterStatus);
  }, [searchParams]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      username: "",
      displayName: "",
      email: "",
      password: "",
      birthDate: "",
      avatarUrl: "",
      bio: "",
      country: "VN",
      language: "vi",
      status: "NEW",
      groupId: groups[0]?.id || "",
      notes: "",
      sessionCookies: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setFormData({
      username: acc.username,
      displayName: acc.displayName,
      email: acc.email || "",
      password: "••••••••",
      birthDate: acc.birthDate || "",
      avatarUrl: acc.avatarUrl || "",
      bio: acc.bio || "",
      country: acc.country || "VN",
      language: acc.language || "vi",
      status: acc.status || "NEW",
      groupId: acc.groupId || "",
      notes: acc.notes || "",
      sessionCookies: acc.sessionCookies || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success(json.message || "Lưu tài khoản thành công");
      setIsAddModalOpen(false);
      fetchAccounts(pagination.page);
    } catch (err: any) {
      toastError("Lỗi lưu tài khoản", err.message);
    }
  };

  const handleDeleteAccount = async (id: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản @${username}?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      success("Đã xóa tài khoản thành công");
      fetchAccounts(pagination.page);
    } catch (err: any) {
      toastError("Lỗi xóa tài khoản", err.message);
    }
  };

  // Batch actions
  const handleBatchAction = async (action: string, extraParam?: string) => {
    if (selectedIds.length === 0) return;
    if (action === "DELETE" && !confirm(`Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.length} tài khoản đã chọn?`)) {
      return;
    }

    try {
      const payload: any = { action, ids: selectedIds };
      if (action === "CHANGE_STATUS") payload.status = extraParam;
      if (action === "CHANGE_GROUP") payload.groupId = extraParam;

      const res = await fetch("/api/accounts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success(json.message);
      fetchAccounts(pagination.page);
    } catch (err: any) {
      toastError("Thao tác hàng loạt thất bại", err.message);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (groupFilter !== "ALL") params.set("groupId", groupFilter);
    window.open(`/api/accounts/export?${params.toString()}`, "_blank");
  };

  // Parse Raw Text to Rows
  const parseRawTextToRows = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      // Support delimiter: '|', ',', '\t'
      const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : ",";
      const parts = line.split(delimiter).map((p) => p.trim());
      return {
        username: parts[0] || "",
        displayName: parts[1] || parts[0] || "",
        email: parts[2] || "",
        password: parts[3] || "",
        birthDate: parts[4] || "",
        notes: parts[5] || "",
      };
    });
  };

  // Validate Bulk Import Preview
  const handleValidateImport = async () => {
    try {
      setImportValidating(true);
      let parsedRows: any[] = [];

      if (importTab === "paste") {
        if (!importText.trim()) {
          toastError("Vui lòng dán danh sách tài khoản cần nhập");
          return;
        }
        parsedRows = parseRawTextToRows(importText);
      }

      const res = await fetch("/api/accounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedRows,
          groupId: importGroupId || null,
          commit: false,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setImportPreviewData(json);
      info("Đã kiểm tra xong cú pháp và trùng lặp", `Hợp lệ: ${json.summary.validCount} / Tổng: ${json.summary.totalRows}`);
    } catch (err: any) {
      toastError("Kiểm tra dữ liệu thất bại", err.message);
    } finally {
      setImportValidating(false);
    }
  };

  // Commit Bulk Import
  const handleCommitImport = async () => {
    if (!importPreviewData || !importPreviewData.rows) return;
    try {
      setImportCommitting(true);
      const validRows = importPreviewData.rows.filter((r: any) => r.errors.length === 0);

      const res = await fetch("/api/accounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows,
          groupId: importGroupId || null,
          commit: true,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Tiến trình nhập hàng loạt đã được khởi tạo!", `ID Tác vụ: ${json.taskId}`);
      setIsImportModalOpen(false);
      setImportPreviewData(null);
      setImportText("");
      fetchAccounts(1);
    } catch (err: any) {
      toastError("Lỗi thực hiện nhập hàng loạt", err.message);
    } finally {
      setImportCommitting(false);
    }
  };

  // File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          setImportValidating(true);
          const mappedRows = results.data.map((r: any) => ({
            username: r.username || r.Username || r["Tài khoản"] || "",
            displayName: r.displayName || r.display_name || r["Tên hiển thị"] || "",
            email: r.email || r.Email || "",
            password: r.password || r.Password || r["Mật khẩu"] || "",
            birthDate: r.birthDate || r.birth_date || r["Ngày sinh"] || "",
            notes: r.notes || r.Notes || r["Ghi chú"] || "",
          }));

          const res = await fetch("/api/accounts/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rows: mappedRows,
              groupId: importGroupId || null,
              commit: false,
            }),
          });
          const json = await res.json();
          if (json.error) throw new Error(json.error);
          setImportPreviewData(json);
          success("Đã nạp và kiểm tra tệp tin thành công", `Tổng số: ${json.summary.totalRows} dòng`);
        } catch (err: any) {
          toastError("Lỗi xử lý tệp CSV", err.message);
        } finally {
          setImportValidating(false);
        }
      },
    });
  };

  // Start Auto-Reg Campaign
  const handleStartAutoReg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAutoRegStarting(true);
      const payload: any = {
        mode: autoRegMode,
        count: autoRegCount,
        delaySeconds: autoRegDelay,
      };
      if (autoRegMode === "domain") {
        payload.domain = autoRegDomain;
      } else if (autoRegMode === "paste") {
        const list = autoRegEmails.split("\n").map((l) => l.trim()).filter((l) => l.includes("@"));
        if (list.length === 0) {
          toastError("Vui lòng dán ít nhất 1 email hợp lệ");
          return;
        }
        payload.emails = list;
      }

      const res = await fetch("/api/accounts/auto-reg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã khởi động tiến trình tạo tài khoản!");
      setIsAutoRegModalOpen(false);
      window.location.href = "/tasks";
    } catch (err: any) {
      toastError("Lỗi khởi chạy Auto-Reg", err.message);
    } finally {
      setAutoRegStarting(false);
    }
  };

  // Checkbox toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Quản lý Tài khoản TikTok</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              {pagination.total} tài khoản
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản trị tập trung danh sách tài khoản TikTok, phân loại theo nhóm, thiết lập hồ sơ và kiểm tra trạng thái an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#171E2B] hover:bg-[#232D40] border border-border text-xs text-foreground font-medium transition-all"
            title="Xuất dữ liệu CSV"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => setIsAutoRegModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25"
            title="Đăng ký tài khoản TikTok thật tự động qua Host Mail"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Tự động tạo tài khoản (Auto-Reg)</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập hàng loạt</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-card-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo username, email, tên hiển thị, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAccounts(1)}
              className="w-full bg-[#111620] border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => fetchAccounts(1)}
            className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-medium"
          >
            Tìm
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="CONFIGURED">Đã thiết lập</option>
            <option value="NEW">Chưa thiết lập</option>
            <option value="NEED_CHECK">Cần kiểm tra</option>
            <option value="ERROR">Gặp lỗi</option>
            <option value="SUSPENDED">Tạm ngưng</option>
          </select>

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchAccounts(pagination.page)}
            className="p-2 rounded-lg bg-[#111620] hover:bg-[#1C2536] border border-border text-slate-300 hover:text-white transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Batch Action Floating Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[#1F293D] border border-primary/40 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span>tài khoản đã được chọn</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) handleBatchAction("CHANGE_STATUS", e.target.value);
                e.target.value = "";
              }}
              className="bg-[#111620] border border-border rounded px-2.5 py-1 text-xs text-foreground"
            >
              <option value="">Đổi trạng thái...</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="CONFIGURED">Đã thiết lập</option>
              <option value="NEED_CHECK">Cần kiểm tra</option>
              <option value="SUSPENDED">Tạm ngưng</option>
            </select>

            <select
              onChange={(e) => {
                if (e.target.value) handleBatchAction("CHANGE_GROUP", e.target.value);
                e.target.value = "";
              }}
              className="bg-[#111620] border border-border rounded px-2.5 py-1 text-xs text-foreground"
            >
              <option value="">Chuyển nhóm...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleBatchAction("DELETE")}
              className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-medium"
            >
              Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      {/* Accounts Main Table */}
      <div className="rounded-xl bg-card border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111620] border-b border-card-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.length > 0 && selectedIds.length === accounts.length ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3 w-12 text-center">STT</th>
                <th className="px-4 py-3">Tài khoản & Username</th>
                <th className="px-4 py-3">Email liên kết</th>
                <th className="px-4 py-3">Nhóm tài khoản</th>
                <th className="px-4 py-3">Chỉ số (Follower/Likes)</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày thêm</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                    {loading ? "Đang tải dữ liệu tài khoản..." : "Không tìm thấy tài khoản nào."}
                  </td>
                </tr>
              ) : (
                accounts.map((acc, idx) => {
                  const isSelected = selectedIds.includes(acc.id);
                  const stt = (pagination.page - 1) * pagination.limit + (idx + 1);

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-[#111620]/60 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(acc.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="px-3 py-3 text-center text-muted-foreground font-mono">{stt}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              acc.avatarUrl ||
                              `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?w=100&auto=format&fit=crop&q=80`
                            }
                            alt={acc.username}
                            className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground block">@{acc.username}</span>
                              {acc.sessionCookies && (
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-mono" title="Đã nạp Cookie phiên đăng nhập">
                                  Cookie ✓
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[140px] block">
                              {acc.displayName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-300 text-[11px]">
                          {acc.email || <span className="text-muted-foreground italic">Chưa liên kết</span>}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {acc.group ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${acc.group.color}15`,
                              borderColor: `${acc.group.color}30`,
                              color: acc.group.color,
                            }}
                          >
                            {acc.group.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Chưa phân nhóm</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-[11px] font-mono text-slate-300">
                          <span className="font-semibold text-emerald-400">
                            {acc.followersCount.toLocaleString()}
                          </span>{" "}
                          followers
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {acc.videosCount} video • {acc.likesCount.toLocaleString()} likes
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <AccountStatusBadge status={acc.status} />
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(acc.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAccount(acc);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-slate-300 hover:text-white border border-border transition-colors"
                            title="Xem chi tiết tài khoản"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-slate-300 hover:text-white border border-border transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteAccount(acc.id, acc.username)}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-border transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-card-border bg-[#111620] flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Hiển thị trang {pagination.page} / {pagination.totalPages} ({pagination.total} tài khoản)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAccounts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40 hover:text-foreground"
            >
              Trang trước
            </button>
            <button
              onClick={() => fetchAccounts(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40 hover:text-foreground"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingAccount ? `Chỉnh sửa tài khoản @${editingAccount.username}` : "Thêm tài khoản TikTok"}
        description="Thông tin đăng nhập được mã hóa an toàn. Mật khẩu không hiển thị dạng plaintext."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Username TikTok <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">@</span>
                <input
                  type="text"
                  required
                  disabled={!!editingAccount}
                  placeholder="tiktok_username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#111620] border border-border rounded-lg pl-7 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tên hiển thị (Display Name) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vd: Alex Creator"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email liên kết</label>
              <input
                type="email"
                placeholder="alex@creatorhost.net"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Mật khẩu (nếu lưu)</label>
              <input
                type="password"
                placeholder={editingAccount ? "••••••••" : "Mật khẩu an toàn"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Nhóm tài khoản</label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Chưa phân nhóm</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="NEW">Chưa thiết lập</option>
                <option value="CONFIGURED">Đã thiết lập</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="NEED_CHECK">Cần kiểm tra</option>
                <option value="SUSPENDED">Tạm ngưng</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Quốc gia</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="VN">Việt Nam (VN)</option>
                <option value="US">Hoa Kỳ (US)</option>
                <option value="UK">Vương Quốc Anh (UK)</option>
                <option value="TH">Thái Lan (TH)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Tiểu sử (Bio)</label>
            <textarea
              rows={2}
              placeholder="Nội dung giới thiệu kênh TikTok..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Ghi chú nội bộ</label>
            <input
              type="text"
              placeholder="Ghi chú về thiết bị, proxy, mục đích tài khoản..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                TikTok Session Cookies (JSON / Trình duyệt)
              </label>
              <span className="text-[10px] text-muted-foreground">
                Tùy chọn • Tự động thả Tym & Comment khi chạy trình duyệt thật
              </span>
            </div>
            <textarea
              rows={2}
              placeholder='[{"name":"sessionid","value":"...","domain":".tiktok.com"}, ...]'
              value={formData.sessionCookies}
              onChange={(e) => setFormData({ ...formData, sessionCookies: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono text-[11px]"
            />
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] hover:bg-[#232D40] text-xs font-medium text-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
            >
              {editingAccount ? "Cập nhật tài khoản" : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportPreviewData(null);
        }}
        title="Nhập tài khoản TikTok hàng loạt"
        description="Hỗ trợ nhập CSV, Excel hoặc dán văn bản. Tự động kiểm tra cú pháp và phát hiện tài khoản trùng."
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {!importPreviewData ? (
            <>
              {/* Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-card-border pb-3">
                <button
                  onClick={() => setImportTab("paste")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    importTab === "paste" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dán danh sách văn bản
                </button>
                <button
                  onClick={() => setImportTab("file")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    importTab === "file" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tải tệp CSV / Excel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Gán vào nhóm tài khoản</label>
                  <select
                    value={importGroupId}
                    onChange={(e) => setImportGroupId(e.target.value)}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Tài khoản mới (Mặc định)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <p className="text-[11px] text-muted-foreground">
                    Cấu trúc mỗi dòng: <br />
                    <code className="text-primary font-mono font-semibold">username | display_name | email | password</code>
                  </p>
                </div>
              </div>

              {importTab === "paste" ? (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Dán nội dung danh sách (mỗi tài khoản một dòng):
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`alex_creator_99 | Alex Creator | alex99@creatorhost.net | Pass123!
sarah_fit_01 | Sarah Fitness | sarah01@creatorhost.net | Pass456!
viet_shop_hn | Mai Linh Shop | mailinh@vietmedia.io | Pass789!`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full bg-[#111620] border border-border rounded-lg p-3 text-xs text-foreground font-mono focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-border rounded-xl text-center space-y-3 bg-[#111620]">
                  <Upload className="w-8 h-8 text-primary mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Chọn tệp CSV hoặc Excel từ máy tính</p>
                    <p className="text-[11px] text-muted-foreground">
                      Các cột tiêu đề yêu cầu: username, displayName, email, password
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1C2536] text-xs font-medium text-slate-300"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleValidateImport}
                  disabled={importValidating}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${importValidating ? "animate-spin" : ""}`} />
                  <span>{importValidating ? "Đang phân tích dữ liệu..." : "Kiểm tra & Xem trước"}</span>
                </button>
              </div>
            </>
          ) : (
            /* Interactive Validation Preview Table */
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#111620] border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Tổng số: {importPreviewData.summary.totalRows}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ: {importPreviewData.summary.validCount}
                  </span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Lỗi / Trùng: {importPreviewData.summary.errorCount}
                  </span>
                </div>

                <button
                  onClick={() => setImportPreviewData(null)}
                  className="text-primary hover:underline text-xs"
                >
                  ← Sửa lại danh sách
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111620] sticky top-0 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2 w-10">Dòng</th>
                      <th className="px-3 py-2">Username</th>
                      <th className="px-3 py-2">Tên hiển thị</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Tình trạng kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {importPreviewData.rows.map((row: any) => {
                      const hasError = row.errors.length > 0;
                      return (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-[#111620]/50 transition-colors ${
                            hasError ? "bg-rose-500/5" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-muted-foreground font-mono">{row.rowIndex}</td>
                          <td className="px-3 py-2 font-mono font-medium text-foreground">@{row.username}</td>
                          <td className="px-3 py-2 text-slate-300">{row.displayName}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{row.email || "-"}</td>
                          <td className="px-3 py-2">
                            {hasError ? (
                              <div className="space-y-0.5">
                                {row.errors.map((err: string, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 mr-1"
                                  >
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {err}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-card-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Chỉ các dòng hợp lệ ({importPreviewData.summary.validCount} bản ghi) sẽ được lưu vào cơ sở dữ liệu.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportPreviewData(null)}
                    className="px-4 py-2 rounded-lg bg-[#1C2536] text-xs font-medium text-slate-300"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={importCommitting || importPreviewData.summary.validCount === 0}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${importCommitting ? "animate-spin" : ""}`} />
                    <span>
                      {importCommitting
                        ? "Đang ghi dữ liệu..."
                        : `Xác nhận nhập ${importPreviewData.summary.validCount} tài khoản`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Account Details Modal */}
      {selectedAccount && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Hồ sơ chi tiết @${selectedAccount.username}`}
          description="Thông tin toàn diện về cấu hình, tài khoản email liên kết và lịch sử hoạt động"
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Account Card Banner */}
            <div className="p-4 rounded-xl bg-[#111620] border border-border flex items-center gap-4">
              <img
                src={selectedAccount.avatarUrl || "https://images.unsplash.com/photo-1534528741775?w=120"}
                alt={selectedAccount.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">@{selectedAccount.username}</h3>
                  <AccountStatusBadge status={selectedAccount.status} />
                </div>
                <p className="text-xs text-slate-300 font-medium">{selectedAccount.displayName}</p>
                <p className="text-[11px] text-muted-foreground">{selectedAccount.bio || "Chưa có tiểu sử"}</p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-[#111620] border border-border">
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {selectedAccount.followersCount.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111620] border border-border">
                <p className="text-xs text-muted-foreground">Following</p>
                <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                  {selectedAccount.followingCount.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111620] border border-border">
                <p className="text-xs text-muted-foreground">Likes</p>
                <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                  {selectedAccount.likesCount.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111620] border border-border">
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                  {selectedAccount.videosCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Detailed Parameters Grid */}
            <div className="p-4 rounded-xl bg-[#111620] border border-border space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-card-border">
                <span className="text-muted-foreground">Email liên kết:</span>
                <span className="font-mono text-foreground">{selectedAccount.email || "Chưa có"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-card-border">
                <span className="text-muted-foreground">Mật khẩu lưu trữ:</span>
                <span className="font-mono text-foreground">•••••••• (Được mã hóa AES-256)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-card-border">
                <span className="text-muted-foreground">TikTok UID:</span>
                <span className="font-mono text-foreground">{selectedAccount.tiktokUid || "Chưa đồng bộ"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-card-border">
                <span className="text-muted-foreground">Nhóm tài khoản:</span>
                <span className="text-primary font-medium">{selectedAccount.group?.name || "Chưa phân nhóm"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-card-border">
                <span className="text-muted-foreground">Quốc gia / Ngôn ngữ:</span>
                <span className="text-foreground">
                  {selectedAccount.country} / {selectedAccount.language}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Ngày khởi tạo:</span>
                <span className="font-mono text-foreground">
                  {new Date(selectedAccount.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {selectedAccount.notes && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <span className="font-semibold">Ghi chú:</span> {selectedAccount.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Auto-Reg Modal */}
      <Modal
        isOpen={isAutoRegModalOpen}
        onClose={() => setIsAutoRegModalOpen(false)}
        title="Tự động tạo tài khoản TikTok thật (Auto-Reg Bán tự động)"
        description="Chrome sẽ mở trực tiếp để điền Ngày sinh, Email, Mật khẩu. Bạn chỉ cần kéo mảnh ghép Captcha 1 lần, hệ thống sẽ tự đọc OTP từ Email và lưu Cookie đăng nhập vào hệ thống."
        maxWidth="lg"
      >
        <form onSubmit={handleStartAutoReg} className="space-y-4">
          <div className="flex rounded-lg bg-[#111620] p-1 border border-border">
            <button
              type="button"
              onClick={() => setAutoRegMode("free_cloud")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                autoRegMode === "free_cloud"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Mail Miễn Phí (TikTok Chấp Nhận)</span>
            </button>
            <button
              type="button"
              onClick={() => setAutoRegMode("domain")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                autoRegMode === "domain"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Host Mail / Domain Riêng
            </button>
            <button
              type="button"
              onClick={() => setAutoRegMode("paste")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                autoRegMode === "paste"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dán Email Có Sẵn
            </button>
          </div>

          {autoRegMode === "free_cloud" ? (
            <div className="space-y-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-300">
                  Hệ thống Cloud Mail Miễn Phí (fldubai.com / Mail.tm)
                </span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Đã kiểm tra nhận OTP 100%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Hệ thống sẽ <strong>tự động tạo hộp thư miễn phí</strong> với tên miền sạch được TikTok chấp nhận. Mã xác minh 6 số từ TikTok sẽ được <strong>tự động đọc và điền trong vòng 2-3 giây</strong> mà không cần bạn phải mua tên miền!
              </p>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Số lượng tài khoản muốn tạo: <span className="font-bold text-emerald-400 font-mono">{autoRegCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={autoRegCount}
                  onChange={(e) => setAutoRegCount(parseInt(e.target.value) || 1)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>1 tài khoản</span>
                  <span>5 tài khoản</span>
                  <span>10 tài khoản</span>
                </div>
              </div>
            </div>
          ) : autoRegMode === "domain" ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Domain Host Mail (Nhận mã xác minh OTP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="vd: creatorhost.net hoặc domain riêng của bạn"
                  value={autoRegDomain}
                  onChange={(e) => setAutoRegDomain(e.target.value)}
                  className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Hệ thống sẽ tự động tạo email dạng <code className="text-primary font-mono">tt_xxxxxx@{autoRegDomain || "domain"}</code> và kết nối với Email Center để bắt mã OTP.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Số lượng tài khoản muốn tạo: <span className="font-bold text-primary font-mono">{autoRegCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={autoRegCount}
                  onChange={(e) => setAutoRegCount(parseInt(e.target.value) || 1)}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>1 tài khoản</span>
                  <span>5 tài khoản</span>
                  <span>10 tài khoản</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Danh sách Email (mỗi dòng 1 email)
              </label>
              <textarea
                rows={4}
                required
                placeholder="acc01@gmail.com&#10;acc02@outlook.com&#10;acc03@yourdomain.com"
                value={autoRegEmails}
                onChange={(e) => setAutoRegEmails(e.target.value)}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Lưu ý: Hộp thư của email phải đang hoạt động để nhận được thư chứa mã 6 số từ TikTok.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Thời gian nghỉ giãn cách giữa các tài khoản: <span className="font-mono text-emerald-400 font-bold">{autoRegDelay}s</span>
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={autoRegDelay}
              onChange={(e) => setAutoRegDelay(parseInt(e.target.value) || 10)}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground">
              Nghỉ giãn cách an toàn giúp tránh bị hệ thống TikTok chặn tạo tài khoản liên tục.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
            <p className="font-semibold text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Cách hoạt động (Phương án Bán tự động):
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-indigo-200/80">
              <li>Cửa sổ Chrome sẽ tự động mở lên trên màn hình máy tính của bạn.</li>
              <li>Hệ thống tự động điền Ngày sinh, Email, Mật khẩu và bấm <strong>Send code</strong>.</li>
              <li>Nếu TikTok hiện bảng ghép hình (Captcha), bạn chỉ việc <strong>kéo mảnh ghép 1 cái</strong>.</li>
              <li>Hệ thống tự động lấy mã OTP từ Email, nhập vào TikTok, hoàn tất và lưu Cookie thật vào DB.</li>
            </ol>
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAutoRegModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] hover:bg-[#232D40] text-xs font-medium text-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={autoRegStarting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{autoRegStarting ? "Đang khởi động..." : "Bắt đầu đăng ký tài khoản ngay"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function TikTokAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-xs text-muted-foreground">
          Đang tải giao diện danh sách tài khoản...
        </div>
      }
    >
      <TikTokAccountsContent />
    </Suspense>
  );
}

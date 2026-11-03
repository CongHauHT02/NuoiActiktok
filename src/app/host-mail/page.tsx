"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Activity,
  HardDrive,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Copy,
  Sparkles,
} from "lucide-react";
import { ConnectionBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function HostMailPage() {
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<"hosts" | "generator">("hosts");
  const [loading, setLoading] = useState(true);
  const [hosts, setHosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<any>(null);
  const [testingHostId, setTestingHostId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    serverAddress: "",
    protocol: "IMAP",
    port: 993,
    username: "",
    password: "",
    apiKey: "",
    storageLimitMb: 5000,
  });

  // Generator State
  const [generatorForm, setGeneratorForm] = useState({
    formatType: "RANDOM_DOMAIN",
    domain: "",
    prefix: "",
    suffix: "",
    baseUsername: "user",
    length: 8,
    allowedChars: "alphanumeric",
    customPattern: "{prefix}_{random}@{domain}",
    quantity: 20,
  });
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any>(null);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mail-hosts");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setHosts(json.data || []);
      if (json.data && json.data.length > 0 && !generatorForm.domain) {
        setGeneratorForm((prev) => ({ ...prev, domain: json.data[0].domain }));
      }
    } catch (err: any) {
      toastError("Lỗi tải danh sách Host Mail", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleOpenAdd = () => {
    setEditingHost(null);
    setFormData({
      name: "",
      domain: "",
      serverAddress: "",
      protocol: "IMAP",
      port: 993,
      username: "",
      password: "",
      apiKey: "",
      storageLimitMb: 5000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (host: any) => {
    setEditingHost(host);
    setFormData({
      name: host.name,
      domain: host.domain,
      serverAddress: host.serverAddress,
      protocol: host.protocol,
      port: host.port,
      username: host.username,
      password: "••••••••",
      apiKey: host.apiKeyEncrypted ? "••••••••" : "",
      storageLimitMb: host.storageLimitMb,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingHost ? `/api/mail-hosts/${editingHost.id}` : "/api/mail-hosts";
      const method = editingHost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success(json.message || "Lưu cấu hình Host Mail thành công");
      setIsModalOpen(false);
      fetchHosts();
    } catch (err: any) {
      toastError("Không thể lưu cấu hình", err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Host Mail "${name}"? Hành động này không thể hoàn tác.`)) return;

    try {
      const res = await fetch(`/api/mail-hosts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã xóa Host Mail thành công");
      fetchHosts();
    } catch (err: any) {
      toastError("Không thể xóa Host Mail", err.message);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingHostId(id);
      info("Đang kiểm tra kết nối...", "Thực hiện handshake tới máy chủ mail");
      const res = await fetch(`/api/mail-hosts/${id}/test`, { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      if (json.success) {
        success("Kết nối thành công", `Độ trễ phản hồi: ${json.latencyMs}ms`);
      } else {
        toastError("Kiểm tra kết nối thất bại", json.message);
      }
      fetchHosts();
    } catch (err: any) {
      toastError("Lỗi kết nối", err.message);
    } finally {
      setTestingHostId(null);
    }
  };

  const handleGenerateEmails = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/email-rules/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatorForm),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGeneratedResults(json);
      success("Đã tạo danh sách email thành công", `Tạo được ${json.summary.totalGenerated} email`);
    } catch (err: any) {
      toastError("Lỗi tạo email", err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportGeneratedCsv = () => {
    if (!generatedResults || !generatedResults.data) return;
    const headers = ["STT", "Email", "Trạng thái", "Trùng lặp"];
    const rows = generatedResults.data.map((r: any) => [
      r.index,
      r.email,
      r.status,
      r.isDuplicate ? "Có" : "Không",
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emails_${generatorForm.domain}_${Date.now()}.csv`;
    a.click();
    success("Đã tải xuống tệp CSV");
  };

  // Filtered hosts
  const filteredHosts = hosts.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.serverAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Quản lý Host Mail & Định dạng Email</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              Module Hạ tầng
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu hình các máy chủ Host Mail tập trung, bảo vệ chứng thực bí mật và quy tắc tạo địa chỉ email tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#111620] p-1 rounded-lg border border-border flex items-center">
            <button
              onClick={() => setActiveTab("hosts")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "hosts" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Danh sách Host Mail
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "generator" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quy tắc tạo Email
            </button>
          </div>

          {activeTab === "hosts" && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Host Mail</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "hosts" ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border border-card-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên host, domain, địa chỉ server..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111620] border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CONNECTED">Đã kết nối</option>
                <option value="ERROR">Gặp lỗi</option>
                <option value="DISCONNECTED">Ngắt kết nối</option>
              </select>

              <button
                onClick={fetchHosts}
                className="p-2 rounded-lg bg-[#111620] hover:bg-[#1C2536] border border-border text-slate-300 hover:text-white transition-colors"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Host Mail Table */}
          <div className="rounded-xl bg-card border border-card-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111620] border-b border-card-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Host Mail</th>
                    <th className="px-5 py-3">Domain</th>
                    <th className="px-5 py-3">Địa chỉ máy chủ & Port</th>
                    <th className="px-5 py-3">Tài khoản Email</th>
                    <th className="px-5 py-3">Dung lượng / Quota</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredHosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        {loading ? "Đang tải dữ liệu..." : "Không tìm thấy Host Mail nào phù hợp."}
                      </td>
                    </tr>
                  ) : (
                    filteredHosts.map((host) => {
                      const usedPercent = Math.round((host.storageUsedMb / host.storageLimitMb) * 100);
                      const isTesting = testingHostId === host.id;

                      return (
                        <tr key={host.id} className="hover:bg-[#111620]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <Server className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground block">{host.name}</span>
                                <span className="text-[11px] text-muted-foreground">User: {host.username}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="font-mono font-medium text-slate-300 bg-[#111620] px-2 py-0.5 rounded border border-border">
                              {host.domain}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="text-slate-300 font-mono text-[11px]">
                              {host.serverAddress}
                              <span className="text-primary ml-1">:{host.port}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              Giao thức: {host.protocol}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-foreground font-mono">{host.emailCount || 0}</span>
                            <span className="text-muted-foreground text-[11px] ml-1">hộp thư</span>
                          </td>

                          <td className="px-5 py-3.5 w-48">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">{usedPercent}%</span>
                                <span className="text-muted-foreground font-mono">
                                  {Math.round(host.storageUsedMb)} / {host.storageLimitMb} MB
                                </span>
                              </div>
                              <div className="w-full bg-[#111620] h-1.5 rounded-full overflow-hidden border border-border/50">
                                <div
                                  className={`h-full rounded-full ${
                                    usedPercent > 90 ? "bg-rose-500" : usedPercent > 70 ? "bg-amber-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${Math.min(100, usedPercent)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <ConnectionBadge status={host.status} />
                            {host.errorMessage && (
                              <p className="text-[10px] text-rose-400 mt-0.5 max-w-[180px] truncate" title={host.errorMessage}>
                                {host.errorMessage}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTestConnection(host.id)}
                                disabled={isTesting}
                                className="px-2.5 py-1 rounded bg-[#1C2536] hover:bg-[#232D40] text-slate-300 hover:text-white border border-border text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                                title="Kiểm tra kết nối tới máy chủ"
                              >
                                <Activity className={`w-3 h-3 ${isTesting ? "animate-spin text-primary" : "text-emerald-400"}`} />
                                <span>{isTesting ? "Đang thử..." : "Test"}</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(host)}
                                className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-slate-300 hover:text-white border border-border transition-colors"
                                title="Chỉnh sửa cấu hình"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(host.id, host.name)}
                                className="p-1.5 rounded bg-[#1C2536] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-border transition-colors"
                                title="Xóa Host Mail"
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
          </div>
        </>
      ) : (
        /* Module 5: Email Rule Generator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-card border border-card-border space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Quy tắc tạo địa chỉ Email</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sinh hàng loạt địa chỉ email theo cấu hình cho các hệ thống và tài khoản được phép sử dụng.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Kiểu định dạng</label>
                <select
                  value={generatorForm.formatType}
                  onChange={(e) => setGeneratorForm({ ...generatorForm, formatType: e.target.value })}
                  className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="RANDOM_DOMAIN">Random Username + Domain (Khuyên dùng)</option>
                  <option value="PREFIX_DOMAIN">Tiền tố (Prefix) + Random + Domain</option>
                  <option value="USERNAME_DOMAIN">Tên gốc (Base) + Số thứ tự + Domain</option>
                  <option value="CUSTOM">Tùy biến mẫu (Custom Pattern)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Chọn tên miền (Domain)</label>
                <select
                  value={generatorForm.domain}
                  onChange={(e) => setGeneratorForm({ ...generatorForm, domain: e.target.value })}
                  className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                >
                  {hosts.map((h) => (
                    <option key={h.id} value={h.domain}>
                      {h.domain} ({h.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tiền tố (Prefix)</label>
                  <input
                    type="text"
                    placeholder="vd: tt, creator"
                    value={generatorForm.prefix}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, prefix: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Hậu tố (Suffix)</label>
                  <input
                    type="text"
                    placeholder="vd: shop, pro"
                    value={generatorForm.suffix}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, suffix: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {generatorForm.formatType === "USERNAME_DOMAIN" && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Tên gốc (Base Username)</label>
                  <input
                    type="text"
                    value={generatorForm.baseUsername}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, baseUsername: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {generatorForm.formatType === "CUSTOM" && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Mẫu cấu trúc tùy biến</label>
                  <input
                    type="text"
                    value={generatorForm.customPattern}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, customPattern: e.target.value })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Thẻ hỗ trợ: {"{prefix}"}, {"{random}"}, {"{num}"}, {"{domain}"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Độ dài username ngẫu nhiên</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={generatorForm.length}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, length: parseInt(e.target.value) || 8 })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Số lượng cần tạo</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={generatorForm.quantity}
                    onChange={(e) => setGeneratorForm({ ...generatorForm, quantity: parseInt(e.target.value) || 10 })}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Ký tự cho phép</label>
                <select
                  value={generatorForm.allowedChars}
                  onChange={(e) => setGeneratorForm({ ...generatorForm, allowedChars: e.target.value })}
                  className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="alphanumeric">Chữ cái và số (a-z, 0-9)</option>
                  <option value="letters_only">Chỉ chữ cái (a-z)</option>
                  <option value="numeric_only">Chỉ số (0-9)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateEmails}
                disabled={generating || !generatorForm.domain}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                <Sparkles className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                <span>{generating ? "Đang sinh email & kiểm tra trùng..." : "Tạo danh sách & Kiểm tra trùng"}</span>
              </button>
            </div>
          </div>

          {/* Generated Result Preview */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-card-border mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Kết quả danh sách email sinh tự động</h3>
                  {generatedResults && (
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="text-muted-foreground">Tổng: {generatedResults.summary.totalGenerated}</span>
                      <span className="text-emerald-400 font-medium">Hợp lệ: {generatedResults.summary.validCount}</span>
                      <span className="text-rose-400 font-medium">Trùng lặp: {generatedResults.summary.duplicateCount}</span>
                    </div>
                  )}
                </div>

                {generatedResults && (
                  <button
                    onClick={handleExportGeneratedCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV</span>
                  </button>
                )}
              </div>

              <div className="max-h-[460px] overflow-y-auto">
                {!generatedResults ? (
                  <div className="py-20 text-center text-muted-foreground text-xs space-y-2">
                    <Mail className="w-8 h-8 text-slate-500 mx-auto" />
                    <p>Thiết lập các thông số bên trái và bấm &quot;Tạo danh sách&quot; để xem trước.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111620] sticky top-0 text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2 w-12">#</th>
                        <th className="px-4 py-2">Địa chỉ Email</th>
                        <th className="px-4 py-2">Trạng thái trùng lặp</th>
                        <th className="px-4 py-2 text-right">Sao chép</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {generatedResults.data.map((item: any) => (
                        <tr key={item.index} className="hover:bg-[#111620]/50 transition-colors">
                          <td className="px-4 py-2 text-muted-foreground font-mono">{item.index}</td>
                          <td className="px-4 py-2 font-mono font-medium text-foreground">{item.email}</td>
                          <td className="px-4 py-2">
                            {item.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                                <AlertCircle className="w-3 h-3" /> Đã tồn tại trong hệ thống
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Hợp lệ (Sẵn sàng dùng)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.email);
                                success("Đã sao chép email", item.email);
                              }}
                              className="p-1 rounded hover:bg-[#1F293D] text-muted-foreground hover:text-foreground"
                              title="Sao chép"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Host Mail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHost ? `Chỉnh sửa Host Mail: ${editingHost.name}` : "Thêm Host Mail mới"}
        description="Thông tin bí mật (mật khẩu, API key) sẽ được mã hóa an toàn bằng AES-256."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tên Host Mail <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vd: Host US Enterprise 01"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tên miền (Domain) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vd: creatorhost.net"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Địa chỉ máy chủ Mail <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="vd: imap.creatorhost.net"
                value={formData.serverAddress}
                onChange={(e) => setFormData({ ...formData, serverAddress: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Cổng (Port)</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 993 })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Giao thức hỗ trợ</label>
              <select
                value={formData.protocol}
                onChange={(e) => {
                  const proto = e.target.value;
                  let defPort = 993;
                  if (proto === "POP3") defPort = 995;
                  if (proto === "SMTP") defPort = 465;
                  if (proto === "REST_API") defPort = 443;
                  setFormData({ ...formData, protocol: proto, port: defPort });
                }}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="IMAP">IMAP (Port 993 SSL/TLS)</option>
                <option value="POP3">POP3 (Port 995 SSL/TLS)</option>
                <option value="SMTP">SMTP (Port 465 SSL / 587 TLS)</option>
                <option value="REST_API">REST API (HTTP/443)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Giới hạn dung lượng (MB)</label>
              <input
                type="number"
                value={formData.storageLimitMb}
                onChange={(e) => setFormData({ ...formData, storageLimitMb: parseFloat(e.target.value) || 5000 })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Username quản trị <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="vd: admin@creatorhost.net"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Mật khẩu hoặc App Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required={!editingHost}
                placeholder={editingHost ? "Để trống nếu không đổi" : "Nhập mật khẩu an toàn"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">API Key (Tùy chọn)</label>
              <input
                type="password"
                placeholder={editingHost ? "••••••••" : "Khóa API nếu hỗ trợ REST"}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] hover:bg-[#232D40] text-xs font-medium text-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
            >
              {editingHost ? "Lưu thay đổi" : "Thêm Host Mail"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


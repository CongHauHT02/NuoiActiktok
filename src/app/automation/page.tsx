"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings2,
  Trash2,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function AutomationCenterPage() {
  const { success, error: toastError, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "SYNC_ACCOUNTS",
    cronExpression: "0 */6 * * *",
    isEnabled: true,
    rateLimitPerMin: 60,
    retryCount: 3,
    timeoutSeconds: 300,
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setWorkflows(json.data || []);
    } catch (err: any) {
      toastError("Lỗi tải danh sách quy trình", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggleWorkflow = async (wf: any) => {
    try {
      const res = await fetch(`/api/workflows/${wf.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !wf.isEnabled }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success(`Đã ${!wf.isEnabled ? "kích hoạt" : "tắt"} quy trình "${wf.name}"`);
      fetchWorkflows();
    } catch (err: any) {
      toastError("Lỗi cập nhật", err.message);
    }
  };

  const handleRunNow = async (wf: any) => {
    try {
      setRunningWorkflowId(wf.id);
      info("Đang khởi chạy quy trình...", `Quy trình "${wf.name}" đang thực thi trong nền`);

      const res = await fetch(`/api/workflows/${wf.id}/run`, { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã kích hoạt tiến trình tự động hóa!", `Tác vụ: ${json.taskId}`);
      fetchWorkflows();
    } catch (err: any) {
      toastError("Không thể chạy quy trình", err.message);
    } finally {
      setRunningWorkflowId(null);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Tạo quy trình tự động hóa thành công");
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "SYNC_ACCOUNTS",
        cronExpression: "0 */6 * * *",
        isEnabled: true,
        rateLimitPerMin: 60,
        retryCount: 3,
        timeoutSeconds: 300,
      });
      fetchWorkflows();
    } catch (err: any) {
      toastError("Lỗi tạo quy trình", err.message);
    }
  };

  const handleDeleteWorkflow = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quy trình "${name}"?`)) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      success("Đã xóa quy trình thành công");
      fetchWorkflows();
    } catch (err: any) {
      toastError("Lỗi xóa quy trình", err.message);
    }
  };

  const workflowTypeLabels: Record<string, { label: string; color: string }> = {
    SYNC_ACCOUNTS: { label: "Đồng bộ tài khoản", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    CHECK_MAIL_HEALTH: { label: "Sức khỏe Host Mail", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    SYNC_EMAILS: { label: "Hộp thư & OTP", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    AUDIT_REMINDER: { label: "Kiểm toán & Cảnh báo", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    EXPORT_REPORT: { label: "Xuất báo cáo định kỳ", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    OFFICIAL_API_SYNC: { label: "API chính thức", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Trung tâm Tự động hóa (Automation Center)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              Task Engine
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản trị các luồng công việc tự động định kỳ, cơ chế Queue, Retry lỗi kỹ thuật, giới hạn tần suất (Rate limit) và ghi log kiểm toán.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo quy trình mới</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-[#111620] border border-card-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong>Tiêu chuẩn vận hành an toàn:</strong> Chỉ tự động hóa các tác vụ quản lý dữ liệu hợp lệ (đồng bộ thông số, kiểm tra kết nối, tải email, lập báo cáo). Không triển khai spam hay giả lập người dùng.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono font-medium">Bảo vệ 100%</span>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => {
          const typeInfo = workflowTypeLabels[wf.type] || {
            label: wf.type,
            color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
          };
          const isRunning = runningWorkflowId === wf.id;

          return (
            <div
              key={wf.id}
              className={`p-5 rounded-xl bg-card border transition-all flex flex-col justify-between ${
                wf.isEnabled ? "border-card-border" : "border-border/50 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{wf.name}</h3>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    onClick={() => handleToggleWorkflow(wf)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      wf.isEnabled ? "bg-primary" : "bg-zinc-700"
                    }`}
                    title={wf.isEnabled ? "Đang bật (Nhấn để tắt)" : "Đang tắt (Nhấn để bật)"}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        wf.isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {wf.description || "Không có mô tả chi tiết cho quy trình này."}
                </p>

                {/* Automation Parameters Pill */}
                <div className="mt-3 p-3 rounded-lg bg-[#111620] border border-border grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Lịch Cron</span>
                    <span className="font-mono font-medium text-slate-300 text-[11px]">{wf.cronExpression || "Thủ công"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Rate Limit</span>
                    <span className="font-mono font-medium text-slate-300 text-[11px]">{wf.rateLimitPerMin}/phút</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Thử lại khi lỗi</span>
                    <span className="font-mono font-medium text-slate-300 text-[11px]">{wf.retryCount} lần</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Status */}
              <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[11px]">
                    Lần chạy cuối:{" "}
                    {wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Chưa chạy"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedWorkflow(wf);
                      setIsLogsModalOpen(true);
                    }}
                    className="p-1.5 rounded bg-[#111620] hover:bg-[#1C2536] border border-border text-slate-300 hover:text-white transition-colors"
                    title="Xem lịch sử chạy & nhật ký"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteWorkflow(wf.id, wf.name)}
                    className="p-1.5 rounded bg-[#111620] hover:bg-rose-500/20 border border-border text-slate-400 hover:text-rose-400 transition-colors"
                    title="Xóa workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRunNow(wf)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <Play className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                    <span>{isRunning ? "Đang chạy..." : "Chạy ngay"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Workflow Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo quy trình tự động hóa mới"
        description="Thiết lập các tham số chu kỳ, tần suất và cơ chế tự động thử lại."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Tên quy trình <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="vd: Đồng bộ tài khoản TikTok Shop hàng ngày"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Mô tả tác vụ</label>
            <textarea
              rows={2}
              placeholder="Mục đích và phạm vi xử lý của quy trình..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Loại quy trình</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="SYNC_ACCOUNTS">Đồng bộ dữ liệu tài khoản</option>
                <option value="CHECK_MAIL_HEALTH">Kiểm tra kết nối Host Mail</option>
                <option value="SYNC_EMAILS">Đồng bộ email & mã OTP</option>
                <option value="AUDIT_REMINDER">Kiểm toán tài khoản bất thường</option>
                <option value="EXPORT_REPORT">Xuất báo cáo định kỳ</option>
                <option value="OFFICIAL_API_SYNC">Đồng bộ API chính thức</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Biểu thức Cron</label>
              <input
                type="text"
                placeholder="vd: 0 */6 * * *"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Rate Limit / phút</label>
              <input
                type="number"
                value={formData.rateLimitPerMin}
                onChange={(e) => setFormData({ ...formData, rateLimitPerMin: parseInt(e.target.value) || 60 })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Số lần thử lại</label>
              <input
                type="number"
                value={formData.retryCount}
                onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) || 3 })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Timeout (giây)</label>
              <input
                type="number"
                value={formData.timeoutSeconds}
                onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 300 })}
                className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] text-xs font-medium text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
            >
              Lưu và khởi tạo
            </button>
          </div>
        </form>
      </Modal>

      {/* Execution History Modal */}
      {selectedWorkflow && (
        <Modal
          isOpen={isLogsModalOpen}
          onClose={() => setIsLogsModalOpen(false)}
          title={`Lịch sử thực thi: ${selectedWorkflow.name}`}
          description={`Tổng số lượt chạy: ${selectedWorkflow.totalRuns} lượt`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {(!selectedWorkflow.runs || selectedWorkflow.runs.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-10">Chưa có bản ghi thực thi nào.</p>
            ) : (
              <div className="space-y-3">
                {selectedWorkflow.runs.map((run: any) => (
                  <div key={run.id} className="p-3.5 rounded-lg bg-[#111620] border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            run.status === "SUCCESS" ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <span className="font-semibold text-foreground">
                          Lượt chạy #{run.id.slice(-6)} ({run.triggeredBy})
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(run.startedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {run.logs && (
                      <pre className="p-2.5 rounded bg-[#0B0E14] border border-border text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                        {run.logs}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}


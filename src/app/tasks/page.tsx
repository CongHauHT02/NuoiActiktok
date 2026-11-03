"use client";

import React, { useState, useEffect } from "react";
import {
  ListTodo,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function TaskManagerPage() {
  const { success, error: toastError, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Live Task Console Modal
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskLogs, setTaskLogs] = useState<any[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchTerm) params.set("q", searchTerm);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setTasks(json.data || []);
      setStatusCounts(json.statusCounts || {});
      setPagination(json.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch (err: any) {
      toastError("Lỗi tải danh sách tác vụ", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1);
    // Auto-poll running tasks every 5 seconds
    const interval = setInterval(() => {
      fetchTasks(pagination.page);
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleOpenConsole = async (task: any) => {
    setSelectedTask(task);
    setIsConsoleOpen(true);
    try {
      setLoadingLogs(true);
      const res = await fetch(`/api/tasks/${task.id}`);
      const json = await res.json();
      if (json.data && json.data.logs) {
        setTaskLogs(json.data.logs);
      }
    } catch {
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleControlTask = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      success(json.message);
      fetchTasks(pagination.page);
      if (isConsoleOpen && selectedTask?.id === id) {
        handleOpenConsole(selectedTask);
      }
    } catch (err: any) {
      toastError("Thao tác thất bại", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Quản lý Tiến trình Tác vụ (Task Manager)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi tất cả tác vụ nền theo thời gian thực: Nhập hàng loạt, đồng bộ hộp thư, cập nhật trạng thái, kiểm tra hạ tầng.
          </p>
        </div>

        <button
          onClick={() => fetchTasks(pagination.page)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#171E2B] hover:bg-[#232D40] border border-border text-xs text-foreground transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới tiến trình</span>
        </button>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: "ALL", label: "Tất cả tác vụ", count: statusCounts.TOTAL || 0, color: "border-border text-foreground" },
          { id: "RUNNING", label: "Đang chạy", count: statusCounts.RUNNING || 0, color: "border-blue-500/40 text-blue-400 bg-blue-500/5" },
          { id: "COMPLETED", label: "Đã hoàn thành", count: statusCounts.COMPLETED || 0, color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" },
          { id: "FAILED", label: "Thất bại", count: statusCounts.FAILED || 0, color: "border-rose-500/40 text-rose-400 bg-rose-500/5" },
          { id: "PAUSED", label: "Tạm dừng", count: statusCounts.PAUSED || 0, color: "border-amber-500/40 text-amber-400 bg-amber-500/5" },
          { id: "PENDING", label: "Chờ xử lý", count: statusCounts.PENDING || 0, color: "border-slate-500/40 text-slate-400 bg-slate-500/5" },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`p-3 rounded-xl border text-left transition-all ${tab.color} ${
                isSelected ? "ring-2 ring-primary" : "hover:border-slate-500"
              }`}
            >
              <span className="text-[11px] text-muted-foreground block">{tab.label}</span>
              <span className="text-xl font-bold font-mono mt-0.5 block">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Task Table */}
      <div className="rounded-xl bg-card border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111620] border-b border-card-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3 w-28">Task ID</th>
                <th className="px-5 py-3">Tên tác vụ</th>
                <th className="px-5 py-3">Số lượng</th>
                <th className="px-5 py-3 w-48">Tiến trình</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3 text-right">Điều khiển & Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    {loading ? "Đang tải dữ liệu tác vụ..." : "Không có tác vụ nào trong danh sách."}
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#111620]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-muted-foreground text-[11px]">
                      #{task.id.slice(-8)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground">{task.taskName}</div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Loại: {task.type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono font-medium text-slate-200">
                        {task.processedItems} / {task.totalItems}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <ProgressBar percent={task.progressPercent} status={task.status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <TaskStatusBadge status={task.status} />
                      {task.errorDetail && (
                        <p className="text-[10px] text-rose-400 mt-1 max-w-[180px] truncate" title={task.errorDetail}>
                          {task.errorDetail}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-[11px] text-slate-300 font-mono">
                        {task.startedAt ? new Date(task.startedAt).toLocaleTimeString("vi-VN") : "-"}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {task.totalDurationSeconds ? `${task.totalDurationSeconds}s` : "Đang đo..."}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {task.status === "RUNNING" && (
                          <button
                            onClick={() => handleControlTask(task.id, "PAUSE")}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-amber-400 border border-border"
                            title="Tạm dừng tác vụ"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {task.status === "PAUSED" && (
                          <button
                            onClick={() => handleControlTask(task.id, "RESUME")}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-emerald-400 border border-border"
                            title="Tiếp tục tác vụ"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(task.status === "RUNNING" || task.status === "PAUSED") && (
                          <button
                            onClick={() => handleControlTask(task.id, "CANCEL")}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-rose-500/20 text-rose-400 border border-border"
                            title="Hủy bỏ tác vụ"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {task.status === "FAILED" && (
                          <button
                            onClick={() => handleControlTask(task.id, "RETRY")}
                            className="p-1.5 rounded bg-[#1C2536] hover:bg-[#232D40] text-primary border border-border"
                            title="Thử lại tác vụ"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenConsole(task)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-[11px] font-medium"
                          title="Xem Console Logs"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Logs</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-card-border bg-[#111620] flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} tác vụ)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTasks(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              onClick={() => fetchTasks(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Live Task Console Modal */}
      {selectedTask && (
        <Modal
          isOpen={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          title={`Nhật ký Console: ${selectedTask.taskName}`}
          description={`Task ID: ${selectedTask.id} • Tiến trình: ${selectedTask.progressPercent}%`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#111620] border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <TaskStatusBadge status={selectedTask.status} />
                <span className="text-muted-foreground font-mono">
                  Đã xử lý: {selectedTask.processedItems}/{selectedTask.totalItems} mục
                </span>
              </div>

              <button
                onClick={() => handleOpenConsole(selectedTask)}
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? "animate-spin" : ""}`} />
                <span>Làm mới log</span>
              </button>
            </div>

            {/* Terminal Window View */}
            <div className="bg-[#0B0E14] border border-card-border rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-1.5 shadow-inner">
              <div className="text-slate-500 pb-2 border-b border-card-border flex items-center justify-between text-[11px]">
                <span>[TIKTOK_MANAGER_TASK_ENGINE_STDOUT]</span>
                <span>UTF-8</span>
              </div>

              {taskLogs.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">Chưa có nhật ký log nào được ghi nhận cho tác vụ này.</p>
              ) : (
                taskLogs.map((log) => {
                  let color = "text-slate-300";
                  if (log.level === "SUCCESS") color = "text-emerald-400 font-semibold";
                  if (log.level === "WARN") color = "text-amber-400";
                  if (log.level === "ERROR") color = "text-rose-400 font-semibold";

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 shrink-0 text-[11px]">
                        [{new Date(log.timestamp).toLocaleTimeString("vi-VN")}]
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1 rounded ${
                          log.level === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.level === "ERROR"
                            ? "bg-rose-500/20 text-rose-400"
                            : log.level === "WARN"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className={color}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


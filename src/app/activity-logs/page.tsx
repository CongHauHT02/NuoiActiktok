"use client";

import React, { useState, useEffect } from "react";
import { ScrollText, Search, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ActivityLogsPage() {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setLogs(json.data || []);
      setPagination(json.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (err: any) {
      toastError("Lỗi tải nhật ký", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Nhật ký Hoạt động & Kiểm toán (Activity Logs)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              Audit Trail
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lưu vết toàn bộ thao tác thêm, sửa, xóa, chạy quy trình, kiểm tra hạ tầng và đăng nhập trong hệ thống.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#171E2B] hover:bg-[#232D40] border border-border text-xs text-foreground transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-card border border-card-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm người thực hiện, hành động, chi tiết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
            className="w-full bg-[#111620] border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="ALL">Tất cả kết quả</option>
          <option value="SUCCESS">Thành công (SUCCESS)</option>
          <option value="WARNING">Cảnh báo (WARNING)</option>
          <option value="ERROR">Lỗi (ERROR)</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111620] border-b border-card-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3">Người thực hiện</th>
                <th className="px-5 py-3">Hành động</th>
                <th className="px-5 py-3">Đối tượng</th>
                <th className="px-5 py-3">Chi tiết thao tác</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    {loading ? "Đang tải nhật ký..." : "Không có nhật ký nào."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#111620]/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {log.userName || "Hệ thống"}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-primary font-semibold">{log.action}</span>
                    </td>

                    <td className="px-5 py-3.5 text-muted-foreground">{log.resourceType}</td>

                    <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : log.status === "WARNING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {log.status}
                      </span>
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
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} bản ghi)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 rounded bg-[#171E2B] border border-border disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


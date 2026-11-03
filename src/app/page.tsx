"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Mail,
  PlayCircle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { AccountStatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { VideoCampaignModal } from "@/components/campaigns/VideoCampaignModal";

export default function DashboardPage() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      toastError("Lỗi tải dữ liệu Dashboard", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tổng hợp dữ liệu hệ thống...</p>
      </div>
    );
  }

  const { metrics, charts, recentActivities } = data || {
    metrics: {},
    charts: { accountTrend: [], statusDistribution: [], hostStats: [], groups: [] },
    recentActivities: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#171E2B] via-[#111620] to-[#171E2B] border border-card-border relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Tổng quan hệ thống TikTok Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Hệ thống quản lý tập trung và tự động hóa vận hành cho hàng nghìn tài khoản TikTok, Mail Hosts và xác thực email an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mồi tương tác Video</span>
          </button>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C2536] hover:bg-[#232D40] border border-border text-xs text-foreground transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Làm mới</span>
          </button>
          <Link
            href="/accounts?action=import"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập hàng loạt</span>
          </Link>
          <Link
            href="/accounts?action=new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-md shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </Link>
        </div>
      </div>

      {/* 9 Metrics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Accounts */}
        <div className="p-4 rounded-xl bg-card border border-card-border card-hover">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Tổng tài khoản</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{metrics.totalAccounts || 0}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+12% so với tuần trước</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-4 rounded-xl bg-card border border-card-border card-hover">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Đang hoạt động</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.activeAccounts || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Chiếm {metrics.totalAccounts ? Math.round((metrics.activeAccounts / metrics.totalAccounts) * 100) : 0}% tổng tài khoản
          </div>
        </div>

        {/* Unconfigured Accounts */}
        <div className="p-4 rounded-xl bg-card border border-card-border card-hover">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Chưa thiết lập</span>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300">{metrics.unconfiguredAccounts || 0}</div>
          <Link href="/profiles" className="text-[11px] text-primary hover:underline mt-1 inline-block">
            Cấu hình hồ sơ ngay →
          </Link>
        </div>

        {/* Need Check Accounts */}
        <div className="p-4 rounded-xl bg-card border border-card-border card-hover">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Cần kiểm tra</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{metrics.needCheckAccounts || 0}</div>
          <Link href="/accounts?status=NEED_CHECK" className="text-[11px] text-amber-400 hover:underline mt-1 inline-block">
            Xem danh sách cần xử lý →
          </Link>
        </div>

        {/* Error Accounts */}
        <div className="p-4 rounded-xl bg-card border border-card-border card-hover">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Gặp lỗi</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{metrics.errorAccounts || 0}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Cần đồng bộ lại thông tin</div>
        </div>
      </div>

      {/* Second Row KPIs: Host Mail, Emails, Running Tasks, Completed Tasks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-card-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Tổng Host Mail</p>
            <p className="text-xl font-bold font-mono text-foreground mt-1">{metrics.totalMailHosts || 0}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">{metrics.connectedMailHosts || 0} Host kết nối tốt</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Hộp thư & Email</p>
            <p className="text-xl font-bold font-mono text-foreground mt-1">{metrics.totalEmails || 0}</p>
            <p className="text-[11px] text-amber-400 mt-0.5">{metrics.unreadEmails || 0} Email chưa đọc / OTP</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Tác vụ đang chạy</p>
            <p className="text-xl font-bold font-mono text-primary mt-1">{metrics.runningTasks || 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tiến trình nền ổn định</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <PlayCircle className="w-5 h-5 animate-spin" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Tác vụ hoàn thành</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics.completedTasks || 0}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Tỷ lệ thành công 98.4%</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Xu hướng tài khoản theo ngày</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Theo dõi số lượng tài khoản mới và tài khoản hoạt động</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Tổng số
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Đang hoạt động
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.accountTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171E2B",
                    borderColor: "#232D40",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#4F8CFF" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Tổng số" />
                <Area type="monotone" dataKey="active" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" name="Đang hoạt động" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Phân bổ trạng thái</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tỷ lệ tình trạng toàn hệ thống</p>
            </div>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171E2B",
                    borderColor: "#232D40",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-foreground">{metrics.totalAccounts || 0}</span>
              <span className="text-[10px] text-muted-foreground uppercase">Tài khoản</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-card-border">
            {charts.statusDistribution.slice(0, 4).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate">{item.name}:</span>
                <span className="font-mono font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Host Mail Quota / Bar Chart & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Host Mail Stats Bar Chart */}
        <div className="p-5 rounded-xl bg-card border border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tải lượng Host Mail</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Dung lượng sử dụng (%) theo máy chủ</p>
            </div>
            <Link href="/host-mail" className="text-xs text-primary hover:underline">
              Chi tiết →
            </Link>
          </div>

          <div className="space-y-4">
            {charts.hostStats.map((h: any, idx: number) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-[#111620] border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[160px]">{h.name}</span>
                  <span className="font-mono text-muted-foreground">{h.storageUsedPercent}%</span>
                </div>
                <div className="w-full bg-[#171E2B] h-2 rounded-full overflow-hidden border border-border/40">
                  <div
                    className={`h-full rounded-full transition-all ${
                      h.storageUsedPercent > 90
                        ? "bg-rose-500"
                        : h.storageUsedPercent > 70
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(100, h.storageUsedPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{h.domain}</span>
                  <span>{h.emails} email liên kết</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-card-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Lịch sử hoạt động gần đây</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Nhật ký kiểm toán các thao tác trên hệ thống</p>
            </div>
            <Link href="/activity-logs" className="text-xs text-primary hover:underline">
              Xem toàn bộ nhật ký →
            </Link>
          </div>

          <div className="divide-y divide-card-border">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có nhật ký hoạt động nào</p>
            ) : (
              recentActivities.map((act: any) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-[#111620] border border-border text-primary mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{act.details || act.action}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>{act.userName || "Admin"}</span>
                        <span>•</span>
                        <span>{act.ipAddress}</span>
                        <span>•</span>
                        <span className="font-mono">{new Date(act.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      act.status === "SUCCESS"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : act.status === "WARNING"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <VideoCampaignModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users2,
  Server,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useToast } from "@/components/ui/Toast";

export default function StatisticsPage() {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => toastError("Lỗi tải thống kê", err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Báo cáo Thống kê & Phân tích chuyên sâu</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            Analytics
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Biểu đồ hiệu suất vận hành, tỷ lệ tài khoản hoạt động và chỉ số thông lượng hạ tầng Mail Host.
        </p>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Growth Trend */}
        <div className="p-5 rounded-xl bg-card border border-card-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Tốc độ mở rộng tài khoản TikTok</h3>
            <span className="text-xs text-emerald-400 font-mono">+18.5% tháng này</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.accountTrend}>
                <defs>
                  <linearGradient id="areaTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0} />
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
                <Area type="monotone" dataKey="count" stroke="#4F8CFF" strokeWidth={2} fill="url(#areaTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Distribution Bar Chart */}
        <div className="p-5 rounded-xl bg-card border border-card-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Phân bổ tài khoản theo Nhóm</h3>
            <span className="text-xs text-muted-foreground">{charts.groups?.length || 0} nhóm vận hành</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.groups} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171E2B",
                    borderColor: "#232D40",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#4F8CFF" radius={[0, 4, 4, 0]}>
                  {charts.groups?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#4F8CFF"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Host Mail Throughput Bar Chart */}
      <div className="p-5 rounded-xl bg-card border border-card-border space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Hiệu suất và Dung lượng các Host Mail</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {charts.hostStats?.map((h: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-[#111620] border border-border space-y-2">
              <span className="text-xs font-bold text-foreground block truncate">{h.name}</span>
              <p className="text-[11px] text-muted-foreground font-mono">{h.domain}</p>
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-muted-foreground">Tài khoản:</span>
                <span className="font-mono font-bold text-primary">{h.emails}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sử dụng:</span>
                <span className="font-mono font-bold text-emerald-400">{h.storageUsedPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


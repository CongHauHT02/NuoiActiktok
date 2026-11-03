import React from "react";

export function AccountStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    ACTIVE: {
      label: "Đang hoạt động",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    CONFIGURED: {
      label: "Đã thiết lập",
      bg: "bg-blue-500/10 border-blue-500/20",
      text: "text-blue-400",
      dot: "bg-blue-400",
    },
    NEW: {
      label: "Chưa thiết lập",
      bg: "bg-slate-500/10 border-slate-500/20",
      text: "text-slate-400",
      dot: "bg-slate-400",
    },
    NEED_CHECK: {
      label: "Cần kiểm tra",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    ERROR: {
      label: "Gặp lỗi",
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-400",
      dot: "bg-rose-400",
    },
    SUSPENDED: {
      label: "Tạm ngưng",
      bg: "bg-zinc-500/10 border-zinc-500/20",
      text: "text-zinc-400",
      dot: "bg-zinc-400",
    },
  };

  const current = map[status] || {
    label: status,
    bg: "bg-slate-500/10 border-slate-500/20",
    text: "text-slate-400",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function ConnectionBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    CONNECTED: {
      label: "Đã kết nối",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    DISCONNECTED: {
      label: "Ngắt kết nối",
      bg: "bg-slate-500/10 border-slate-500/20",
      text: "text-slate-400",
      dot: "bg-slate-400",
    },
    ERROR: {
      label: "Lỗi kết nối",
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-400",
      dot: "bg-rose-400",
    },
    CHECKING: {
      label: "Đang kiểm tra...",
      bg: "bg-blue-500/10 border-blue-500/20",
      text: "text-blue-400",
      dot: "bg-blue-400 animate-ping",
    },
  };

  const current = map[status] || map.DISCONNECTED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-slate-500/10 border-slate-500/20", text: "text-slate-400" },
    RUNNING: { label: "Đang chạy", bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
    COMPLETED: { label: "Hoàn thành", bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400" },
    FAILED: { label: "Thất bại", bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-400" },
    PAUSED: { label: "Tạm dừng", bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
    CANCELLED: { label: "Đã hủy", bg: "bg-zinc-500/10 border-zinc-500/20", text: "text-zinc-400" },
  };

  const current = map[status] || { label: status, bg: "bg-slate-500/10 border-slate-500/20", text: "text-slate-400" };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${current.bg} ${current.text}`}
    >
      {current.label}
    </span>
  );
}


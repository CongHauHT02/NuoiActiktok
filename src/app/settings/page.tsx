"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Users2,
  Shield,
  Key,
  Database,
  Lock,
  Plus,
  CheckCircle2,
  Save,
  RefreshCw,
  UserCheck,
  Server,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"system" | "users" | "security">("system");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  // User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
    status: "ACTIVE",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([fetch("/api/users"), fetch("/api/settings")]);
      const uJson = await uRes.json();
      const sJson = await sRes.json();

      setUsers(uJson.data || []);
      setSettings(sJson.data || []);
    } catch (err: any) {
      toastError("Lỗi tải thông tin cài đặt", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã tạo người dùng mới thành công");
      setIsUserModalOpen(false);
      setUserFormData({ name: "", email: "", password: "", role: "MEMBER", status: "ACTIVE" });
      fetchData();
    } catch (err: any) {
      toastError("Lỗi tạo người dùng", err.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      success("Đã lưu các cài đặt hệ thống");
    } catch (err: any) {
      toastError("Lỗi lưu cài đặt", err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Cài đặt Hệ thống & Quản lý Phân quyền</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              System Settings & RBAC
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản trị tài khoản quản trị viên, phân quyền vai trò (RBAC), cấu hình bảo mật AES-256 và tham số nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111620] p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "system" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hệ thống
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "users" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Người dùng & RBAC
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "security" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bảo mật
          </button>
        </div>
      </div>

      {activeTab === "system" && (
        <div className="p-6 rounded-xl bg-card border border-card-border space-y-5 max-w-3xl">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span>Tham số cấu hình chung</span>
          </h3>

          <div className="space-y-4">
            {settings.map((s, idx) => (
              <div key={s.id} className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs font-medium text-foreground block font-mono">{s.key}</label>
                  <span className="text-[11px] text-muted-foreground">{s.description}</span>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((prev) =>
                        prev.map((item) => (item.id === s.id ? { ...item, value: val } : item))
                      );
                    }}
                    className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-card-border flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cài đặt</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Danh sách thành viên quản trị ({users.length})</h3>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm người dùng</span>
            </button>
          </div>

          <div className="rounded-xl bg-card border border-card-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111620] border-b border-card-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Họ tên & Email</th>
                  <th className="px-5 py-3">Vai trò (Role)</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Xác thực 2 lớp (2FA)</th>
                  <th className="px-5 py-3">Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#111620]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || "https://images.unsplash.com/photo-1534528741775?w=100"}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-primary/30"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-[11px] text-slate-300">
                        {u.twoFactorEnabled ? "Đã bật (Khuyên dùng)" : "Chưa bật"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="p-5 rounded-xl bg-card border border-card-border space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Mã hóa bí mật (AES-256-GCM)</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tất cả mật khẩu Host Mail, mật khẩu email, mật khẩu tài khoản và API Token đều được mã hóa bằng thuật toán đối xứng AES-256-GCM với IV ngẫu nhiên trước khi lưu vào cơ sở dữ liệu.
            </p>
            <div className="p-3 rounded-lg bg-[#111620] border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trạng thái mã hóa:</span>
              <span className="text-emerald-400 font-bold font-mono">HOẠT ĐỘNG (ENABLED)</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-card-border space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Kiểm toán & Chống lạm dụng</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ghi log toàn bộ phiên truy cập, thao tác hàng loạt, địa chỉ IP và thực thi quy trình vào ActivityLog để đảm bảo khả năng tra cứu nguồn gốc.
            </p>
            <div className="p-3 rounded-lg bg-[#111620] border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Audit Trail:</span>
              <span className="text-primary font-bold font-mono">100% COVERAGE</span>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Thêm người dùng mới vào hệ thống"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Họ và tên <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="vd: Trần Văn Nam"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Email đăng nhập <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="nam@tiktokmanager.io"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Mật khẩu <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Vai trò (Role)</label>
            <select
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="MEMBER">Member (Vận hành tài khoản cơ bản)</option>
              <option value="MANAGER">Manager (Quản lý nhóm và tác vụ)</option>
              <option value="ADMIN">Admin (Quản trị toàn quyền)</option>
              <option value="SUPER_ADMIN">Super Admin (Chủ sở hữu hệ thống)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] text-xs font-medium text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
            >
              Tạo người dùng
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


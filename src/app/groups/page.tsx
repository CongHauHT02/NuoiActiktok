"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Users2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function AccountGroupsPage() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
    color: "#4F8CFF",
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGroups(json.data || []);
      setTags(json.tags || []);
    } catch (err: any) {
      toastError("Lỗi tải danh sách nhóm", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupFormData({ name: "", description: "", color: "#4F8CFF" });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: any) => {
    setEditingGroup(g);
    setGroupFormData({
      name: g.name,
      description: g.description || "",
      color: g.color || "#4F8CFF",
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : "/api/groups";
      const method = editingGroup ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupFormData),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success(json.message);
      setIsGroupModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      toastError("Không thể lưu nhóm", err.message);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm "${name}"? Các tài khoản thuộc nhóm này sẽ chuyển về "Chưa phân nhóm".`)) {
      return;
    }
    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      success("Đã xóa nhóm thành công");
      fetchGroups();
    } catch (err: any) {
      toastError("Lỗi xóa nhóm", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Quản lý Nhóm tài khoản & Thẻ phân loại</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              Account Groups
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân vùng tài khoản theo giai đoạn phát triển: Tài khoản mới, Đã thiết lập, Đang hoạt động, Cần kiểm tra, Tạm ngưng.
          </p>
        </div>

        <button
          onClick={handleOpenAddGroup}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhóm mới</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-5 rounded-xl bg-card border border-card-border flex flex-col justify-between card-hover relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: group.color }}
            />

            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="text-sm font-bold text-foreground">{group.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditGroup(group)}
                    className="p-1 rounded hover:bg-[#111620] text-muted-foreground hover:text-foreground transition-colors"
                    title="Sửa nhóm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="p-1 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
                    title="Xóa nhóm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                {group.description || "Không có mô tả cho nhóm này."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Users2 className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold">{group.accountsCount || 0}</span>
                <span className="text-muted-foreground">tài khoản</span>
              </div>

              <a
                href={`/accounts?groupId=${group.id}`}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Xem danh sách →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Tags Section */}
      <div className="p-5 rounded-xl bg-card border border-card-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Thẻ phân loại bổ sung (Tags)</h3>
          </div>
          <span className="text-xs text-muted-foreground">{tags.length} thẻ đang được dùng</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[#111620]"
              style={{ borderColor: `${tag.color}40` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="text-xs font-medium text-foreground">{tag.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground bg-[#171E2B] px-1.5 py-0.5 rounded">
                {tag.accountsCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? `Chỉnh sửa nhóm: ${editingGroup.name}` : "Tạo nhóm tài khoản mới"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Tên nhóm <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="vd: TikTok Shop Affiliate US"
              value={groupFormData.name}
              onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Mô tả mục đích nhóm</label>
            <textarea
              rows={3}
              placeholder="Mô tả tiêu chuẩn phân loại, yêu cầu vận hành..."
              value={groupFormData.description}
              onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
              className="w-full bg-[#111620] border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Mã màu nhận diện</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={groupFormData.color}
                onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                className="w-10 h-10 rounded border border-border bg-[#111620] cursor-pointer"
              />
              <input
                type="text"
                value={groupFormData.color}
                onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                className="w-32 bg-[#111620] border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#1C2536] text-xs font-medium text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-md shadow-primary/20"
            >
              {editingGroup ? "Lưu thay đổi" : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Link2,
  Play,
  Heart,
  Bookmark,
  MessageSquare,
  Clock,
  Users2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface VideoCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: any[];
}

export function VideoCampaignModal({ isOpen, onClose, groups = [] }: VideoCampaignModalProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [videoUrl, setVideoUrl] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [groupId, setGroupId] = useState("ALL");
  const [accountCount, setAccountCount] = useState(5);
  const [delaySeconds, setDelaySeconds] = useState(10);

  // Target Actions
  const [actions, setActions] = useState({
    watch: true,
    bookmark: true,
    comment: true,
    like: true,
  });

  // Comments
  const [commentsText, setCommentsText] = useState(
    `Sản phẩm này còn hàng không shop ơi?
Đoạn này hướng dẫn chi tiết và dễ hiểu ghê!
Ship về tỉnh mất bao nhiêu ngày nhận được vậy bạn?
Cách này hay quá, mình lưu lại áp dụng ngay.`
  );

  // Parse Video URL preview
  const parsedInfo = React.useMemo(() => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/@([a-zA-Z0-9._]+)\/video\/(\d+)/);
    if (match) {
      return {
        handle: `@${match[1]}`,
        videoId: match[2],
        valid: true,
      };
    }
    return {
      handle: "Định dạng hợp lệ",
      videoId: "...",
      valid: videoUrl.includes("tiktok.com"),
    };
  }, [videoUrl]);

  // Insert comment template presets
  const handleInsertTemplate = (type: "question" | "compliment" | "discussion") => {
    const templates = {
      question: [
        "Shop cho mình xin thêm thông tin với ạ!",
        "Chất lượng thực tế có đúng như trong video không bạn?",
        "Tư vấn cho mình size phù hợp với shop ơi!",
      ],
      compliment: [
        "Nội dung quá hay và giá trị luôn ạ!",
        "Kênh làm video chỉn chu xuất sắc, follow ngay!",
        "Đúng thông tin mình đang tìm bấy lâu nay, cảm ơn bạn nhiều!",
      ],
      discussion: [
        "Mình thấy phương án này dùng ổn áp nhất nè.",
        "Mọi người đã thử chưa, cho mình xin ít review với?",
        "Đoạn 0:15 xem cuốn ghê, bất ngờ thật sự!",
      ],
    };

    const added = templates[type].join("\n");
    setCommentsText((prev) => (prev ? `${prev}\n${added}` : added));
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() || !videoUrl.includes("tiktok.com")) {
      toastError("Vui lòng nhập đúng đường dẫn video TikTok hợp lệ");
      return;
    }

    const commentsArray = commentsText
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      setSubmitting(true);
      const res = await fetch("/api/campaigns/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          campaignName: campaignName.trim(),
          targetActions: actions,
          comments: commentsArray,
          groupId,
          accountCount,
          delaySeconds,
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      success("Đã khởi chạy chiến dịch mồi tương tác video!", `Đang chuyển tới Task Manager...`);
      onClose();
      router.push("/tasks");
    } catch (err: any) {
      toastError("Không thể tạo chiến dịch", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thiết lập Chiến dịch Mồi tương tác Video (Video Seeding)"
      description="Điều phối dàn tài khoản vệ tinh xem hết video, thả tym, lưu yêu thích và bình luận tự nhiên để kích hoạt thuật toán TikTok."
      maxWidth="2xl"
    >
      <form onSubmit={handleLaunchCampaign} className="space-y-4">
        {/* Step 1: Video URL Input */}
        <div>
          <label className="text-xs font-semibold text-slate-200 block mb-1">
            Đường dẫn Video TikTok (Video Link) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              required
              placeholder="https://www.tiktok.com/@username/video/73918291029381928"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-[#111620] border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
            />
          </div>

          {parsedInfo && parsedInfo.valid && (
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Nhận diện kênh: <strong>{parsedInfo.handle}</strong> • Video ID: <strong>{parsedInfo.videoId}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Campaign Name */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">Tên chiến dịch (Tùy chọn)</label>
          <input
            type="text"
            placeholder="vd: Đẩy tương tác video Khuyến mãi 11.11"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full bg-[#111620] border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Step 2: Target Action Toggles */}
        <div>
          <label className="text-xs font-semibold text-slate-200 block mb-1.5">
            Các hành vi mồi tương tác tự nhiên:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Watch */}
            <div
              onClick={() => setActions({ ...actions, watch: !actions.watch })}
              className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                actions.watch ? "bg-primary/10 border-primary text-foreground" : "bg-[#111620] border-border text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <Play className="w-4 h-4 text-primary" />
                <span className={`w-2 h-2 rounded-full ${actions.watch ? "bg-primary" : "bg-slate-600"}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold block">Xem hết video</span>
                <span className="text-[10px] text-muted-foreground">Watch Time 100%</span>
              </div>
            </div>

            {/* Bookmark */}
            <div
              onClick={() => setActions({ ...actions, bookmark: !actions.bookmark })}
              className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                actions.bookmark ? "bg-amber-500/10 border-amber-500 text-foreground" : "bg-[#111620] border-border text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className={`w-2 h-2 rounded-full ${actions.bookmark ? "bg-amber-400" : "bg-slate-600"}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold block">Lưu yêu thích</span>
                <span className="text-[10px] text-muted-foreground">Bookmark (+4 điểm)</span>
              </div>
            </div>

            {/* Comment */}
            <div
              onClick={() => setActions({ ...actions, comment: !actions.comment })}
              className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                actions.comment ? "bg-emerald-500/10 border-emerald-500 text-foreground" : "bg-[#111620] border-border text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className={`w-2 h-2 rounded-full ${actions.comment ? "bg-emerald-400" : "bg-slate-600"}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold block">Bình luận mồi</span>
                <span className="text-[10px] text-muted-foreground">Comment (+3 điểm)</span>
              </div>
            </div>

            {/* Like */}
            <div
              onClick={() => setActions({ ...actions, like: !actions.like })}
              className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                actions.like ? "bg-rose-500/10 border-rose-500 text-foreground" : "bg-[#111620] border-border text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className={`w-2 h-2 rounded-full ${actions.like ? "bg-rose-500" : "bg-slate-600"}`} />
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold block">Thả Tym</span>
                <span className="text-[10px] text-muted-foreground">Tym sau khi xem</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Comments Script Composer (if comment action enabled) */}
        {actions.comment && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Kịch bản bình luận Seeding (Mỗi dòng một bình luận):
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Thêm mẫu:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("question")}
                  className="px-2 py-0.5 rounded bg-[#111620] hover:bg-[#1C2536] border border-border text-[10px] text-primary"
                >
                  + Hỏi mua
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("compliment")}
                  className="px-2 py-0.5 rounded bg-[#111620] hover:bg-[#1C2536] border border-border text-[10px] text-emerald-400"
                >
                  + Khen ngợi
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate("discussion")}
                  className="px-2 py-0.5 rounded bg-[#111620] hover:bg-[#1C2536] border border-border text-[10px] text-amber-400"
                >
                  + Tranh luận
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={commentsText}
              onChange={(e) => setCommentsText(e.target.value)}
              className="w-full bg-[#111620] border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:border-primary leading-relaxed font-sans"
              placeholder="Nhập danh sách câu bình luận mồi..."
            />
          </div>
        )}

        {/* Step 4: Satellite Accounts & Natural Delay */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#111620] border border-border">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nhóm tài khoản tham gia</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-[#171E2B] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="ALL">Tất cả tài khoản hoạt động</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Số tài khoản mồi</label>
              <span className="font-mono text-primary text-xs font-bold">{accountCount} tài khoản</span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              value={accountCount}
              onChange={(e) => setAccountCount(parseInt(e.target.value) || 5)}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Giãn cách an toàn</label>
              <span className="font-mono text-emerald-400 text-xs font-bold">{delaySeconds}s / tài khoản</span>
            </div>
            <input
              type="range"
              min={5}
              max={45}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 10)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-card-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Tiến trình sẽ được quản lý và cập nhật % trong Task Manager.</span>
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1C2536] hover:bg-[#232D40] text-xs font-medium text-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
              <span>{submitting ? "Đang khởi tạo..." : "Khởi chạy chiến dịch ngay"}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}


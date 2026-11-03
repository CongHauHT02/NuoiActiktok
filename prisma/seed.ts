import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY = "0123456789abcdef0123456789abcdef";

function encrypt(text: string): string {
  if (!text) return "";
  try {
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || DEFAULT_KEY, "tiktok-salt-2026", 32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch {
    return text;
  }
}

async function main() {
  console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...");

  // 1. Dọn dẹp dữ liệu cũ
  await prisma.taskLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.accountProfile.deleteMany();
  await prisma.profileTemplate.deleteMany();
  await prisma.tikTokAccount.deleteMany();
  await prisma.accountTag.deleteMany();
  await prisma.accountGroup.deleteMany();
  await prisma.emailAccount.deleteMany();
  await prisma.mailHost.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. Tạo Người dùng (Users)
  const passwordHash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@tiktokmanager.io",
      name: "Nguyễn Hoàng Nam",
      password: passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      twoFactorEnabled: true,
      lastLoginAt: new Date(),
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@tiktokmanager.io",
      name: "Trần Minh Quân",
      password: passwordHash,
      role: "MANAGER",
      status: "ACTIVE",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      lastLoginAt: new Date(Date.now() - 3600000 * 5),
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: "operator@tiktokmanager.io",
      name: "Lê Thu Hà",
      password: passwordHash,
      role: "MEMBER",
      status: "ACTIVE",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      lastLoginAt: new Date(Date.now() - 3600000 * 24),
    },
  });

  console.log("✅ Đã tạo 3 người dùng (Admin, Manager, Member)");

  // 3. Tạo Nhóm tài khoản (Account Groups)
  const groupNew = await prisma.accountGroup.create({
    data: {
      name: "Tài khoản mới",
      description: "Tài khoản vừa nhập vào hệ thống, chưa thiết lập thông tin cơ bản.",
      color: "#94A3B8",
      isDefault: true,
    },
  });

  const groupConfigured = await prisma.accountGroup.create({
    data: {
      name: "Tài khoản đã thiết lập",
      description: "Đã hoàn thành thiết lập Avatar, Bio, thông tin hồ sơ và bảo mật email.",
      color: "#4F8CFF",
    },
  });

  const groupActive = await prisma.accountGroup.create({
    data: {
      name: "Tài khoản đang hoạt động",
      description: "Tài khoản đang vận hành định kỳ và tương tác ổn định.",
      color: "#22C55E",
    },
  });

  const groupNeedCheck = await prisma.accountGroup.create({
    data: {
      name: "Cần kiểm tra",
      description: "Cần rà soát kết nối, thông tin xác thực hoặc cảnh báo an toàn từ nền tảng.",
      color: "#F59E0B",
    },
  });

  const groupSuspended = await prisma.accountGroup.create({
    data: {
      name: "Tạm ngưng",
      description: "Tài khoản đang trong trạng thái nghỉ hoặc chờ tái cấu trúc.",
      color: "#EF4444",
    },
  });

  console.log("✅ Đã tạo 5 nhóm tài khoản");

  // 4. Tạo Thẻ / Nhãn (Tags)
  const tagShop = await prisma.accountTag.create({ data: { name: "TikTok Shop", color: "#EC4899" } });
  const tagCreator = await prisma.accountTag.create({ data: { name: "Creator Beta", color: "#8B5CF6" } });
  const tagUS = await prisma.accountTag.create({ data: { name: "Target US", color: "#3B82F6" } });
  const tagVN = await prisma.accountTag.create({ data: { name: "Target VN", color: "#10B981" } });
  const tagAffiliate = await prisma.accountTag.create({ data: { name: "Affiliate", color: "#F59E0B" } });

  // 5. Tạo Mail Hosts
  const host1 = await prisma.mailHost.create({
    data: {
      name: "Host Enterprise US 01",
      domain: "creatorhost.net",
      serverAddress: "imap.creatorhost.net",
      protocol: "IMAP",
      port: 993,
      username: "admin@creatorhost.net",
      passwordEncrypted: encrypt("HostSecretPass2026!"),
      status: "CONNECTED",
      storageUsedMb: 1420.5,
      storageLimitMb: 5000,
      lastCheckedAt: new Date(),
    },
  });

  const host2 = await prisma.mailHost.create({
    data: {
      name: "Host Vietnam FastMail",
      domain: "vietmedia.io",
      serverAddress: "mail.vietmedia.io",
      protocol: "IMAP",
      port: 993,
      username: "postmaster@vietmedia.io",
      passwordEncrypted: encrypt("VietMediaSafe@99"),
      status: "CONNECTED",
      storageUsedMb: 850.0,
      storageLimitMb: 3000,
      lastCheckedAt: new Date(Date.now() - 1000 * 60 * 15),
    },
  });

  const host3 = await prisma.mailHost.create({
    data: {
      name: "API Relay Mail Server",
      domain: "relay-cloud.org",
      serverAddress: "https://api.relay-cloud.org/v1",
      protocol: "REST_API",
      port: 443,
      username: "api_service_account",
      passwordEncrypted: encrypt("Token_Relay_77382"),
      apiKeyEncrypted: encrypt("rk_live_99834198273615412"),
      status: "CONNECTED",
      storageUsedMb: 320.4,
      storageLimitMb: 10000,
      lastCheckedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  });

  const host4 = await prisma.mailHost.create({
    data: {
      name: "Backup Host Alpha",
      domain: "alphamail.biz",
      serverAddress: "pop.alphamail.biz",
      protocol: "POP3",
      port: 995,
      username: "sysadmin@alphamail.biz",
      passwordEncrypted: encrypt("AlphaSys_Secret_12"),
      status: "ERROR",
      errorMessage: "Connection timeout on port 995. Quota warning: 96% full.",
      storageUsedMb: 4820.0,
      storageLimitMb: 5000,
      lastCheckedAt: new Date(Date.now() - 1000 * 3600 * 2),
    },
  });

  console.log("✅ Đã tạo 4 Host Mail");

  // 6. Tạo Email Accounts & Email Messages
  const emailSamples = [
    { email: "user.alex01@creatorhost.net", host: host1 },
    { email: "sarah.media@creatorhost.net", host: host1 },
    { email: "growth.lead@creatorhost.net", host: host1 },
    { email: "viet.anh92@vietmedia.io", host: host2 },
    { email: "mai.linh.shop@vietmedia.io", host: host2 },
    { email: "hoang.nam.creator@vietmedia.io", host: host2 },
    { email: "bot.verify@relay-cloud.org", host: host3 },
    { email: "affiliate.pro@relay-cloud.org", host: host3 },
  ];

  const createdEmails = [];
  for (const item of emailSamples) {
    const acc = await prisma.emailAccount.create({
      data: {
        email: item.email,
        mailHostId: item.host.id,
        status: "ACTIVE",
        unreadCount: Math.floor(Math.random() * 4) + 1,
        totalCount: Math.floor(Math.random() * 30) + 10,
        lastSyncAt: new Date(),
      },
    });
    createdEmails.push(acc);
  }

  // Thêm tin nhắn email (OTP, Security, Thông báo)
  await prisma.emailMessage.create({
    data: {
      mailHostId: host1.id,
      emailAccountId: createdEmails[0].id,
      sender: "no-reply@account.tiktok.com",
      recipient: "user.alex01@creatorhost.net",
      subject: "849201 là mã xác minh tài khoản TikTok của bạn",
      category: "VERIFICATION_CODE",
      verificationCode: "849201",
      bodyText: "Xin chào Alex,\n\nMã xác minh một lần (OTP) của bạn là 849201. Mã này có hiệu lực trong vòng 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.",
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;background:#171E2B;color:#F1F5F9;border-radius:8px;">
        <h2 style="color:#4F8CFF;">Xác minh tài khoản TikTok</h2>
        <p>Mã xác nhận bảo mật của bạn là:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#22C55E;margin:16px 0;">849201</div>
        <p style="color:#94A3B8;font-size:13px;">Mã này có hiệu lực trong 10 phút.</p>
      </div>`,
      isRead: false,
      receivedAt: new Date(Date.now() - 1000 * 60 * 12),
    },
  });

  await prisma.emailMessage.create({
    data: {
      mailHostId: host2.id,
      emailAccountId: createdEmails[3].id,
      sender: "security@account.tiktok.com",
      recipient: "viet.anh92@vietmedia.io",
      subject: "Cảnh báo bảo mật: Phát hiện đăng nhập từ thiết bị mới",
      category: "SECURITY_ALERT",
      bodyText: "Tài khoản của bạn vừa có lượt đăng nhập mới từ IP 118.69.12.44 (Hà Nội, Việt Nam). Nếu đây là bạn, bạn có thể bỏ qua thông báo này.",
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;background:#171E2B;color:#F1F5F9;border-radius:8px;">
        <h2 style="color:#F59E0B;">Cảnh báo bảo mật TikTok</h2>
        <p>Phát hiện phiên đăng nhập mới tại <strong>Hà Nội, VN</strong> lúc 09:30.</p>
        <p style="color:#94A3B8;">Nếu không phải bạn, hãy đổi mật khẩu ngay lập tức.</p>
      </div>`,
      isRead: true,
      receivedAt: new Date(Date.now() - 1000 * 3600 * 3),
    },
  });

  await prisma.emailMessage.create({
    data: {
      mailHostId: host2.id,
      emailAccountId: createdEmails[4].id,
      sender: "no-reply@account.tiktok.com",
      recipient: "mai.linh.shop@vietmedia.io",
      subject: "392018 là mã xác nhận liên kết địa chỉ email",
      category: "VERIFICATION_CODE",
      verificationCode: "392018",
      bodyText: "Mã OTP xác thực email liên kết tài khoản TikTok Shop của bạn là 392018.",
      bodyHtml: `<div style="font-family:sans-serif;padding:20px;background:#171E2B;color:#F1F5F9;border-radius:8px;">
        <h2 style="color:#4F8CFF;">Liên kết Email TikTok Shop</h2>
        <p>Mã OTP liên kết của bạn là:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#22C55E;margin:16px 0;">392018</div>
      </div>`,
      isRead: false,
      receivedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
  });

  await prisma.emailMessage.create({
    data: {
      mailHostId: host1.id,
      emailAccountId: createdEmails[1].id,
      sender: "creator-notifications@tiktok.com",
      recipient: "sarah.media@creatorhost.net",
      subject: "Báo cáo hiệu suất tuần: Video của bạn đạt 120.000 lượt xem",
      category: "NOTIFICATION",
      bodyText: "Tuần qua kênh của bạn đã nhận được hơn 120.000 lượt xem và tăng thêm 1.450 người theo dõi mới.",
      isRead: true,
      receivedAt: new Date(Date.now() - 1000 * 3600 * 18),
    },
  });

  console.log("✅ Đã tạo 8 tài khoản email và các tin nhắn mẫu");

  // 7. Tạo Profile Templates
  const tplCreatorUS = await prisma.profileTemplate.create({
    data: {
      name: "Creator US - Gaming & Tech",
      category: "Creator",
      bioSample: "🎮 Daily Gaming & Tech Highlights | 📩 Collabs: dm or email | 🇺🇸 Based in CA",
      country: "US",
      language: "en",
      avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
    },
  });

  const tplShopVN = await prisma.profileTemplate.create({
    data: {
      name: "TikTok Shop VN - Thời trang & Mỹ phẩm",
      category: "Affiliate",
      bioSample: "✨ Cập nhật xu hướng thời trang mới nhất | 🛍️ Link mua sắm bên dưới 👇 | Freeship toàn quốc",
      country: "VN",
      language: "vi",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const tplTechVN = await prisma.profileTemplate.create({
    data: {
      name: "Reviewer Công nghệ & AI",
      category: "Business",
      bioSample: "⚡ Đánh giá thiết bị công nghệ & AI Tools thực chiến | 🚀 Chia sẻ mẹo hữu ích mỗi ngày",
      country: "VN",
      language: "vi",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 8. Tạo 75 tài khoản TikTok thực tế với nhiều trạng thái và nhóm
  const firstNames = ["Alex", "Sarah", "John", "Emily", "David", "Jessica", "Michael", "Chloe", "Kevin", "Mia", "Daniel", "Linh", "Huy", "Anh", "Mai", "Duc", "Phuong", "Quang", "Trang", "Tuan"];
  const niches = ["vlogs", "tech", "gaming", "daily", "style", "foodie", "fit", "travel", "shop", "review"];
  const statuses = ["ACTIVE", "CONFIGURED", "NEW", "NEED_CHECK", "ERROR", "SUSPENDED"];
  const groups = [groupActive, groupConfigured, groupNew, groupNeedCheck, groupSuspended];

  console.log("⚡ Đang tạo danh sách 75 tài khoản TikTok...");

  for (let i = 1; i <= 75; i++) {
    const fn = firstNames[i % firstNames.length];
    const niche = niches[i % niches.length];
    const username = `${fn.toLowerCase()}_${niche}_${100 + i}`;
    const displayName = `${fn} ${niche.charAt(0).toUpperCase() + niche.slice(1)}`;
    const email = `${username}@${i % 2 === 0 ? "creatorhost.net" : "vietmedia.io"}`;
    
    // Phân bổ trạng thái
    let status = "ACTIVE";
    let grp = groupActive;
    if (i % 6 === 0) {
      status = "NEED_CHECK";
      grp = groupNeedCheck;
    } else if (i % 7 === 0) {
      status = "ERROR";
      grp = groupNeedCheck;
    } else if (i % 5 === 0) {
      status = "CONFIGURED";
      grp = groupConfigured;
    } else if (i % 8 === 0) {
      status = "NEW";
      grp = groupNew;
    } else if (i % 19 === 0) {
      status = "SUSPENDED";
      grp = groupSuspended;
    }

    const followers = status === "ACTIVE" ? Math.floor(Math.random() * 85000) + 1200 : Math.floor(Math.random() * 500);
    const likes = followers * (Math.floor(Math.random() * 5) + 3);
    const videos = status === "ACTIVE" ? Math.floor(Math.random() * 60) + 5 : Math.floor(Math.random() * 3);

    const account = await prisma.tikTokAccount.create({
      data: {
        username,
        displayName,
        email,
        passwordEncrypted: encrypt(`Pass@TT_${i}_Secure`),
        tiktokUid: `tt_uid_${84920000 + i}`,
        birthDate: `199${(i % 9) + 1}-0${(i % 8) + 1}-1${(i % 8) + 1}`,
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (i * 1234567) % 50000000}?w=150&auto=format&fit=crop&q=80`,
        bio: `${displayName} 🎯 Chia sẻ nội dung ${niche} chất lượng cao. Liên hệ cộng tác: ${email}`,
        country: i % 3 === 0 ? "US" : "VN",
        language: i % 3 === 0 ? "en" : "vi",
        status,
        groupId: grp.id,
        notes: status === "NEED_CHECK" ? "Cần kiểm tra trạng thái xác thực email và kết nối proxy" : (status === "ERROR" ? "Báo lỗi xác thực thông tin đăng nhập" : null),
        followersCount: followers,
        followingCount: Math.floor(Math.random() * 200) + 20,
        likesCount: likes,
        videosCount: videos,
        lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
        lastSyncAt: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 12)),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)),
      },
    });

    // Tạo hồ sơ AccountProfile
    await prisma.accountProfile.create({
      data: {
        tiktokAccountId: account.id,
        setupStatus: status === "ACTIVE" || status === "CONFIGURED" ? "COMPLETED" : (status === "NEW" ? "PENDING" : "IN_PROGRESS"),
        targetDisplayName: displayName,
        targetBio: account.bio,
        targetCountry: account.country,
        targetLanguage: account.language,
        templateId: account.country === "US" ? tplCreatorUS.id : tplShopVN.id,
        completedAt: status === "ACTIVE" || status === "CONFIGURED" ? new Date() : null,
      },
    });
  }

  console.log("✅ Đã tạo 75 tài khoản TikTok cùng hồ sơ tương ứng");

  // 9. Tạo Workflows
  const wfSync = await prisma.workflow.create({
    data: {
      name: "Đồng bộ trạng thái & chỉ số tài khoản",
      description: "Tự động kiểm tra định kỳ trạng thái hoạt động, số lượng follower và video từ API chính thức.",
      type: "SYNC_ACCOUNTS",
      cronExpression: "0 */6 * * *",
      isEnabled: true,
      rateLimitPerMin: 60,
      retryCount: 3,
      timeoutSeconds: 300,
      totalRuns: 142,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 45),
      lastRunStatus: "SUCCESS",
    },
  });

  const wfMailCheck = await prisma.workflow.create({
    data: {
      name: "Kiểm tra kết nối Host Mail & Dung lượng",
      description: "Ping và kiểm tra trạng thái cổng IMAP/POP3 của tất cả các Host Mail được cấu hình.",
      type: "CHECK_MAIL_HEALTH",
      cronExpression: "*/30 * * * *",
      isEnabled: true,
      rateLimitPerMin: 120,
      retryCount: 2,
      timeoutSeconds: 60,
      totalRuns: 310,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 10),
      lastRunStatus: "SUCCESS",
    },
  });

  const wfEmailSync = await prisma.workflow.create({
    data: {
      name: "Đồng bộ hộp thư & Tách mã OTP TikTok",
      description: "Đọc các email mới nhất từ Host Mail, tự động nhận diện và trích xuất mã OTP xác thực bảo mật.",
      type: "SYNC_EMAILS",
      cronExpression: "*/5 * * * *",
      isEnabled: true,
      rateLimitPerMin: 100,
      retryCount: 3,
      timeoutSeconds: 120,
      totalRuns: 650,
      lastRunAt: new Date(Date.now() - 1000 * 60 * 2),
      lastRunStatus: "SUCCESS",
    },
  });

  const wfAudit = await prisma.workflow.create({
    data: {
      name: "Nhắc nhở kiểm tra tài khoản bất thường",
      description: "Quét phát hiện các tài khoản quá 7 ngày chưa đồng bộ hoặc có cảnh báo cần kiểm tra.",
      type: "AUDIT_REMINDER",
      cronExpression: "0 8 * * *",
      isEnabled: true,
      rateLimitPerMin: 60,
      retryCount: 1,
      timeoutSeconds: 180,
      totalRuns: 28,
      lastRunAt: new Date(Date.now() - 1000 * 3600 * 14),
      lastRunStatus: "SUCCESS",
    },
  });

  const wfReport = await prisma.workflow.create({
    data: {
      name: "Xuất báo cáo tổng hợp tự động hàng tuần",
      description: "Tập hợp số liệu tăng trưởng follower, tỷ lệ tài khoản hoạt động và gửi thống kê hệ thống.",
      type: "EXPORT_REPORT",
      cronExpression: "0 0 * * 0",
      isEnabled: false,
      rateLimitPerMin: 30,
      retryCount: 2,
      timeoutSeconds: 600,
      totalRuns: 12,
      lastRunAt: new Date(Date.now() - 1000 * 3600 * 72),
      lastRunStatus: "SUCCESS",
    },
  });

  // Tạo lịch sử chạy WorkflowRun
  await prisma.workflowRun.create({
    data: {
      workflowId: wfSync.id,
      status: "SUCCESS",
      triggeredBy: "SCHEDULE",
      logs: "[INFO] Bắt đầu đồng bộ 75 tài khoản...\n[INFO] Đã đồng bộ 75/75 tài khoản thành công.\n[SUCCESS] Hoàn thành không có lỗi.",
      itemsProcessed: 75,
      itemsFailed: 0,
      startedAt: new Date(Date.now() - 1000 * 60 * 45),
      endedAt: new Date(Date.now() - 1000 * 60 * 43),
      durationMs: 120000,
    },
  });

  await prisma.workflowRun.create({
    data: {
      workflowId: wfMailCheck.id,
      status: "SUCCESS",
      triggeredBy: "SCHEDULE",
      logs: "[INFO] Kiểm tra kết nối 4 Host Mail...\n[INFO] Host 1 (creatorhost.net): OK (45ms)\n[INFO] Host 2 (vietmedia.io): OK (62ms)\n[WARN] Host 4 (alphamail.biz): Cảnh báo dung lượng 96%\n[SUCCESS] Hoàn thành kiểm tra.",
      itemsProcessed: 4,
      itemsFailed: 0,
      startedAt: new Date(Date.now() - 1000 * 60 * 10),
      endedAt: new Date(Date.now() - 1000 * 60 * 9),
      durationMs: 60000,
    },
  });

  console.log("✅ Đã tạo 5 Workflows và các lượt chạy mẫu");

  // 10. Tạo Tác vụ (Tasks) trong Task Manager
  const task1 = await prisma.task.create({
    data: {
      taskName: "Nhập danh sách tài khoản lô #US-Batch-08",
      type: "IMPORT_ACCOUNTS",
      totalItems: 50,
      processedItems: 50,
      progressPercent: 100,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 1000 * 3600 * 4),
      completedAt: new Date(Date.now() - 1000 * 3600 * 4 + 1000 * 45),
      totalDurationSeconds: 45.2,
      userId: superAdmin.id,
    },
  });

  await prisma.taskLog.createMany({
    data: [
      { taskId: task1.id, level: "INFO", message: "Bắt đầu phân tích tệp CSV nhập khẩu (50 bản ghi)" },
      { taskId: task1.id, level: "INFO", message: "Kiểm tra định dạng email và cú pháp username: Hợp lệ 50/50" },
      { taskId: task1.id, level: "SUCCESS", message: "Đã lưu thành công 50 tài khoản vào cơ sở dữ liệu" },
    ],
  });

  const task2 = await prisma.task.create({
    data: {
      taskName: "Đồng bộ hộp thư Host Enterprise US 01",
      type: "EMAIL_SYNC",
      totalItems: 120,
      processedItems: 86,
      progressPercent: 71.6,
      status: "RUNNING",
      startedAt: new Date(Date.now() - 1000 * 90),
      userId: superAdmin.id,
    },
  });

  await prisma.taskLog.createMany({
    data: [
      { taskId: task2.id, level: "INFO", message: "Kết nối thành công tới IMAP server creatorhost.net:993 (SSL)" },
      { taskId: task2.id, level: "INFO", message: "Tìm thấy 120 email mới chưa lập chỉ mục" },
      { taskId: task2.id, level: "INFO", message: "Đang xử lý phân loại: 86/120 email đã phân loại" },
    ],
  });

  const task3 = await prisma.task.create({
    data: {
      taskName: "Kiểm tra tình trạng xác thực hàng loạt",
      type: "BATCH_STATUS_UPDATE",
      totalItems: 75,
      processedItems: 75,
      progressPercent: 100,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 1000 * 3600 * 12),
      completedAt: new Date(Date.now() - 1000 * 3600 * 12 + 1000 * 80),
      totalDurationSeconds: 80.5,
      userId: managerUser.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      taskName: "Sao lưu toàn bộ dữ liệu cấu hình hệ thống",
      type: "EXPORT_DATA",
      totalItems: 1,
      processedItems: 1,
      progressPercent: 100,
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 1000 * 3600 * 24),
      completedAt: new Date(Date.now() - 1000 * 3600 * 24 + 1000 * 15),
      totalDurationSeconds: 15.0,
      userId: superAdmin.id,
    },
  });

  console.log("✅ Đã tạo các tác vụ trong Task Manager");

  // 11. Tạo Nhật ký hoạt động (Activity Logs)
  const activitySamples = [
    { action: "IMPORT_ACCOUNTS", res: "TikTokAccount", details: "Nhập thành công 50 tài khoản từ tệp import_us_batch.csv", status: "SUCCESS" },
    { action: "UPDATE_HOST_MAIL", res: "MailHost", details: "Cập nhật cấu hình kết nối Host Enterprise US 01 (Port 993, SSL)", status: "SUCCESS" },
    { action: "TRIGGER_WORKFLOW", res: "Workflow", details: "Thực thi thủ công workflow 'Đồng bộ trạng thái & chỉ số tài khoản'", status: "SUCCESS" },
    { action: "CREATE_GROUP", res: "AccountGroup", details: "Tạo mới nhóm tài khoản 'TikTok Shop VN - Thời trang'", status: "SUCCESS" },
    { action: "AUTH_LOGIN", res: "User", details: "Đăng nhập thành công từ IP 14.162.145.22", status: "SUCCESS" },
    { action: "TEST_CONNECTION", res: "MailHost", details: "Kiểm tra kết nối thất bại tại Backup Host Alpha (Timeout 15s)", status: "WARNING" },
  ];

  for (let i = 0; i < activitySamples.length; i++) {
    const act = activitySamples[i];
    await prisma.activityLog.create({
      data: {
        userId: superAdmin.id,
        userName: superAdmin.name,
        action: act.action,
        resourceType: act.res,
        details: act.details,
        ipAddress: "14.162.145.22",
        status: act.status as any,
        createdAt: new Date(Date.now() - 1000 * 3600 * (i + 1) * 3),
      },
    });
  }

  // 12. Cài đặt hệ thống (System Settings)
  const defaultSettings = [
    { key: "SITE_NAME", value: "TikTok Account Manager", description: "Tên thương hiệu nền tảng" },
    { key: "DARK_MODE_DEFAULT", value: "true", description: "Bật chế độ giao diện tối mặc định" },
    { key: "AUTO_SYNC_INTERVAL", value: "360", description: "Khoảng thời gian tự động đồng bộ (phút)" },
    { key: "MAX_PARALLEL_TASKS", value: "5", description: "Số tác vụ tối đa được thực thi song song" },
    { key: "ENCRYPTION_STATUS", value: "ENABLED", description: "Mã hóa toàn bộ mật khẩu và API Key bằng AES-256" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.create({
      data: {
        key: s.key,
        value: s.value,
        description: s.description,
      },
    });
  }

  console.log("🎉 Hoàn tất nạp dữ liệu mẫu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu mẫu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# TIKTOK ACCOUNT MANAGER & AUTOMATION PLATFORM

> **Nền tảng SaaS chuyên nghiệp quản lý số lượng lớn tài khoản TikTok, quản lý Host Mail, Email xác thực tập trung và vận hành tự động hóa an toàn.**

---

## 1. Giới thiệu tổng quan

**TikTok Account Manager** là một hệ thống web SaaS hiện đại được thiết kế để quản lý từ hàng trăm đến hàng nghìn tài khoản TikTok một cách tập trung, khoa học và có hệ thống:

- **Quản lý đa tài khoản:** Quản trị tập trung toàn bộ tài khoản TikTok với các trường thông tin: Username, Display Name, Email liên kết, UID, Ngày sinh, Bio, Avatar, Quốc gia, Nhóm và Trạng thái.
- **Hạ tầng Host Mail tập trung:** Kết nối và theo dõi nhiều máy chủ mail (IMAP, POP3, SMTP, REST API), giám sát dung lượng hộp thư (quota) và độ trễ handshake.
- **Email Center & Auto OTP Parser:** Hộp thư đến tập trung, tự động nhận diện và trích xuất mã xác thực OTP từ TikTok, cho phép sao chép nhanh chỉ với 1 click.
- **Quy tắc tạo địa chỉ Email:** Công cụ sinh email hàng loạt (Prefix, Suffix, Độ dài, Custom Pattern), kiểm tra trùng lặp thời gian thực với database và xuất CSV.
- **Nhập dữ liệu hàng loạt (Bulk Import):** Hỗ trợ tệp CSV, Excel hoặc dán trực tiếp. Kiểm tra cú pháp từng dòng, phát hiện tài khoản trùng lặp và xem trước trước khi lưu.
- **Thiết lập hồ sơ (Profile Manager):** Cấu hình Avatar, Bio, Display Name theo mẫu tiêu chuẩn (Creator, Affiliate Shop, Tech Reviewer) và tích hợp **màn hình giả lập TikTok Phone Simulator** trực quan.
- **Quản lý vận hành & Nhóm tài khoản:** Phân vùng tài khoản theo vòng đời: *Tài khoản mới*, *Đã thiết lập*, *Đang hoạt động*, *Cần kiểm tra*, *Tạm ngưng*.
- **Trung tâm Tự động hóa (Automation Center):** Quản lý các luồng công việc hợp lệ: đồng bộ chỉ số, kiểm tra kết nối, tải email, nhắc nhở kiểm toán với cơ chế Queue, Auto-Retry, Timeout, Rate Limiting và Pausable.
- **Tiến trình tác vụ (Task Manager):** Giám sát thời gian thực các tác vụ nền, thanh tiến trình %, console logs theo dõi luồng xử lý và các nút điều khiển Tạm dừng, Tiếp tục, Hủy bỏ, Thử lại.
- **Bảo mật & Phân quyền (RBAC):** Mã hóa đối xứng **AES-256-GCM** toàn bộ thông tin nhạy cảm (mật khẩu, API key), nhật ký kiểm toán (Activity Logs) và phân quyền 4 cấp bậc (*Super Admin, Admin, Manager, Member*).

---

## 💡 Mẹo "0 ĐỒNG" Kinh Điển: Gmail Dot Trick (1 Gmail tạo hàng chục Nick TikTok)

> **Tiêu chí 100% MIỄN PHÍ - KHÔNG TỐN 1 ĐỒNG XU NÀO: Không cần mua acc, không cần thuê sim, không mất phí gì cả.**

### 1. Nguyên lý hoạt động
- **Google:** Dấu chấm `.` trong địa chỉ Gmail hoàn toàn vô hình đối với Google. Dù gửi vào `conghau20@gmail.com`, `c.onghau20@gmail.com`, `co.nghau20@gmail.com` hay `c.o.n.g.h.a.u20@gmail.com` thì toàn bộ email và mã xác minh OTP đều đổ về **chung 1 hộp thư thật của bạn**.
- **TikTok:** Thuật toán TikTok coi mỗi dấu chấm là một địa chỉ email riêng biệt hoàn toàn mới.
- **Vượt mặt yêu cầu số điện thoại:** Đuôi `@gmail.com` là đuôi mail có độ uy tín (trust score) cao nhất thế giới đối với TikTok. Khi đăng ký bằng email có đuôi `@gmail.com`, thuật toán TikTok sẽ ưu tiên thả qua và **KHÔNG BẮT BUỘC số điện thoại**!

### 2. Cách sử dụng trên hệ thống
1. **Tại trang Quản lý Tài khoản (TikTok Accounts):**
   - Bấm **"Tự động tạo tài khoản (Auto-Reg)"**.
   - Chọn tab **"🌟 Mẹo 0đ: Gmail Dot Trick"**.
   - Nhập Gmail chính của bạn (vd: `conghau20@gmail.com`) và chọn số lượng nick cần tạo (1 - 20 nick).
   - Hệ thống tự động sinh các biến thể dấu chấm sạch, chưa từng sử dụng trong DB.
   - Khi tiến trình chạy: Cửa sổ trình duyệt mở lên tự động điền form, bạn chỉ cần kéo mảnh ghép Captcha 1 lần. Mã OTP gửi về Gmail của bạn sẽ được điền tự động hoặc bạn nhập trực tiếp vào Chrome!
2. **Tại trang Host Mail & Định dạng Email:**
   - Chuyển sang tab **"Quy tắc tạo Email"**.
   - Chọn kiểu định dạng: **"🌟 Mẹo 0đ: Gmail Dot Trick"**.
   - Nhập Gmail và bấm **"Tạo danh sách & Kiểm tra trùng"**.
   - Xem bảng biến thể, sao chép nhanh hoặc xuất file CSV.


---

## 2. Thiết kế Giao diện (UI/UX)

Giao diện Dashboard Dark Mode cao cấp với bảng màu chuẩn SaaS:
- **Background:** `#0B0E14`
- **Sidebar:** `#111620`
- **Card / Surface:** `#171E2B`
- **Primary Accent:** `#4F8CFF`
- **Success / Active:** `#22C55E`
- **Warning / Check:** `#F59E0B`
- **Danger / Error:** `#EF4444`

Cấu trúc Menu:
```
TIKTOK MANAGER
├── Tổng quan
│   ├── Dashboard (Tổng quan chỉ số & biểu đồ)
│   └── Thống kê chi tiết (Statistics)
├── Hạ tầng Mail & Email
│   ├── Host Mail (Quản lý máy chủ & Sinh email)
│   └── Email Center (Hộp thư & Tách OTP)
├── Tài khoản TikTok
│   ├── TikTok Accounts (Danh sách & Nhập hàng loạt)
│   ├── Account Groups (Quản lý nhóm & Thẻ tags)
│   └── Profile Manager (Thiết lập hồ sơ & Phone Mockup)
├── Tự động hóa & Tác vụ
│   ├── Automation Center (Quản lý workflow & Queue)
│   └── Task Manager (Theo dõi tiến trình & Console Logs)
└── Hệ thống
    ├── Activity Logs (Nhật ký kiểm toán)
    └── Settings (Cài đặt hệ thống & Quản lý người dùng)
```

---

## 3. Kiến trúc Công nghệ (Tech Stack)

| Thành phần | Công nghệ sử dụng |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Charts & Analytics** | Recharts (AreaChart, PieChart, BarChart) |
| **Backend API** | Next.js Route Handlers (RESTful Architecture) |
| **Database ORM** | Prisma ORM 5.x |
| **Cơ sở dữ liệu** | PostgreSQL 16 (Production) / SQLite (Zero-config Development) |
| **Queue & Engine** | In-process Task Queue Manager với hỗ trợ Redis / BullMQ |
| **Bảo mật** | bcryptjs, AES-256-GCM Encryption, Scrypt key derivation |
| **File Parser** | PapaParse, SheetJS (XLSX) |
| **Containerization** | Docker, Docker Compose, Nginx Reverse Proxy |

---

## 4. Hướng dẫn Cài đặt & Khởi chạy

### Cách 1: Khởi chạy nhanh cho lập trình (Zero-Config)

Yêu cầu: Đã cài Node.js (v18 trở lên) và pnpm hoặc npm.

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install
pnpm approve-builds --all

# 2. Khởi tạo cơ sở dữ liệu SQLite và nạp dữ liệu mẫu phong phú
pnpm db:push
pnpm db:seed

# 3. Khởi chạy máy chủ phát triển
pnpm dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

Tài khoản đăng nhập mặc định:
- **Email:** `admin@tiktokmanager.io`
- **Mật khẩu:** `admin123`
- **Vai trò:** Super Admin

---

### Cách 2: Triển khai Production với Docker & PostgreSQL

```bash
# 1. Tạo bản sao tệp môi trường
cp .env.example .env

# 2. Khởi động các container (PostgreSQL, Redis, Next.js App, Nginx)
docker-compose up -d --build

# 3. Chạy di chuyển cấu trúc database và nạp seed data
docker exec -it tiktok_manager_app npx prisma db push
docker exec -it tiktok_manager_app npx tsx prisma/seed.ts
```

Nginx sẽ phục vụ ứng dụng tại cổng **`80`** (hoặc `443` nếu cấu hình SSL).

---

## 5. Cấu trúc Thư mục Dự án

```
tiktok-account-manager/
├── prisma/
│   ├── schema.prisma            # Schema cho SQLite (Dev)
│   ├── schema.postgresql.prisma # Schema cho PostgreSQL (Prod)
│   └── seed.ts                  # Dữ liệu mẫu thực tế phong phú
├── src/
│   ├── app/
│   │   ├── api/                 # Toàn bộ RESTful API Routes
│   │   │   ├── accounts/        # CRUD, Import, Export, Batch
│   │   │   ├── mail-hosts/      # CRUD, Test Connection
│   │   │   ├── emails/          # Email Center, Mark Read
│   │   │   ├── email-rules/     # Sinh email theo quy tắc & kiểm tra trùng
│   │   │   ├── profiles/        # Profile setup & Templates
│   │   │   ├── groups/          # Account Groups & Tags
│   │   │   ├── workflows/       # Automation & Run triggers
│   │   │   ├── tasks/           # Task Queue & Log stream
│   │   │   ├── stats/           # KPI metrics & Recharts data
│   │   │   ├── users/           # User Management & RBAC
│   │   │   ├── activity-logs/   # Audit trail
│   │   │   └── settings/        # System settings
│   │   ├── accounts/            # Giao diện Quản lý tài khoản TikTok
│   │   ├── host-mail/           # Giao diện Host Mail & Sinh Email
│   │   ├── email-center/        # Giao diện Hộp thư tập trung & Tách OTP
│   │   ├── profiles/            # Giao diện Thiết lập hồ sơ & Phone Mockup
│   │   ├── groups/              # Giao diện Quản lý nhóm tài khoản
│   │   ├── automation/          # Giao diện Trung tâm Tự động hóa
│   │   ├── tasks/               # Giao diện Quản lý tiến trình (Task Manager)
│   │   ├── statistics/          # Giao diện Báo cáo thống kê
│   │   ├── activity-logs/       # Giao diện Nhật ký kiểm toán
│   │   ├── settings/            # Giao diện Cài đặt hệ thống
│   │   ├── globals.css          # CSS Variables Dark Mode
│   │   ├── layout.tsx           # Root Next.js Layout
│   │   └── page.tsx             # Dashboard tổng quan
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, AppLayout
│   │   └── ui/                  # Modal, Badge, ProgressBar, Toast
│   └── lib/
│       ├── prisma.ts            # Prisma Client Singleton
│       ├── crypto.ts            # AES-256-GCM Encryption & Masking
│       ├── logger.ts            # Audit Activity Logger
│       └── taskQueue.ts         # In-process Task Queue Manager
├── Dockerfile                   # Multi-stage production container
├── docker-compose.yml           # PostgreSQL + Redis + App + Nginx
├── nginx.conf                   # Nginx reverse proxy config
├── tailwind.config.ts           # Bảng màu Dark Mode đặc thù
└── tsconfig.json
```

---

## 6. Chính sách An toàn & Bảo mật

1. **Tuân thủ chính sách TikTok:** Nền tảng được xây dựng cho các hoạt động quản lý danh mục và phân loại tài khoản hợp lệ. Không triển khai bot giả lập người dùng, spam hoặc cố gắng qua mặt các cơ chế bảo vệ của TikTok.
2. **Mã hóa thông tin đăng nhập:** Mật khẩu và Token không bao giờ được lưu dưới dạng plaintext hay hiển thị trên giao diện người dùng.
3. **Kiểm toán hoạt động (Audit Trail):** Mọi thao tác quản trị đều được ghi nhận với đầy đủ thông tin: Người thực hiện, IP, Thời gian, Hành động và Đối tượng tác động.


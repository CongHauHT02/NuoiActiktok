import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import prisma from "./prisma";
import { encrypt } from "./crypto";
import { generateRandomUsername, generateStrongPassword } from "./autoRegWorker";

export interface LdPlayerRegParams {
  email: string;
  password?: string;
  targetUsername?: string;
  onLog: (message: string, level: "INFO" | "WARN" | "ERROR" | "SUCCESS") => Promise<void>;
  fetchOtp: (email: string, timeoutSec?: number) => Promise<string | null>;
}

export interface LdPlayerRegResult {
  success: boolean;
  username?: string;
  email: string;
  password?: string;
  errorMessage?: string;
}

export interface UiNode {
  text: string;
  desc: string;
  resourceId: string;
  className: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    centerX: number;
    centerY: number;
  };
}

export class LdPlayerController {
  private adbPath: string;
  private deviceId: string;

  constructor(adbPath?: string, deviceId = "emulator-5554") {
    this.adbPath = adbPath || this.detectAdbPath();
    this.deviceId = deviceId;
  }

  private detectAdbPath(): string {
    const candidates = [
      "C:\\LDPlayer\\LDPlayer9\\adb.exe",
      "C:\\LDPlayer\\LDPlayer4\\adb.exe",
      "adb.exe",
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return "adb.exe";
  }

  public exec(cmd: string): string {
    try {
      const fullCmd = `"${this.adbPath}" -s ${this.deviceId} ${cmd}`;
      return execSync(fullCmd, { encoding: "utf8", timeout: 15000 });
    } catch (err: any) {
      return err.stdout?.toString() || err.message;
    }
  }

  public isConnected(): boolean {
    try {
      const out = execSync(`"${this.adbPath}" devices`, { encoding: "utf8", timeout: 5000 });
      return out.includes(this.deviceId) && out.includes("device");
    } catch {
      return false;
    }
  }

  public tap(x: number, y: number) {
    this.exec(`shell input tap ${Math.round(x)} ${Math.round(y)}`);
  }

  public inputText(text: string) {
    // Escape single quotes for adb shell
    const sanitized = text.replace(/'/g, "\\'");
    this.exec(`shell "input text '${sanitized}'"`);
  }

  public keyEvent(code: number) {
    this.exec(`shell input keyevent ${code}`);
  }

  public clearField(clickCount = 35) {
    for (let i = 0; i < clickCount; i++) {
      this.keyEvent(67); // KEYCODE_DEL
    }
  }

  public captureScreen(destPath: string) {
    const tempRemote = "/sdcard/screen_temp.png";
    this.exec(`shell screencap -p ${tempRemote}`);
    execSync(`"${this.adbPath}" -s ${this.deviceId} pull ${tempRemote} "${destPath}"`, {
      encoding: "utf8",
      timeout: 10000,
    });
  }

  public dumpUi(): UiNode[] {
    const remoteXml = "/sdcard/ui_dump.xml";
    const localXml = path.join(process.cwd(), "scratch_ui.xml");

    this.exec(`shell uiautomator dump ${remoteXml}`);
    try {
      execSync(`"${this.adbPath}" -s ${this.deviceId} pull ${remoteXml} "${localXml}"`, {
        encoding: "utf8",
        timeout: 10000,
      });
    } catch {
      return [];
    }

    if (!fs.existsSync(localXml)) return [];

    const xmlContent = fs.readFileSync(localXml, "utf8");
    const nodeRegex = /<node\s+([^>]+)\/>|<node\s+([^>]+)>/g;
    const nodes: UiNode[] = [];

    let match;
    while ((match = nodeRegex.exec(xmlContent)) !== null) {
      const attrsStr = match[1] || match[2];
      const getAttr = (name: string) => {
        const m = attrsStr.match(new RegExp(`${name}="([^"]*)"`));
        return m ? m[1] : "";
      };

      const text = getAttr("text");
      const desc = getAttr("content-desc");
      const resourceId = getAttr("resource-id");
      const className = getAttr("class");
      const boundsStr = getAttr("bounds");

      const bMatch = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
      if (bMatch) {
        const x1 = parseInt(bMatch[1]);
        const y1 = parseInt(bMatch[2]);
        const x2 = parseInt(bMatch[3]);
        const y2 = parseInt(bMatch[4]);
        nodes.push({
          text,
          desc,
          resourceId,
          className,
          bounds: {
            x1,
            y1,
            x2,
            y2,
            centerX: Math.round((x1 + x2) / 2),
            centerY: Math.round((y1 + y2) / 2),
          },
        });
      }
    }

    try {
      fs.unlinkSync(localXml);
    } catch {}

    return nodes;
  }
}

/**
 * Execute automated registration on LDPlayer 9 Android TikTok App
 */
export async function executeAutoRegisterTikTokOnLdPlayer(
  params: LdPlayerRegParams
): Promise<LdPlayerRegResult> {
  const { email, onLog, fetchOtp } = params;
  const password = params.password || generateStrongPassword();
  const username = params.targetUsername || generateRandomUsername(email);

  const controller = new LdPlayerController();

  if (!controller.isConnected()) {
    await onLog(
      "❌ Không tìm thấy giả lập LDPlayer 9 đang kết nối qua ADB (emulator-5554). Vui lòng mở LDPlayer 9 trước khi chạy!",
      "ERROR"
    );
    return {
      success: false,
      email,
      errorMessage: "LDPlayer emulator-5554 is not connected or ADB is disabled",
    };
  }

  await onLog("✅ Đã kết nối thành công với giả lập LDPlayer 9 qua cổng ADB!", "SUCCESS");

  const tiktokPackage = "com.ss.android.ugc.trill";

  // Check package
  const pkgs = controller.exec("shell pm list packages");
  if (!pkgs.includes(tiktokPackage)) {
    await onLog(
      `❌ Ứng dụng TikTok (${tiktokPackage}) chưa được cài trên LDPlayer. Hãy mở CH Play hoặc kéo file APK TikTok vào LDPlayer!`,
      "ERROR"
    );
    return {
      success: false,
      email,
      errorMessage: "TikTok package not installed on LDPlayer",
    };
  }

  await onLog("Khởi động ứng dụng TikTok trên LDPlayer 9...", "INFO");
  controller.exec(`shell monkey -p ${tiktokPackage} -c android.intent.category.LAUNCHER 1`);
  await new Promise((r) => setTimeout(r, 4000));

  // Multi-step Registration State Machine (up to 20 transitions)
  let emailEntered = false;
  let usernameEntered = false;
  let passwordEntered = false;
  let accountCreated = false;

  for (let step = 0; step < 20; step++) {
    await new Promise((r) => setTimeout(r, 2000));
    let nodes = controller.dumpUi();

    if (nodes.length === 0) {
      await new Promise((r) => setTimeout(r, 1500));
      nodes = controller.dumpUi();
    }

    // 1. Dismiss Google Sign-In bottom sheet if open
    const hasGoogleSheet = nodes.some(
      (n) =>
        n.text.includes("Sign back in to TikTok with Google") ||
        n.text.includes("Continue as")
    );
    if (hasGoogleSheet) {
      await onLog("Đóng thông báo Google One Tap...", "INFO");
      controller.keyEvent(4); // KEYCODE_BACK dismisses popup without navigating away
      await new Promise((r) => setTimeout(r, 1000));
      nodes = controller.dumpUi();
    }

    // 2. Check for Rate Limit Error
    const rateLimitNode = nodes.find(
      (n) =>
        n.text.includes("Maximum number of attempts reached") ||
        n.text.includes("Try again later")
    );
    if (rateLimitNode) {
      await onLog(`⚠️ TikTok phản hồi: "${rateLimitNode.text}"`, "WARN");
      await onLog(
        "👉 [GIẢI PHÁP 100% HIỆU QUẢ]: Địa chỉ IP mạng của bạn đang bị TikTok giới hạn (Rate Limit). Hãy phát 4G từ điện thoại sang máy tính, rồi BẬT/TẮT Chế độ máy bay (Airplane Mode) 5 giây trên điện thoại để lấy IP sạch mới 100% rồi chạy lại!",
        "WARN"
      );
      return {
        success: false,
        email,
        errorMessage: "Maximum number of attempts reached. Try again later. (IP Rate Limited)",
      };
    }

    // 3. Check for Captcha (Puzzle Piece)
    const captchaNode = nodes.find(
      (n) =>
        n.text.toLowerCase().includes("puzzle") ||
        n.text.toLowerCase().includes("drag") ||
        n.text.toLowerCase().includes("mảnh ghép")
    );
    if (captchaNode) {
      await onLog(
        "🧩 [HÀNH ĐỘNG]: TikTok yêu cầu kéo mảnh ghép Captcha! Hãy nhìn cửa sổ LDPlayer và kéo mảnh ghép vào ô...",
        "WARN"
      );
      for (let c = 0; c < 10; c++) {
        await new Promise((r) => setTimeout(r, 2000));
        nodes = controller.dumpUi();
        if (!nodes.some((n) => n.text.toLowerCase().includes("puzzle") || n.text.toLowerCase().includes("drag"))) {
          await onLog("✅ Đã hoàn tất Captcha!", "SUCCESS");
          break;
        }
      }
      continue;
    }

    // 4. Success Completion: "Getting Started" or "Welcome to TikTok"
    const welcomeNode = nodes.find(
      (n) =>
        n.text.includes("Getting Started") ||
        n.text.includes("Welcome to TikTok") ||
        n.text.includes("Start watching") ||
        n.text.includes("Relaunch app")
    );
    if (welcomeNode) {
      await onLog("🎉 Đăng ký tài khoản TikTok thành công!", "SUCCESS");
      accountCreated = true;

      // Click "Start watching" or "Relaunch app"
      const actionBtn = nodes.find(
        (n) => n.text.includes("Start watching") || n.text.includes("Relaunch app")
      );
      if (actionBtn) {
        controller.tap(actionBtn.bounds.centerX, actionBtn.bounds.centerY);
      } else {
        controller.tap(450, 1100);
      }
      break;
    }

    // 5. If on "Log in to TikTok" (User is on Login, MUST switch to Sign up)
    const onLoginScreen = nodes.some(
      (n) =>
        n.text === "Log in to TikTok" ||
        (n.text.includes("Log in") && nodes.some((m) => m.text.includes("Use phone / email / username")))
    );
    if (onLoginScreen) {
      const signUpSpan = nodes.find((n) => n.text.includes("Don") && n.text.includes("Sign up"));
      if (signUpSpan) {
        await onLog("Chuyển từ giao diện Đăng nhập sang mục Đăng ký mới...", "INFO");
        // Tap on the right side of the span where 'Sign up' is located
        const clickX = signUpSpan.bounds.x2 - 50;
        const clickY = signUpSpan.bounds.centerY;
        controller.tap(clickX, clickY);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
    }

    // 6. If on "Sign up for TikTok" (Main Sign up gateway)
    const onSignupGateway = nodes.some(
      (n) =>
        n.text === "Sign up for TikTok" ||
        nodes.some((m) => m.text === "Use phone or email")
    );
    if (onSignupGateway) {
      const redBtn = nodes.find((n) => n.text === "Use phone or email");
      if (redBtn) {
        await onLog("Nhấn nút 'Use phone or email' để mở form đăng ký...", "INFO");
        controller.tap(redBtn.bounds.centerX, redBtn.bounds.centerY);
      } else {
        controller.tap(440, 448);
      }
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }

    // 7. If on "Choose username"
    const usernameScreen = nodes.find((n) => n.text.includes("Choose username"));
    if (usernameScreen) {
      if (!usernameEntered) {
        await onLog(`Thiết lập Username cho tài khoản mới: @${username}...`, "INFO");
        const userEdit = nodes.find((n) => n.className.includes("EditText"));
        if (userEdit) {
          controller.tap(userEdit.bounds.centerX, userEdit.bounds.centerY);
        } else {
          controller.tap(450, 556);
        }
        await new Promise((r) => setTimeout(r, 400));
        controller.inputText(username);
        usernameEntered = true;
      }
      // Wait for validation spinner to finish and checkmark to turn green
      await new Promise((r) => setTimeout(r, 2500));

      // Tap Next
      nodes = controller.dumpUi();
      const nextBtn = nodes.find((n) => n.text === "Next" || n.text === "Tiếp");
      if (nextBtn) {
        controller.tap(nextBtn.bounds.centerX, nextBtn.bounds.centerY);
      } else {
        controller.tap(450, 510);
        controller.tap(450, 817);
      }
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }

    // 8. If on "Choose password"
    const passwordScreen = nodes.find((n) => n.text.includes("Choose password"));
    if (passwordScreen) {
      if (!passwordEntered) {
        await onLog(`Thiết lập mật khẩu an toàn: ${password}...`, "INFO");
        const passEdit = nodes.find((n) => n.className.includes("EditText"));
        if (passEdit) {
          controller.tap(passEdit.bounds.centerX, passEdit.bounds.centerY);
        } else {
          controller.tap(450, 388);
        }
        await new Promise((r) => setTimeout(r, 400));
        controller.inputText(password);
        passwordEntered = true;
      }
      // Wait for password requirements check
      await new Promise((r) => setTimeout(r, 2000));

      // Tap Next
      nodes = controller.dumpUi();
      const nextBtn = nodes.find((n) => n.text === "Next" || n.text === "Tiếp");
      if (nextBtn) {
        controller.tap(nextBtn.bounds.centerX, nextBtn.bounds.centerY);
      } else {
        controller.tap(450, 510);
        controller.tap(450, 759);
      }
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }

    // 9. If on "Sign up" (Tabs: Phone | Email)
    const onPhoneEmailForm = nodes.some(
      (n) => n.text === "Sign up" && nodes.some((m) => m.text === "Phone" || m.text === "Email")
    );
    if (onPhoneEmailForm && !emailEntered) {
      // Tap Email tab
      const emailTab = nodes.find((n) => n.text.trim() === "Email");
      if (emailTab) {
        await onLog("Kích hoạt tab 'Email'...", "INFO");
        controller.tap(emailTab.bounds.centerX, emailTab.bounds.centerY);
        await new Promise((r) => setTimeout(r, 1000));
        nodes = controller.dumpUi();
      }

      // Clear old text if clear icon exists
      const clearIcon = nodes.find(
        (n) => n.className.includes("ImageView") && n.bounds.y1 > 400 && n.bounds.y2 < 600
      );
      if (clearIcon) {
        controller.tap(clearIcon.bounds.centerX, clearIcon.bounds.centerY);
        await new Promise((r) => setTimeout(r, 400));
      }

      await onLog(`Tự động điền Email vào ứng dụng TikTok: ${email}...`, "INFO");
      const emailInput = nodes.find((n) => n.className.includes("EditText"));
      if (emailInput) {
        controller.tap(emailInput.bounds.centerX, emailInput.bounds.centerY);
      } else {
        controller.tap(450, 481);
      }
      await new Promise((r) => setTimeout(r, 400));
      controller.inputText(email);
      await new Promise((r) => setTimeout(r, 1000));

      // Tap Continue
      nodes = controller.dumpUi();
      const continueBtn = nodes.find(
        (n) => n.text.toLowerCase() === "continue" || n.text.toLowerCase() === "tiếp tục"
      );
      if (continueBtn) {
        await onLog("Nhấn nút 'Tiếp tục' (Continue)...", "INFO");
        controller.tap(continueBtn.bounds.centerX, continueBtn.bounds.centerY);
      } else {
        controller.tap(450, 1524);
      }
      emailEntered = true;
      await new Promise((r) => setTimeout(r, 3500));
      continue;
    }

    // 10. If on OTP verification screen
    const otpScreen = nodes.find(
      (n) =>
        n.text.includes("6-digit code") ||
        n.text.includes("Enter 6-digit") ||
        n.text.includes("mã gồm 6 chữ số")
    );
    if (otpScreen) {
      await onLog(`Đang đợi mã xác thực 6 số gửi về hộp thư Cloud Mail của ${email}...`, "INFO");
      const otp = await fetchOtp(email, 60);

      if (!otp) {
        await onLog("❌ Hết thời gian chờ nhận mã OTP từ hộp thư Cloud Mail.", "ERROR");
        return { success: false, email, errorMessage: "OTP timeout" };
      }

      await onLog(`🎯 Đã nhận mã OTP tự động: [${otp}]! Đang điền vào TikTok trên LDPlayer...`, "SUCCESS");
      const otpInput = nodes.find((n) => n.className.includes("EditText"));
      if (otpInput) {
        controller.tap(otpInput.bounds.centerX, otpInput.bounds.centerY);
      } else {
        controller.tap(450, 500);
      }
      await new Promise((r) => setTimeout(r, 400));
      controller.inputText(otp);
      await new Promise((r) => setTimeout(r, 2000));

      // Tap Next or Verify
      nodes = controller.dumpUi();
      const verifyBtn = nodes.find((n) => n.text === "Next" || n.text === "Verify");
      if (verifyBtn) {
        controller.tap(verifyBtn.bounds.centerX, verifyBtn.bounds.centerY);
      }
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    // 11. If on Feed (Home) and not logged in yet, tap Profile
    const profileTab = nodes.find((n) => n.text === "Profile" || n.text === "Hồ sơ");
    if (profileTab && !emailEntered && !usernameEntered) {
      await onLog("Nhấn vào mục Profile để mở giao diện đăng ký...", "INFO");
      controller.tap(profileTab.bounds.centerX, profileTab.bounds.centerY);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
  }

  // Save account to SQLite database
  const created = await prisma.tikTokAccount.create({
    data: {
      username,
      displayName: `Creator ${username.slice(0, 6)}`,
      email,
      passwordEncrypted: encrypt(password),
      status: "ACTIVE",
      notes: "Tự động tạo qua Giả lập LDPlayer 9 + Cloud Mail Miễn Phí",
    },
  });

  await onLog(
    `🎉 Đã lưu tài khoản @${username} (${email}) vào cơ sở dữ liệu hệ thống!`,
    "SUCCESS"
  );

  return {
    success: true,
    username,
    email,
    password,
  };
}

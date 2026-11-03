import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface ImportRow {
  rowIndex: number;
  username: string;
  displayName?: string;
  email?: string;
  password?: string;
  birthDate?: string;
  notes?: string;
  country?: string;
  language?: string;
  errors: string[];
  isDuplicate: boolean;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rows, groupId, commit = false } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy dữ liệu nhập hàng loạt" }, { status: 400 });
    }

    // 1. Validate & check internal duplicates
    const validatedRows: ImportRow[] = [];
    const seenUsernames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const errors: string[] = [];
      const username = (raw.username || "").toString().trim().toLowerCase().replace(/^@/, "");
      const email = (raw.email || "").toString().trim().toLowerCase();
      const displayName = (raw.displayName || raw.display_name || username || "").toString().trim();

      if (!username) {
        errors.push("Thiếu tên người dùng (username)");
      } else if (!/^[a-zA-Z0-9._]{2,30}$/.test(username)) {
        errors.push("Username không hợp lệ (2-30 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới)");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Địa chỉ email không đúng định dạng");
      }

      let isDuplicate = false;
      if (username) {
        if (seenUsernames.has(username)) {
          errors.push("Bị trùng lặp username ngay trong danh sách tải lên");
          isDuplicate = true;
        } else {
          seenUsernames.add(username);
        }
      }

      validatedRows.push({
        rowIndex: i + 1,
        username,
        displayName: displayName || username,
        email: email || undefined,
        password: raw.password ? raw.password.toString().trim() : undefined,
        birthDate: raw.birthDate || raw.birth_date || undefined,
        notes: raw.notes ? raw.notes.toString() : undefined,
        country: raw.country || "VN",
        language: raw.language || "vi",
        errors,
        isDuplicate,
      });
    }

    // 2. Check duplicates against database
    const usernamesToCheck = validatedRows.filter((r) => r.username).map((r) => r.username);
    const existingInDb = await prisma.tikTokAccount.findMany({
      where: { username: { in: usernamesToCheck } },
      select: { username: true },
    });
    const dbUsernameSet = new Set(existingInDb.map((acc) => acc.username.toLowerCase()));

    for (const row of validatedRows) {
      if (row.username && dbUsernameSet.has(row.username)) {
        row.errors.push(`Username @${row.username} đã tồn tại trong cơ sở dữ liệu`);
        row.isDuplicate = true;
      }
    }

    const errorCount = validatedRows.filter((r) => r.errors.length > 0).length;
    const validRows = validatedRows.filter((r) => r.errors.length === 0);

    // 3. If preview only, return validation analysis
    if (!commit) {
      return NextResponse.json({
        preview: true,
        summary: {
          totalRows: validatedRows.length,
          validCount: validRows.length,
          errorCount,
        },
        rows: validatedRows,
      });
    }

    // 4. If commit is true, save valid rows & create background Task
    if (validRows.length === 0) {
      return NextResponse.json({
        error: "Không có bản ghi hợp lệ nào để nhập",
        summary: { totalRows: validatedRows.length, validCount: 0, errorCount },
        rows: validatedRows,
      }, { status: 400 });
    }

    // Create a tracked Task in Task Manager
    const task = await TaskQueue.startTask(
      `Nhập hàng loạt ${validRows.length} tài khoản TikTok`,
      "IMPORT_ACCOUNTS",
      validRows.length
    );

    // Execute import with progress tracking
    (async () => {
      try {
        let processed = 0;
        await TaskQueue.log(task.id, `Bắt đầu lưu ${validRows.length} tài khoản vào hệ thống...`, "INFO");

        for (const item of validRows) {
          const account = await prisma.tikTokAccount.create({
            data: {
              username: item.username,
              displayName: item.displayName || item.username,
              email: item.email || null,
              passwordEncrypted: item.password ? encrypt(item.password) : null,
              birthDate: item.birthDate || null,
              country: item.country || "VN",
              language: item.language || "vi",
              notes: item.notes || null,
              status: "NEW",
              groupId: groupId || null,
              tiktokUid: `tt_${Date.now()}_${processed}`,
              lastSyncAt: new Date(),
            },
          });

          // Create linked profile
          await prisma.accountProfile.create({
            data: {
              tiktokAccountId: account.id,
              setupStatus: "PENDING",
              targetDisplayName: item.displayName || item.username,
              targetCountry: item.country || "VN",
              targetLanguage: item.language || "vi",
            },
          });

          processed++;
          if (processed % 5 === 0 || processed === validRows.length) {
            await TaskQueue.updateProgress(task.id, processed, validRows.length);
            await TaskQueue.log(task.id, `Đã nhập ${processed}/${validRows.length} tài khoản`, "INFO");
          }
        }

        await TaskQueue.completeTask(task.id, `Đã hoàn tất nhập thành công ${validRows.length} tài khoản`);

        await logActivity({
          action: "IMPORT_ACCOUNTS",
          resourceType: "TikTokAccount",
          details: `Đã nhập thành công ${validRows.length} tài khoản mới (Tác vụ: ${task.id})`,
        });
      } catch (err: any) {
        console.error("Import processing error:", err);
        await TaskQueue.failTask(task.id, err.message || "Lỗi xử lý nhập tài khoản");
      }
    })();

    return NextResponse.json({
      success: true,
      taskId: task.id,
      summary: {
        totalRows: validatedRows.length,
        importedCount: validRows.length,
        skippedErrors: errorCount,
      },
      message: `Đã khởi tạo tiến trình nhập ${validRows.length} tài khoản thành công!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateGmailDotVariations, isValidGmail, normalizeGmail } from "@/lib/gmailDotTrick";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      formatType = "RANDOM_DOMAIN", // GMAIL_DOT_TRICK, PREFIX_DOMAIN, USERNAME_DOMAIN, RANDOM_DOMAIN, CUSTOM
      domain,
      prefix = "",
      suffix = "",
      baseUsername = "user",
      length = 8,
      allowedChars = "alphanumeric", // alphanumeric, letters_only, numeric_only
      customPattern = "{prefix}_{random}@{domain}",
      quantity = 10,
      baseGmail = "",
    } = body;

    const count = Math.min(Math.max(1, parseInt(quantity) || 10), 500);

    let generated: string[] = [];

    if (formatType === "GMAIL_DOT_TRICK") {
      const targetGmail = (baseGmail || `${baseUsername}@gmail.com`).trim().toLowerCase();
      if (!targetGmail.includes("@")) {
        return NextResponse.json(
          { error: "Vui lòng nhập địa chỉ Gmail thật hợp lệ (vd: conghau20@gmail.com)" },
          { status: 400 }
        );
      }
      generated = generateGmailDotVariations(targetGmail, count);
    } else {
      if (!domain) {
        return NextResponse.json({ error: "Vui lòng chọn hoặc nhập tên miền (Domain)" }, { status: 400 });
      }

      let charSet = "abcdefghijklmnopqrstuvwxyz0123456789";
      if (allowedChars === "letters_only") {
        charSet = "abcdefghijklmnopqrstuvwxyz";
      } else if (allowedChars === "numeric_only") {
        charSet = "0123456789";
      }

      const generateRandomStr = (len: number): string => {
        let res = "";
        for (let i = 0; i < len; i++) {
          res += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return res;
      };

      for (let i = 0; i < count; i++) {
        let email = "";
        const randStr = generateRandomStr(length);

        if (formatType === "PREFIX_DOMAIN") {
          email = `${prefix ? prefix + "." : ""}${randStr}${suffix ? "." + suffix : ""}@${domain}`;
        } else if (formatType === "USERNAME_DOMAIN") {
          const num = (i + 1).toString().padStart(3, "0");
          email = `${prefix ? prefix + "_" : ""}${baseUsername}${num}${suffix ? "_" + suffix : ""}@${domain}`;
        } else if (formatType === "CUSTOM") {
          email = customPattern
            .replace("{prefix}", prefix)
            .replace("{suffix}", suffix)
            .replace("{random}", randStr)
            .replace("{domain}", domain)
            .replace("{num}", (i + 1).toString());
        } else {
          // RANDOM_DOMAIN
          email = `${prefix ? prefix + "_" : ""}${randStr}${suffix ? "_" + suffix : ""}@${domain}`;
        }

        generated.push(email.toLowerCase());
      }
    }

    // Check duplicates against existing database
    const existingEmails = await prisma.emailAccount.findMany({
      where: { email: { in: generated } },
      select: { email: true },
    });
    const existingSet = new Set(existingEmails.map((e) => e.email.toLowerCase()));

    // Also check TikTokAccount emails
    const existingTTEmails = await prisma.tikTokAccount.findMany({
      where: { email: { in: generated } },
      select: { email: true },
    });
    existingTTEmails.forEach((tt) => {
      if (tt.email) existingSet.add(tt.email.toLowerCase());
    });

    const results = generated.map((email, idx) => ({
      index: idx + 1,
      email,
      isDuplicate: existingSet.has(email),
      status: existingSet.has(email) ? "Đã tồn tại trong hệ thống" : "Hợp lệ",
    }));

    const duplicateCount = results.filter((r) => r.isDuplicate).length;
    const validCount = results.length - duplicateCount;

    return NextResponse.json({
      data: results,
      summary: {
        totalGenerated: results.length,
        validCount,
        duplicateCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

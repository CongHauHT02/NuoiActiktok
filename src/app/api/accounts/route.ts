import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, maskSecret } from "@/lib/crypto";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");
    const status = searchParams.get("status");
    const groupId = searchParams.get("groupId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (groupId && groupId !== "ALL") where.groupId = groupId;

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { displayName: { contains: search } },
        { email: { contains: search } },
        { tiktokUid: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [total, accounts, groups] = await Promise.all([
      prisma.tikTokAccount.count({ where }),
      prisma.tikTokAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          group: { select: { id: true, name: true, color: true } },
          profile: { select: { setupStatus: true, targetDisplayName: true, targetBio: true } },
          tags: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.accountGroup.findMany({
        select: { id: true, name: true, color: true, _count: { select: { accounts: true } } },
      }),
    ]);

    const safeAccounts = accounts.map((acc) => ({
      ...acc,
      passwordEncrypted: acc.passwordEncrypted ? maskSecret(acc.passwordEncrypted) : null,
    }));

    return NextResponse.json({
      data: safeAccounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      groups,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      username,
      displayName,
      email,
      password,
      birthDate,
      avatarUrl,
      bio,
      country = "VN",
      language = "vi",
      groupId,
      status = "NEW",
      notes,
      sessionCookies,
    } = body;

    if (!username || !displayName) {
      return NextResponse.json({ error: "Username và Tên hiển thị là bắt buộc" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

    // Check existing
    const existing = await prisma.tikTokAccount.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json({ error: `Username @${cleanUsername} đã tồn tại trong hệ thống` }, { status: 400 });
    }

    const newAccount = await prisma.tikTokAccount.create({
      data: {
        username: cleanUsername,
        displayName: displayName.trim(),
        email: email ? email.trim().toLowerCase() : null,
        passwordEncrypted: password ? encrypt(password) : null,
        tiktokUid: `tt_${Date.now()}`,
        birthDate,
        avatarUrl,
        bio,
        country,
        language,
        status,
        groupId: groupId || null,
        notes,
        sessionCookies: sessionCookies ? sessionCookies.trim() : null,
        lastSyncAt: new Date(),
      },
      include: {
        group: true,
      },
    });

    // Create linked profile
    await prisma.accountProfile.create({
      data: {
        tiktokAccountId: newAccount.id,
        setupStatus: status === "ACTIVE" || status === "CONFIGURED" ? "COMPLETED" : "PENDING",
        targetDisplayName: displayName,
        targetBio: bio,
        targetCountry: country,
        targetLanguage: language,
      },
    });

    await logActivity({
      action: "CREATE_ACCOUNT",
      resourceType: "TikTokAccount",
      resourceId: newAccount.id,
      details: `Thêm tài khoản mới @${cleanUsername} (${displayName})`,
    });

    return NextResponse.json({
      data: {
        ...newAccount,
        passwordEncrypted: newAccount.passwordEncrypted ? maskSecret(newAccount.passwordEncrypted) : null,
      },
      message: "Thêm tài khoản thành công",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


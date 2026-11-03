import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, maskSecret } from "@/lib/crypto";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const account = await prisma.tikTokAccount.findUnique({
      where: { id },
      include: {
        group: true,
        profile: {
          include: { template: true },
        },
        tags: true,
        emailAccountRef: {
          include: {
            mailHost: true,
            messages: {
              take: 5,
              orderBy: { receivedAt: "desc" },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...account,
        passwordEncrypted: account.passwordEncrypted ? maskSecret(account.passwordEncrypted) : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      displayName,
      email,
      password,
      birthDate,
      avatarUrl,
      bio,
      country,
      language,
      status,
      groupId,
      notes,
      sessionCookies,
    } = body;

    const existing = await prisma.tikTokAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    const updateData: any = {
      displayName: displayName !== undefined ? displayName.trim() : existing.displayName,
      email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : existing.email,
      birthDate: birthDate !== undefined ? birthDate : existing.birthDate,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
      bio: bio !== undefined ? bio : existing.bio,
      country: country !== undefined ? country : existing.country,
      language: language !== undefined ? language : existing.language,
      status: status !== undefined ? status : existing.status,
      groupId: groupId !== undefined ? groupId : existing.groupId,
      notes: notes !== undefined ? notes : existing.notes,
      sessionCookies: sessionCookies !== undefined ? (sessionCookies ? sessionCookies.trim() : null) : existing.sessionCookies,
    };

    if (password && password !== "••••••••") {
      updateData.passwordEncrypted = encrypt(password);
    }

    const updated = await prisma.tikTokAccount.update({
      where: { id },
      data: updateData,
      include: { group: true, profile: true },
    });

    await logActivity({
      action: "UPDATE_ACCOUNT",
      resourceType: "TikTokAccount",
      resourceId: id,
      details: `Cập nhật thông tin tài khoản @${updated.username}`,
    });

    return NextResponse.json({
      data: {
        ...updated,
        passwordEncrypted: updated.passwordEncrypted ? maskSecret(updated.passwordEncrypted) : null,
      },
      message: "Cập nhật tài khoản thành công",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const account = await prisma.tikTokAccount.findUnique({ where: { id } });
    if (!account) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    await prisma.tikTokAccount.delete({ where: { id } });

    await logActivity({
      action: "DELETE_ACCOUNT",
      resourceType: "TikTokAccount",
      resourceId: id,
      details: `Đã xóa tài khoản @${account.username}`,
    });

    return NextResponse.json({ message: "Xóa tài khoản thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, maskSecret } from "@/lib/crypto";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, domain, serverAddress, protocol, port, username, password, apiKey, storageLimitMb } = body;

    const existing = await prisma.mailHost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Host Mail không tồn tại" }, { status: 404 });
    }

    const updateData: any = {
      name,
      domain: domain ? domain.trim().toLowerCase() : existing.domain,
      serverAddress: serverAddress ? serverAddress.trim() : existing.serverAddress,
      protocol: protocol || existing.protocol,
      port: port ? parseInt(port) : existing.port,
      username: username ? username.trim() : existing.username,
      storageLimitMb: storageLimitMb ? parseFloat(storageLimitMb) : existing.storageLimitMb,
    };

    if (password && password !== "••••••••") {
      updateData.passwordEncrypted = encrypt(password);
    }
    if (apiKey && apiKey !== "••••••••") {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }

    const updated = await prisma.mailHost.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      action: "UPDATE_MAIL_HOST",
      resourceType: "MailHost",
      resourceId: id,
      details: `Đã cập nhật cấu hình Host Mail "${updated.name}"`,
    });

    return NextResponse.json({
      data: {
        ...updated,
        passwordEncrypted: maskSecret(updated.passwordEncrypted),
        apiKeyEncrypted: updated.apiKeyEncrypted ? maskSecret(updated.apiKeyEncrypted) : null,
      },
      message: "Cập nhật Host Mail thành công",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const host = await prisma.mailHost.findUnique({ where: { id } });
    if (!host) {
      return NextResponse.json({ error: "Host Mail không tồn tại" }, { status: 404 });
    }

    await prisma.mailHost.delete({ where: { id } });

    await logActivity({
      action: "DELETE_MAIL_HOST",
      resourceType: "MailHost",
      resourceId: id,
      details: `Đã xóa Host Mail "${host.name}" (${host.domain})`,
    });

    return NextResponse.json({ message: "Xóa Host Mail thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


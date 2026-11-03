import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, maskSecret } from "@/lib/crypto";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hosts = await prisma.mailHost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            emailAccounts: true,
            emailMessages: true,
          },
        },
      },
    });

    const safeHosts = hosts.map((h) => ({
      ...h,
      passwordEncrypted: maskSecret(h.passwordEncrypted),
      apiKeyEncrypted: h.apiKeyEncrypted ? maskSecret(h.apiKeyEncrypted) : null,
      emailCount: h._count.emailAccounts,
      messageCount: h._count.emailMessages,
    }));

    return NextResponse.json({ data: safeHosts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, domain, serverAddress, protocol, port, username, password, apiKey } = body;

    if (!name || !domain || !serverAddress || !username || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các thông tin bắt buộc" }, { status: 400 });
    }

    const host = await prisma.mailHost.create({
      data: {
        name,
        domain: domain.trim().toLowerCase(),
        serverAddress: serverAddress.trim(),
        protocol: protocol || "IMAP",
        port: parseInt(port) || 993,
        username: username.trim(),
        passwordEncrypted: encrypt(password),
        apiKeyEncrypted: apiKey ? encrypt(apiKey) : null,
        status: "CONNECTED",
        storageUsedMb: 0,
        storageLimitMb: 5000,
        lastCheckedAt: new Date(),
      },
    });

    await logActivity({
      action: "CREATE_MAIL_HOST",
      resourceType: "MailHost",
      resourceId: host.id,
      details: `Đã thêm mới Host Mail "${host.name}" (${host.domain})`,
    });

    return NextResponse.json({
      data: {
        ...host,
        passwordEncrypted: maskSecret(host.passwordEncrypted),
        apiKeyEncrypted: host.apiKeyEncrypted ? maskSecret(host.apiKeyEncrypted) : null,
      },
      message: "Thêm Host Mail thành công",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


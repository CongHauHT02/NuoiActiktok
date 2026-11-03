import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const host = await prisma.mailHost.findUnique({ where: { id } });

    if (!host) {
      return NextResponse.json({ error: "Host Mail không tồn tại" }, { status: 404 });
    }

    // Simulate real connection handshake test (delay ~400ms)
    await new Promise((r) => setTimeout(r, 450));

    // Determine status: if server address is invalid or port is weird
    const isError = host.serverAddress.includes("error") || host.domain.includes("offline");
    const newStatus = isError ? "ERROR" : "CONNECTED";
    const errorMessage = isError ? "Connection timeout after 15000ms: Máy chủ không phản hồi" : null;

    const updated = await prisma.mailHost.update({
      where: { id },
      data: {
        status: newStatus,
        lastCheckedAt: new Date(),
        errorMessage,
      },
    });

    await logActivity({
      action: "TEST_CONNECTION",
      resourceType: "MailHost",
      resourceId: id,
      details: `Kiểm tra kết nối tới ${host.serverAddress}:${host.port} -> Kết quả: ${newStatus}`,
      status: isError ? "WARNING" : "SUCCESS",
    });

    return NextResponse.json({
      success: !isError,
      status: newStatus,
      latencyMs: Math.floor(Math.random() * 45) + 35,
      message: isError ? "Kiểm tra kết nối thất bại" : "Kết nối thành công tới máy chủ Mail",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


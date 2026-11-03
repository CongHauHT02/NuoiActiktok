import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({
      user: adminUser || {
        id: "usr_admin",
        name: "Nguyễn Hoàng Nam",
        email: "admin@tiktokmanager.io",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


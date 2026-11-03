import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const setupStatus = searchParams.get("setupStatus");
    const search = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (setupStatus && setupStatus !== "ALL") where.setupStatus = setupStatus;
    if (search) {
      where.tiktokAccount = {
        OR: [
          { username: { contains: search } },
          { displayName: { contains: search } },
        ],
      };
    }

    const [total, profiles, templates] = await Promise.all([
      prisma.accountProfile.count({ where }),
      prisma.accountProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          tiktokAccount: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              country: true,
              language: true,
              status: true,
              followersCount: true,
              likesCount: true,
              videosCount: true,
              group: { select: { name: true, color: true } },
            },
          },
          template: true,
        },
      }),
      prisma.profileTemplate.findMany(),
    ]);

    return NextResponse.json({
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      templates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      profileId,
      setupStatus,
      targetDisplayName,
      targetBio,
      targetAvatarUrl,
      targetCountry,
      targetLanguage,
      templateId,
      applyToAccount = true,
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID là bắt buộc" }, { status: 400 });
    }

    const profile = await prisma.accountProfile.findUnique({
      where: { id: profileId },
      include: { tiktokAccount: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Hồ sơ không tồn tại" }, { status: 404 });
    }

    const updatedProfile = await prisma.accountProfile.update({
      where: { id: profileId },
      data: {
        setupStatus: setupStatus || profile.setupStatus,
        targetDisplayName: targetDisplayName !== undefined ? targetDisplayName : profile.targetDisplayName,
        targetBio: targetBio !== undefined ? targetBio : profile.targetBio,
        targetAvatarUrl: targetAvatarUrl !== undefined ? targetAvatarUrl : profile.targetAvatarUrl,
        targetCountry: targetCountry !== undefined ? targetCountry : profile.targetCountry,
        targetLanguage: targetLanguage !== undefined ? targetLanguage : profile.targetLanguage,
        templateId: templateId !== undefined ? templateId : profile.templateId,
        completedAt: setupStatus === "COMPLETED" ? new Date() : profile.completedAt,
      },
      include: { tiktokAccount: true, template: true },
    });

    // Optionally apply updates directly to TikTokAccount entity
    if (applyToAccount && profile.tiktokAccount) {
      await prisma.tikTokAccount.update({
        where: { id: profile.tiktokAccount.id },
        data: {
          displayName: targetDisplayName || profile.tiktokAccount.displayName,
          bio: targetBio !== undefined ? targetBio : profile.tiktokAccount.bio,
          avatarUrl: targetAvatarUrl !== undefined ? targetAvatarUrl : profile.tiktokAccount.avatarUrl,
          country: targetCountry || profile.tiktokAccount.country,
          language: targetLanguage || profile.tiktokAccount.language,
          status: setupStatus === "COMPLETED" ? "CONFIGURED" : profile.tiktokAccount.status,
        },
      });
    }

    await logActivity({
      action: "UPDATE_PROFILE",
      resourceType: "AccountProfile",
      resourceId: profileId,
      details: `Cập nhật hồ sơ tài khoản @${profile.tiktokAccount.username} -> Trạng thái: ${setupStatus || profile.setupStatus}`,
    });

    return NextResponse.json({
      data: updatedProfile,
      message: "Cập nhật hồ sơ thành công",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


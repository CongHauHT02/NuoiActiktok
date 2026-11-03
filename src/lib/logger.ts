import prisma from "./prisma";

export interface LogActivityParams {
  userId?: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  status?: "SUCCESS" | "WARNING" | "ERROR";
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userName: params.userName || "Admin",
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress || "127.0.0.1",
        status: params.status || "SUCCESS",
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}


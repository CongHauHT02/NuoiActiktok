import prisma from "./prisma";

export interface TaskLogEntry {
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
}

// In-memory control state for active tasks (pause/cancel signals)
const taskControls = new Map<string, { paused: boolean; cancelled: boolean }>();

export const TaskQueue = {
  getControl(taskId: string) {
    if (!taskControls.has(taskId)) {
      taskControls.set(taskId, { paused: false, cancelled: false });
    }
    return taskControls.get(taskId)!;
  },

  pause(taskId: string) {
    const ctrl = this.getControl(taskId);
    ctrl.paused = true;
  },

  resume(taskId: string) {
    const ctrl = this.getControl(taskId);
    ctrl.paused = false;
  },

  cancel(taskId: string) {
    const ctrl = this.getControl(taskId);
    ctrl.cancelled = true;
  },

  async isCancelled(taskId: string): Promise<boolean> {
    const ctrl = taskControls.get(taskId);
    if (ctrl?.cancelled) return true;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    return task?.status === "CANCELLED";
  },

  async isPaused(taskId: string): Promise<boolean> {
    const ctrl = taskControls.get(taskId);
    if (ctrl?.paused) return true;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    return task?.status === "PAUSED";
  },

  async log(taskId: string, message: string, level: "INFO" | "WARN" | "ERROR" | "SUCCESS" = "INFO") {
    try {
      await prisma.taskLog.create({
        data: {
          taskId,
          message,
          level,
        },
      });
    } catch (err) {
      console.error("Task log error:", err);
    }
  },

  async updateProgress(taskId: string, processed: number, total: number) {
    const progressPercent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
    await prisma.task.update({
      where: { id: taskId },
      data: {
        processedItems: processed,
        totalItems: total,
        progressPercent,
      },
    });
  },

  async startTask(taskName: string, type: string, totalItems: number, userId?: string) {
    const task = await prisma.task.create({
      data: {
        taskName,
        type,
        totalItems,
        processedItems: 0,
        progressPercent: 0,
        status: "RUNNING",
        startedAt: new Date(),
        userId,
      },
    });
    taskControls.set(task.id, { paused: false, cancelled: false });
    await this.log(task.id, `Tác vụ "${taskName}" đã bắt đầu khởi chạy...`, "INFO");
    return task;
  },

  async completeTask(taskId: string, message: string = "Tác vụ hoàn thành thành công") {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const startedAt = task?.startedAt || new Date();
    const durationSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        progressPercent: 100,
        completedAt: new Date(),
        totalDurationSeconds: Math.round(durationSeconds * 10) / 10,
      },
    });
    await this.log(taskId, message, "SUCCESS");
    taskControls.delete(taskId);
  },

  async failTask(taskId: string, errorDetail: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const startedAt = task?.startedAt || new Date();
    const durationSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        errorDetail,
        completedAt: new Date(),
        totalDurationSeconds: Math.round(durationSeconds * 10) / 10,
      },
    });
    await this.log(taskId, `Lỗi tác vụ: ${errorDetail}`, "ERROR");
    taskControls.delete(taskId);
  },

  /**
   * Helper: simulate work loop with pause/cancel checks and delay
   */
  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};


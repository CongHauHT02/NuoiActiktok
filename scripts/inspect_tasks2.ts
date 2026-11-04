import prisma from "../src/lib/prisma";

async function main() {
  const tasks = await prisma.task.findMany({
    orderBy: { startedAt: "desc" },
    take: 3,
  });
  console.log("Tasks:", tasks.map(t => ({ id: t.id, name: t.taskName, status: t.status, startedAt: t.startedAt })));
}

main().catch(console.error);


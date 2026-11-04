import prisma from "../src/lib/prisma";

async function main() {
  const logs = await prisma.taskLog.findMany({
    where: { taskId: 'cmw1r49zv0000vt830gbz8t77' },
    orderBy: { timestamp: "asc" }
  });
  for (const l of logs) {
    console.log(`[${l.level}] ${l.message}`);
  }
}

main().catch(console.error);


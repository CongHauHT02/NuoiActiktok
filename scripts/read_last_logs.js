const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const logs = await p.taskLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 40,
  });
  logs.reverse().forEach((l) => console.log(`[${l.timestamp.toISOString()}] [${l.level}] ${l.message}`));
}
main().finally(() => p.$disconnect());

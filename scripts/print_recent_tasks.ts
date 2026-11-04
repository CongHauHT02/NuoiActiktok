import prisma from "../src/lib/prisma";

async function main() {
  const ids = ['cmw1rohh50000dy3q1zf6fexb', 'cmw1rrh5a001ody3qwk8r3hjm'];
  for (const id of ids) {
    console.log(`\n================ TASK ${id} ================`);
    const logs = await prisma.taskLog.findMany({
      where: { taskId: id },
      orderBy: { timestamp: "asc" }
    });
    for (const l of logs) {
      console.log(`[${l.level}] ${l.message}`);
    }
  }
}

main().catch(console.error);


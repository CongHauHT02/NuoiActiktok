import prisma from "../src/lib/prisma";

async function main() {
  const latestTask = await prisma.task.findFirst({
    orderBy: { createdAt: "desc" },
  });
  console.log("Latest task title:", latestTask?.title);
  console.log("Latest task payload:", latestTask?.payload);
}

main().catch(console.error);

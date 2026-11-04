import prisma from "../src/lib/prisma";

async function main() {
  const hosts = await prisma.mailHost.findMany();
  console.log("Hosts:", hosts.map(h => ({ id: h.id, username: h.username, domain: h.domain })));
}

main().catch(console.error);


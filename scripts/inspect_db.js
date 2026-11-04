const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const msgs = await p.emailMessage.findMany({ take: 5 });
  console.log("DB Messages:", msgs.length);
  msgs.forEach((m) => {
    console.log({
      sender: m.sender,
      subject: m.subject,
      code: m.verificationCode,
      date: m.receivedAt,
    });
  });

  const hosts = await p.mailHost.findMany();
  console.log("DB MailHosts:", hosts.length);
  hosts.forEach((h) => {
    console.log({
      id: h.id,
      name: h.name,
      domain: h.domain,
      address: h.serverAddress,
      username: h.username,
    });
  });
}

main().finally(() => p.$disconnect());


import prisma from "../src/lib/prisma";
import { decrypt } from "../src/lib/crypto";
import tls from "tls";

async function inspectGmail() {
  const host = await prisma.mailHost.findFirst({
    where: { username: { contains: "doanconghaut" } },
  });

  if (!host) {
    console.log("No host found with doanconghaut");
    const anyHost = await prisma.mailHost.findFirst();
    console.log("Any host:", anyHost?.username);
    return;
  }

  const pass = decrypt(host.passwordEncrypted);
  console.log("Inspecting Gmail for:", host.username);

  const socket = tls.connect(
    {
      host: "imap.gmail.com",
      port: 993,
      servername: "imap.gmail.com",
      rejectUnauthorized: false,
    },
    () => {
      let tag = 1;
      let buffer = "";

      const send = (cmd: string) => {
        const cur = "A" + tag++;
        socket.write(`${cur} ${cmd}\r\n`);
        return cur;
      };

      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");

        if (buffer.includes("* OK") && !buffer.includes("LOGIN")) {
          send(`LOGIN "${host.username}" "${pass}"`);
        } else if (buffer.includes("A1 OK")) {
          buffer = "";
          send("SELECT INBOX");
        } else if (buffer.includes("A2 OK")) {
          buffer = "";
          send('SEARCH FROM "tiktok"');
        } else if (buffer.includes("A3 OK")) {
          const match = buffer.match(/\* SEARCH ([\d\s]+)/);
          const seqs = match ? match[1].trim().split(/\s+/).filter(Boolean) : [];
          console.log("TikTok email sequence IDs:", seqs);
          buffer = "";
          if (seqs.length > 0) {
            // Fetch the last 5 emails
            const lastSeqs = seqs.slice(-5);
            send(`FETCH ${lastSeqs.join(",")} (INTERNALDATE BODY[HEADER.FIELDS (DATE SUBJECT FROM)] BODY[TEXT])`);
          } else {
            socket.end();
          }
        } else if (buffer.includes("A4 OK")) {
          console.log("=== RAW FETCH RESPONSE ===");
          console.log(buffer);
          socket.end();
        }
      });

      socket.on("end", () => {
        console.log("IMAP connection closed.");
        process.exit(0);
      });
    }
  );
}

inspectGmail().catch(console.error);

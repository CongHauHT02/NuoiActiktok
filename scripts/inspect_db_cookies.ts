import prisma from "../src/lib/prisma";

async function inspectCookies() {
  const accs = await prisma.tikTokAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const a of accs) {
    console.log("-----------------------------------------");
    console.log("Account ID:", a.id);
    console.log("Username in DB:", a.username);
    console.log("Email:", a.email);
    let cookies: any[] = [];
    try {
      cookies = JSON.parse(a.sessionCookies || "[]");
    } catch {}
    console.log("Total cookies saved:", cookies.length);
    console.log(
      "Cookie names:",
      cookies.map((c) => c.name)
    );
    const hasSessionId = cookies.some((c) => c.name === "sessionid");
    console.log("Has 'sessionid' cookie?", hasSessionId);
  }
}

inspectCookies().catch(console.error);


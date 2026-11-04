import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), ".attempted_dot_emails.json");

export function getAttemptedEmails(): Set<string> {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
      if (Array.isArray(data)) {
        return new Set(data.map((e: string) => e.toLowerCase().trim()));
      }
    }
  } catch {}
  return new Set([
    "d.oanconghaut@gmail.com",
    "d.oanconghau231020@gmail.com",
    "d.oanconghaulochung2018@gmail.com",
  ]);
}

export function recordAttemptedEmails(emails: string[]): void {
  try {
    const existing = getAttemptedEmails();
    for (const email of emails) {
      if (email) existing.add(email.toLowerCase().trim());
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(Array.from(existing), null, 2), "utf-8");
  } catch (e: any) {
    console.error("Failed to record attempted emails:", e.message);
  }
}


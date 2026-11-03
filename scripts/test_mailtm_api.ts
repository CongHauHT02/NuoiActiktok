import { MailTmService } from "../src/lib/mailTmService";

async function testMailTm() {
  const mb = await MailTmService.createTempMailbox();
  console.log("Created mailbox:", mb.email);
  const otp = await MailTmService.waitForTikTokOtp(mb.token, 5, async (m) => console.log(m));
  console.log("OTP result:", otp);
}

testMailTm().catch(console.error);

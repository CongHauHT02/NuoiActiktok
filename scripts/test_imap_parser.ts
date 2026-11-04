function testDateAndOtp() {
  const oldEmail = `
* 10 FETCH (INTERNALDATE "03-Nov-2026 12:00:00 +0000" BODY[HEADER.FIELDS (SUBJECT DATE)] {80}
Date: Tue, 03 Nov 2026 12:00:00 +0000
Subject: 111222 is your verification code

 BODY[TEXT] {100}
color: #000000;
)
A1 OK Fetch completed.
  `;

  const newEmail = `
* 11 FETCH (INTERNALDATE "${new Date().toUTCString()}" BODY[HEADER.FIELDS (SUBJECT DATE)] {80}
Date: ${new Date().toUTCString()}
Subject: 948215 is your verification code

 BODY[TEXT] {100}
color: #000000;
enter this code in TikTok: 948215
)
A2 OK Fetch completed.
  `;

  function checkEmail(buffer: string): string | null {
    const dateMatch = buffer.match(/Date:\s*([^\r\n]+)/i) || buffer.match(/INTERNALDATE\s+"([^"]+)"/i);
    if (dateMatch) {
      const msgDate = new Date(dateMatch[1]).getTime();
      if (!isNaN(msgDate) && (Date.now() - msgDate) > 5 * 60 * 1000) {
        console.log("Ignored old email dated:", dateMatch[1]);
        return null;
      }
    }

    // 1. Subject pattern
    const subjMatch = buffer.match(/\b(\d{6})\b\s*(?:is your verification code|là mã xác minh|is your TikTok code)/i);
    if (subjMatch) return subjMatch[1];

    // 2. Body phrase
    const phraseMatch = buffer.match(/(?:enter this code in TikTok|nhập mã này|Verification Code|Mã xác minh)[^0-9]{1,60}(\d{6})\b/i);
    if (phraseMatch && phraseMatch[1] !== "000000" && phraseMatch[1] !== "111111") {
      return phraseMatch[1];
    }

    // 3. Fallback
    const matches = Array.from(buffer.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
      .map((m) => m[1])
      .filter((digits) => digits !== "000000" && digits !== "111111" && !digits.startsWith("0000"));

    return matches[0] || null;
  }

  console.log("Old email result:", checkEmail(oldEmail));
  console.log("New email result:", checkEmail(newEmail));
}

testDateAndOtp();

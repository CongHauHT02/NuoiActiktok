function decodeMimeWord(str) {
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        return Buffer.from(text, "base64").toString("utf8");
      } else if (encoding.toUpperCase() === "Q") {
        const clean = text.replace(/_/g, " ").replace(/=\r?\n/g, "");
        const bytes = [];
        for (let i = 0; i < clean.length; i++) {
          if (clean[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(clean.substring(i + 1, i + 3))) {
            bytes.push(parseInt(clean.substring(i + 1, i + 3), 16));
            i += 2;
          } else {
            bytes.push(clean.charCodeAt(i));
          }
        }
        return Buffer.from(bytes).toString("utf8");
      }
    } catch {
      return text;
    }
    return text;
  });
}

const d1 = new Date("Wed, 4 Nov 2026 01:52:19 +0000 (UTC)").getTime();
console.log("Date 1:", d1, isNaN(d1));
const d2 = new Date("INTERNALDATE \" 4-Nov-2026 01:52:19 +0000\"".match(/INTERNALDATE\s+"([^"]+)"/)[1]).getTime();
console.log("Date 2 (INTERNALDATE):", d2, isNaN(d2));



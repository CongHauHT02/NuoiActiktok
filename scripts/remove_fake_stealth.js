const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/autoRegWorker.ts";
let content = fs.readFileSync(filePath, "utf-8");

const regex = /\/\/\s*Advanced Stealth evasion for ByteDance MSSDK[\s\S]*?Safari\/537\.36"\s*\);/;

if (regex.test(content)) {
  content = content.replace(regex, "// Native untampered Chrome session (ByteDance MSSDK friendly)");
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Successfully removed fake stealth overrides!");
} else {
  console.error("Regex still did not match!");
}


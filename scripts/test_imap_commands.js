const tls = require("tls");

const socket = tls.connect(
  {
    host: "imap.gmail.com",
    port: 993,
    servername: "imap.gmail.com",
    rejectUnauthorized: false,
  },
  () => {
    console.log("Connected to Gmail IMAP (rejectUnauthorized: false)");
  }
);

socket.on("data", (data) => {
  const str = data.toString();
  console.log("RECV:", str.trim());
  if (str.includes("* OK")) {
    socket.write("A1 CAPABILITY\r\n");
  }
  if (str.includes("A1 OK")) {
    socket.end();
  }
});

socket.on("error", (err) => console.error("Error:", err));
socket.on("end", () => console.log("Socket ended"));


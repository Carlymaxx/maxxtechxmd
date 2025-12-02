import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";

const OWNER_NUMBER = "254100638635@s.whatsapp.net"; // your WhatsApp number

const AUTH_FOLDER = path.join(process.cwd(), "auth_info_baileys");

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    if (connection === "open") {
      console.log("✅ Connected Successfully!");

      const credsPath = path.join(AUTH_FOLDER, "creds.json");
      if (fs.existsSync(credsPath)) {
        const creds = fs.readFileSync(credsPath, "utf8");
        const sessionId = Buffer.from(creds).toString("base64");

        await sock.sendMessage(OWNER_NUMBER, {
          text: `✅ MAXX-XMD SESSION READY!

\\\${sessionId}\\\

⚠ Keep this private and paste it in your config.js like this:

SESSION_ID: "${sessionId}"
`,
        });

        console.log("📤 Session ID successfully sent to your WhatsApp!");
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

start();
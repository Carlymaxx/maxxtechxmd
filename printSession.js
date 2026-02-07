import { makeWaSocket, useSingleFileAuthState } from "@whiskeysockets/baileys";
import fs from "fs";

const { state, saveState } = useSingleFileAuthState("./auth_info_baileys/session.json");

const sock = makeWaSocket({
    auth: state,
});

sock.ev.on("creds.update", saveState);

sock.ev.on("connection.update", (update) => {
    console.log(update);

    if (update.qr) {
        console.log("🔑 Scan this QR code with your WhatsApp to generate a session:");
        console.log(update.qr);
    }

    if (update.connection === "open") {
        console.log("✅ Logged in successfully!");
        const sessionData = fs.readFileSync("./auth_info_baileys/session.json", "utf-8");
        console.log("📄 Your session JSON:\n");
        console.log(sessionData);
        process.exit(0); // exit after printing session
    }
});

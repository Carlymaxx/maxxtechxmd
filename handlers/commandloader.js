import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const commandDir = path.join(__dirname, "../commands");

const commands = new Map();

export async function loadCommands() {
  const files = fs.readdirSync(commandDir).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const { default: command } = await import(`../commands/${file}`);
    commands.set(command.name, command);
  }

  console.log(`✅ Loaded ${commands.size} command(s)`);
}

export function getCommand(name) {
  return commands.get(name);
}
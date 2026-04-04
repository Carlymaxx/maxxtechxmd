import type { WASocket, WAMessage, proto } from "@whiskeysockets/baileys";
import type { BotSettings } from "../botState";

export interface CommandContext {
  sock: WASocket;
  msg: WAMessage;
  from: string;
  sender: string;
  senderName: string;
  isGroup: boolean;
  isOwner: boolean;
  isSudo: boolean;
  body: string;
  args: string[];
  text: string;
  prefix: string;
  commandName: string;
  settings: BotSettings;
  quoted: WAMessage | null | undefined;
  groupMetadata?: proto.IGroupMetadata | null;
  reply: (text: string) => Promise<void>;
  react: (emoji: string) => Promise<void>;
}

export interface BotCommand {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  usage?: string;
  groupOnly?: boolean;
  dmOnly?: boolean;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  sudoOnly?: boolean;
  handler: (ctx: CommandContext) => Promise<void>;
}

export const commandRegistry = new Map<string, BotCommand>();

export function registerCommand(cmd: BotCommand) {
  commandRegistry.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commandRegistry.set(alias.toLowerCase(), cmd);
    }
  }
}

export function getCommand(name: string): BotCommand | undefined {
  return commandRegistry.get(name.toLowerCase());
}

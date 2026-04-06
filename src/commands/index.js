import { menuCommand } from './menu.js';
import { botCommand } from './bot.js';
import { groupStatusCommand } from './groupstatus.js';
import {
  tagAllCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  ginfoCommand,
  linkCommand,
  promoteCommand,
  demoteCommand,
} from './group.js';
import {
  restartCommand,
  broadcastCommand,
  setAutoReactCommand,
  setAutoReadCommand,
} from './owner.js';

const allCommands = [
  menuCommand,
  botCommand,
  groupStatusCommand,
  tagAllCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  ginfoCommand,
  linkCommand,
  promoteCommand,
  demoteCommand,
  restartCommand,
  broadcastCommand,
  setAutoReactCommand,
  setAutoReadCommand,
];

// Build a flat map of name -> handler
const commandMap = new Map();
for (const cmd of allCommands) {
  for (const name of cmd.names) {
    commandMap.set(name.toLowerCase(), cmd);
  }
}

export function getCommand(name) {
  return commandMap.get(name.toLowerCase()) || null;
}

export { allCommands };

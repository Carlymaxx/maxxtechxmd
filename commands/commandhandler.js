const fs = require("fs");
const path = require("path");

const commands = {};
const commandDir = path.join(__dirname, "../commands");

fs.readdirSync(commandDir).forEach(file => {
  if (file.endsWith(".js")) {
    const command = require(path.join(commandDir, file));
    commands[command.name] = command;
  }
});

module.exports = commands;
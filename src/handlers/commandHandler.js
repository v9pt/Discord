'use strict';

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

/**
 * Load all slash commands from the commands/ directory
 * @param {import('discord.js').Client} client
 */
function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, '..', 'commands');

  function readDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const command = require(fullPath);
          if (!command.data || !command.execute) {
            console.warn(`[Commands] Skipping ${entry.name}: missing data or execute`);
            continue;
          }
          client.commands.set(command.data.name, command);
          console.log(`[Commands] Loaded: /${command.data.name}`);
        } catch (err) {
          console.error(`[Commands] Failed to load ${entry.name}:`, err.message);
        }
      }
    }
  }

  readDir(commandsPath);
  console.log(`[Commands] Total loaded: ${client.commands.size}`);
}

module.exports = { loadCommands };

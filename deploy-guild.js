'use strict';

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ TOKEN, CLIENT_ID, and GUILD_ID must be set in .env for guild deployment');
  process.exit(1);
}

const commands = [];

function readDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.data) {
          commands.push(command.data.toJSON());
          console.log(`✅ Queued: /${command.data.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load ${entry.name}:`, err.message);
      }
    }
  }
}

readDir(path.join(__dirname, 'src', 'commands'));

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`\n🔄 Registering ${commands.length} commands to guild ${GUILD_ID}...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Registered ${data.length} commands instantly to guild.\n`);
    console.log('💡 These commands are only available in this guild (instant update).');
  } catch (err) {
    console.error('❌ Guild deploy failed:', err.message);
    process.exit(1);
  }
})();

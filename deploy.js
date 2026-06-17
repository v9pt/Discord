'use strict';

require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

// Collect all command definitions by walking the commands directory
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
    console.log(`\n🔄 Registering ${commands.length} application (/) commands...`);

    // Global deployment (works in all servers, takes up to 1 hour to propagate)
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log(`✅ Successfully registered ${data.length} commands globally.\n`);
    console.log('⏰ Note: Global commands may take up to 1 hour to appear in Discord.');
    console.log('💡 For instant updates during development, use guild-specific deployment.');
  } catch (err) {
    console.error('❌ Deploy failed:', err.message);
    process.exit(1);
  }
})();
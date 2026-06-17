'use strict';

require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { connectDatabase } = require('./src/database/connection');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { registerErrorHandlers } = require('./src/handlers/errorHandler');

// Validate required environment variables
const required = ['TOKEN', 'MONGODB_URI', 'CLIENT_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Initialize Discord client with all required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Channel,    // DMs
    Partials.Message,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

async function main() {
  console.log('🚀 Starting Community Bot...\n');

  // Connect to MongoDB
  await connectDatabase();

  // Register global error handlers
  registerErrorHandlers(client);

  // Load handlers
  loadCommands(client);
  loadEvents(client);

  // Login to Discord
  await client.login(process.env.TOKEN);
}

main().catch((err) => {
  console.error('❌ Fatal startup error:', err.message);
  process.exit(1);
});

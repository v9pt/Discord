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

const http = require('http');

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

  // Start keep-alive HTTP server
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is online and healthy!\n');
  });
  server.listen(port, () => {
    console.log(`🌐 Keep-alive server listening on port ${port}`);
  });

  // Login to Discord
  console.log('🔌 Connecting to Discord...');
  await client.login(process.env.TOKEN);
  console.log('✅ client.login() promise resolved successfully');
}

main().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});

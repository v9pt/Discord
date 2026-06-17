'use strict';

const { EmbedBuilder, ActivityType } = require('discord.js');
const { Colors, FOOTER_TEXT, BOT_VERSION } = require('../config/colors');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    console.log(`\n✅ ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`👥 ${client.users.cache.size} cached users`);
    console.log(`🤖 Bot Version: ${BOT_VERSION}\n`);

    // Set bot presence
    client.user.setPresence({
      activities: [
        {
          name: '/setup | Community Bot',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Rotate status every 5 minutes
    const statuses = [
      { name: '/setup | Community Bot', type: ActivityType.Watching },
      { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
      { name: 'Dead By Daylight 🔪', type: ActivityType.Playing },
      { name: 'your tickets 🎫', type: ActivityType.Watching },
    ];

    let statusIndex = 0;
    setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      client.user.setActivity(statuses[statusIndex]);
    }, 5 * 60 * 1000);
  },
};

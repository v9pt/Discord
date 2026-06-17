'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and status'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [createEmbed({ title: '🏓 Pinging...', description: 'Calculating latency...', timestamp: false })],
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [
        createEmbed({
          title: '🏓 Pong!',
          type: latency < 100 ? 'success' : latency < 250 ? 'warning' : 'error',
          fields: [
            { name: '⚡ Bot Latency', value: `\`${latency}ms\``, inline: true },
            { name: '🌐 WebSocket', value: `\`${wsLatency}ms\``, inline: true },
            { name: '📊 Status', value: latency < 100 ? '🟢 Excellent' : latency < 250 ? '🟡 Good' : '🔴 High', inline: true },
          ],
        }),
      ],
    });
  },
};

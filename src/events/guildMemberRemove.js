'use strict';

const { EmbedBuilder } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../config/colors');
const { generateWelcomeCard } = require('../systems/welcome/welcomeCard');
const { logMemberLeave } = require('../systems/logging/logger');
const Guild = require('../models/Guild');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(member, client) {
    const { guild } = member;

    try {
      const guildData = await Guild.findOne({ guildId: guild.id });
      if (!guildData) return;

      const logChannelId = guildData.channels.generalChat;
      if (!logChannelId) return;

      const logChannel = guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      // Generate goodbye card
      const card = await generateWelcomeCard(member, 'goodbye');

      const embed = new EmbedBuilder()
        .setColor(Colors.MUTED)
        .setTitle(`👋 Goodbye, ${member.user.username}!`)
        .setDescription(
          [
            `**${member.user.tag}** has left the server.`,
            '',
            member.joinedAt
              ? `They were with us since <t:${Math.floor(member.joinedTimestamp / 1000)}:D>.`
              : '',
          ].join('\n')
        )
        .setFooter({ text: FOOTER_TEXT })
        .setTimestamp();

      await logChannel.send({ embeds: [embed], files: [card] });

      // Log departure
      await logMemberLeave(member);
    } catch (err) {
      console.error('[guildMemberRemove] Error:', err.message);
    }
  },
};

'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const { logModAction } = require('../../systems/logging/logger');
const { addWarning } = require('../../systems/automod/automodManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName('days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(interaction) {
    const { guild, member } = interaction;
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('❌ User Not Found', 'That user is not in this server.')], ephemeral: true });
    }

    if (target.id === member.id) {
      return interaction.reply({ embeds: [errorEmbed('❌ Invalid Target', 'You cannot ban yourself.')], ephemeral: true });
    }

    if (target.roles.highest.position >= member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('❌ Insufficient Hierarchy', 'You cannot ban someone with an equal or higher role.')], ephemeral: true });
    }

    try {
      await target.user.send({
        embeds: [errorEmbed('🔨 You Have Been Banned', `**Server:** ${guild.name}\n**Reason:** ${reason}`)],
      }).catch(() => {});

      await target.ban({ reason, deleteMessageSeconds: days * 86400 });

      await logModAction(guild, { action: 'ban', target: target.user, moderator: member.user, reason });

      return interaction.reply({
        embeds: [successEmbed('🔨 Member Banned', `**${target.user.tag}** has been banned.\n**Reason:** ${reason}`)],
      });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed('❌ Ban Failed', err.message)], ephemeral: true });
    }
  },
};

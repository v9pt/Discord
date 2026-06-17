'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const { logModAction } = require('../../systems/logging/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to kick').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason for the kick').setRequired(false)
    ),

  async execute(interaction) {
    const { guild, member } = interaction;
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('❌ User Not Found', 'That user is not in this server.')], ephemeral: true });
    }

    if (target.id === member.id) {
      return interaction.reply({ embeds: [errorEmbed('❌ Invalid Target', 'You cannot kick yourself.')], ephemeral: true });
    }

    if (target.roles.highest.position >= member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('❌ Insufficient Hierarchy', 'You cannot kick someone with an equal or higher role.')], ephemeral: true });
    }

    try {
      await target.user.send({
        embeds: [errorEmbed('👢 You Have Been Kicked', `**Server:** ${guild.name}\n**Reason:** ${reason}`)],
      }).catch(() => {});

      await target.kick(reason);
      await logModAction(guild, { action: 'kick', target: target.user, moderator: member.user, reason });

      return interaction.reply({
        embeds: [successEmbed('👢 Member Kicked', `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)],
      });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed('❌ Kick Failed', err.message)], ephemeral: true });
    }
  },
};

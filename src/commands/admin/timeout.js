'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const { logModAction } = require('../../systems/logging/logger');
// Duration units
const DURATION_UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to timeout').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('duration').setDescription('Duration (e.g. 5m, 1h, 1d)').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('reason').setDescription('Reason').setRequired(false)
    ),

  async execute(interaction) {
    const { guild, member } = interaction;
    const target = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('❌ User Not Found', 'That user is not in this server.')], ephemeral: true });
    }

    if (target.id === member.id) {
      return interaction.reply({ embeds: [errorEmbed('❌ Invalid Target', 'You cannot timeout yourself.')], ephemeral: true });
    }

    // Parse duration
    const durationMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      return interaction.reply({ embeds: [errorEmbed('❌ Invalid Duration', 'Use format: `5m`, `1h`, `2d` (s/m/h/d)')], ephemeral: true });
    }
    const durationMs = parseInt(match[1]) * (durationMap[match[2]] || 0);

    // Max 28 days
    if (durationMs > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ embeds: [errorEmbed('❌ Too Long', 'Maximum timeout duration is 28 days.')], ephemeral: true });
    }

    try {
      await target.timeout(durationMs, reason);
      await logModAction(guild, { action: 'timeout', target: target.user, moderator: member.user, reason, duration: durationStr });

      await target.user.send({
        embeds: [errorEmbed('🔇 You Have Been Timed Out', `**Server:** ${guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}`)],
      }).catch(() => {});

      return interaction.reply({
        embeds: [successEmbed('🔇 Member Timed Out', `**${target.user.tag}** has been timed out for **${durationStr}**.\n**Reason:** ${reason}`)],
      });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed('❌ Timeout Failed', err.message)], ephemeral: true });
    }
  },
};

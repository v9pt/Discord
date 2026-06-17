'use strict';

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { successEmbed, errorEmbed, warningEmbed } = require('../../utils/embedBuilder');
const { logModAction } = require('../../systems/logging/logger');
const { addWarning } = require('../../systems/automod/automodManager');
const Warning = require('../../models/Warning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Issue a warning to a member')
        .addUserOption((opt) => opt.setName('user').setDescription('The user to warn').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the warning').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('View warnings for a member')
        .addUserOption((opt) => opt.setName('user').setDescription('The user to check').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all warnings for a member')
        .addUserOption((opt) => opt.setName('user').setDescription('The user to clear').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { guild, member } = interaction;
    const targetUser = interaction.options.getUser('user');

    if (sub === 'add') {
      const reason = interaction.options.getString('reason');
      const targetMember = interaction.options.getMember('user');

      if (!targetMember) {
        return interaction.reply({ embeds: [errorEmbed('❌ User Not Found', 'That user is not in this server.')], ephemeral: true });
      }

      const warnCount = await addWarning(targetUser.id, guild.id, reason, member.id, member.user.tag);

      // DM the user
      await targetUser.send({
        embeds: [
          warningEmbed(
            '⚠️ You Have Been Warned',
            [
              `**Server:** ${guild.name}`,
              `**Reason:** ${reason}`,
              `**Warning #${warnCount}**`,
              '',
              warnCount >= 3 ? '🔴 Further violations may result in a kick or ban.' : '',
            ].join('\n')
          ),
        ],
      }).catch(() => {});

      await logModAction(guild, { action: 'warn', target: targetUser, moderator: member.user, reason });

      return interaction.reply({
        embeds: [
          warningEmbed(
            `⚠️ Warning Issued — #${warnCount}`,
            `**User:** ${targetUser.tag}\n**Reason:** ${reason}\n**Total Warnings:** ${warnCount}`
          ),
        ],
      });
    }

    if (sub === 'list') {
      const doc = await Warning.findOne({ userId: targetUser.id, guildId: guild.id });

      if (!doc || !doc.warnings.length) {
        return interaction.reply({
          embeds: [successEmbed('✅ No Warnings', `**${targetUser.tag}** has no warnings.`)],
          ephemeral: true,
        });
      }

      const warningList = doc.warnings
        .slice(-10)
        .map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.moderatorTag} (<t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>)`)
        .join('\n');

      return interaction.reply({
        embeds: [
          warningEmbed(
            `⚠️ Warnings for ${targetUser.tag}`,
            `**Total:** ${doc.totalWarnings}\n\n${warningList}`
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'clear') {
      await Warning.findOneAndUpdate(
        { userId: targetUser.id, guildId: guild.id },
        { warnings: [], totalWarnings: 0 }
      );

      await logModAction(guild, { action: 'warn', target: targetUser, moderator: member.user, reason: 'Warnings cleared' });

      return interaction.reply({
        embeds: [successEmbed('✅ Warnings Cleared', `All warnings for **${targetUser.tag}** have been cleared.`)],
      });
    }
  },
};

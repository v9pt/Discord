'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');
const Verification = require('../../models/Verification');
const { logModAction } = require('../logging/logger');

/**
 * Build and send the verification panel embed to the verify channel
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').Guild} guild
 */
async function postVerificationPanel(channel, guild) {
  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('✅ Server Verification')
    .setDescription(
      [
        '**Welcome to the server!** 👋',
        '',
        'To gain access to all channels, please verify below.',
        '',
        '**By verifying you agree to:**',
        '> • Follow our server rules',
        '> • Treat all members with respect',
        '> • Keep all content appropriate',
        '',
        '> Click the **Verify** button to get started!',
      ].join('\n')
    )
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('✅ Verify Me')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('verify_rules')
      .setLabel('📜 Read Rules')
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

/**
 * Handle the verify button click
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleVerifyButton(interaction) {
  try {
    const { member, guild } = interaction;

    // Check if already verified
    const existing = await Verification.findOne({
      userId: member.id,
      guildId: guild.id,
    });

    if (existing?.verified) {
      return interaction.reply({
        content: '✅ You are already verified!',
        ephemeral: true,
      });
    }

    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData) {
      return interaction.reply({
        content: '❌ Server is not set up yet. Please contact an admin.',
        ephemeral: true,
      });
    }

    // Fetch roles
    const newMemberRole = guildData.roles.newMember
      ? guild.roles.cache.get(guildData.roles.newMember)
      : null;
    const verifiedRole = guildData.roles.verified
      ? guild.roles.cache.get(guildData.roles.verified)
      : null;
    const memberRole = guildData.roles.member
      ? guild.roles.cache.get(guildData.roles.member)
      : null;

    // Apply roles
    const addRoles = [];
    const removeRoles = [];

    if (newMemberRole && member.roles.cache.has(newMemberRole.id)) {
      removeRoles.push(newMemberRole);
    }
    if (verifiedRole) addRoles.push(verifiedRole);
    if (memberRole) addRoles.push(memberRole);

    await member.roles.remove(removeRoles).catch(() => {});
    await member.roles.add(addRoles).catch(() => {});

    // Save to DB
    await Verification.findOneAndUpdate(
      { userId: member.id, guildId: guild.id },
      { verified: true, verifiedAt: new Date(), verifiedBy: 'button' },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle('🎉 Welcome Aboard!')
      .setDescription(
        [
          `You're now verified in **${guild.name}**!`,
          '',
          '**What to do next:**',
          '> 🎭 Visit `#role-selection` to grab game roles',
          '> 👋 Introduce yourself in `#introductions`',
          '> 💬 Jump into `#general-chat`',
          '',
          'Enjoy your stay! 💜',
        ].join('\n')
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    await logModAction(guild, {
      action: 'verify',
      target: member.user,
      moderator: 'System',
      reason: 'Button verification',
    });
  } catch (err) {
    console.error('[Verification] Error:', err.message);
    await interaction.reply({
      content: '❌ An error occurred. Please try again.',
      ephemeral: true,
    });
  }
}

/**
 * Handle the rules button click
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleRulesButton(interaction) {
  const guildData = await Guild.findOne({ guildId: interaction.guild.id });
  const rulesChannelId = guildData?.channels?.rules;

  await interaction.reply({
    content: rulesChannelId
      ? `📜 Please check our rules in <#${rulesChannelId}>!`
      : '📜 Please check our rules channel!',
    ephemeral: true,
  });
}

module.exports = {
  postVerificationPanel,
  handleVerifyButton,
  handleRulesButton,
};

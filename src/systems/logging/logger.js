'use strict';

const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');

/**
 * Send a log embed to the guild's logs channel
 * @param {import('discord.js').Guild} guild
 * @param {EmbedBuilder} embed
 */
async function sendLog(guild, embed) {
  try {
    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData?.channels?.logs) return;

    const logsChannel = guild.channels.cache.get(guildData.channels.logs);
    if (!logsChannel) return;

    await logsChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[Logger] Failed to send log:', err.message);
  }
}

/**
 * Log a message delete event
 * @param {import('discord.js').Message} message
 */
async function logMessageDelete(message) {
  if (!message.guild || message.author?.bot) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.ERROR)
    .setTitle('🗑️ Message Deleted')
    .addFields(
      { name: 'Author', value: `${message.author?.tag || 'Unknown'} (${message.author?.id || 'N/A'})`, inline: true },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
      { name: 'Content', value: message.content?.slice(0, 1024) || '*No content*' }
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await sendLog(message.guild, embed);
}

/**
 * Log a message edit event
 * @param {import('discord.js').Message} oldMessage
 * @param {import('discord.js').Message} newMessage
 */
async function logMessageEdit(oldMessage, newMessage) {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setTitle('✏️ Message Edited')
    .addFields(
      { name: 'Author', value: `${newMessage.author?.tag} (${newMessage.author?.id})`, inline: true },
      { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
      { name: 'Before', value: oldMessage.content?.slice(0, 512) || '*Empty*' },
      { name: 'After', value: newMessage.content?.slice(0, 512) || '*Empty*' }
    )
    .setURL(newMessage.url)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await sendLog(newMessage.guild, embed);
}

/**
 * Log a member joining
 * @param {import('discord.js').GuildMember} member
 */
async function logMemberJoin(member) {
  const embed = new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle('📥 Member Joined')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
      { name: 'Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await sendLog(member.guild, embed);
}

/**
 * Log a member leaving
 * @param {import('discord.js').GuildMember} member
 */
async function logMemberLeave(member) {
  const embed = new EmbedBuilder()
    .setColor(Colors.MUTED)
    .setTitle('📤 Member Left')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
      { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'Roles', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'None' }
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await sendLog(member.guild, embed);
}

/**
 * Log a moderation action (warn, kick, ban, timeout, unban)
 * @param {import('discord.js').Guild} guild
 * @param {Object} data
 */
async function logModAction(guild, { action, target, moderator, reason, duration }) {
  const actionConfig = {
    warn: { emoji: '⚠️', color: Colors.WARNING, title: 'Warning Issued' },
    kick: { emoji: '👢', color: Colors.ERROR, title: 'Member Kicked' },
    ban: { emoji: '🔨', color: Colors.ERROR, title: 'Member Banned' },
    unban: { emoji: '✅', color: Colors.SUCCESS, title: 'Member Unbanned' },
    timeout: { emoji: '🔇', color: Colors.WARNING, title: 'Member Timed Out' },
    automod: { emoji: '🤖', color: Colors.PRIMARY, title: 'AutoMod Action' },
  };

  const config = actionConfig[action] || { emoji: '📋', color: Colors.INFO, title: action };

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setTitle(`${config.emoji} ${config.title}`)
    .addFields(
      { name: 'Target', value: target ? `${target.tag || target} (${target.id || target})` : 'Unknown', inline: true },
      { name: 'Moderator', value: moderator ? `${moderator.tag || moderator} (${moderator.id || moderator})` : 'System', inline: true },
      { name: 'Reason', value: reason || 'No reason provided' }
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  if (duration) embed.addFields({ name: 'Duration', value: duration, inline: true });

  await sendLog(guild, embed);
}

/**
 * Log a role change
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Role[]} added
 * @param {import('discord.js').Role[]} removed
 */
async function logRoleChange(member, added, removed) {
  const embed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle('🎭 Role Change')
    .addFields(
      { name: 'Member', value: `${member.user.tag} (${member.user.id})`, inline: true },
      ...(added.length ? [{ name: '✅ Added', value: added.map(r => r.name).join(', '), inline: true }] : []),
      ...(removed.length ? [{ name: '❌ Removed', value: removed.map(r => r.name).join(', '), inline: true }] : [])
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await sendLog(member.guild, embed);
}

module.exports = {
  sendLog,
  logMessageDelete,
  logMessageEdit,
  logMemberJoin,
  logMemberLeave,
  logModAction,
  logRoleChange,
};

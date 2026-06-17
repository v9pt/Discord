'use strict';

const { PermissionsBitField } = require('discord.js');

/**
 * Check if a member has administrator permission
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

/**
 * Check if a member is a moderator (has Manage Messages or higher)
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isMod(member) {
  return (
    member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator)
  );
}

/**
 * Check if bot has required permissions in a channel
 * @param {import('discord.js').GuildChannel} channel
 * @param {bigint[]} permissions
 * @returns {boolean}
 */
function botHasPermissions(channel, permissions) {
  const botMember = channel.guild.members.me;
  if (!botMember) return false;
  return channel.permissionsFor(botMember).has(permissions);
}

/**
 * Get permission overwrites for staff-only channels
 * @param {import('discord.js').Guild} guild
 * @param {Object} roles - role map { Admin, Moderator, 'Trial Moderator' }
 * @returns {Array}
 */
function staffOverwrites(guild, roles) {
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    ...(roles['Admin']
      ? [{ id: roles['Admin'].id, allow: [PermissionsBitField.Flags.ViewChannel] }]
      : []),
    ...(roles['Moderator']
      ? [{ id: roles['Moderator'].id, allow: [PermissionsBitField.Flags.ViewChannel] }]
      : []),
    ...(roles['Trial Moderator']
      ? [{ id: roles['Trial Moderator'].id, allow: [PermissionsBitField.Flags.ViewChannel] }]
      : []),
  ];
}

/**
 * Get permission overwrites for Girls Chat channels
 * @param {import('discord.js').Guild} guild
 * @param {Object} roles
 * @returns {Array}
 */
function girlsChatOverwrites(guild, roles) {
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    ...(roles['Girls Chat']
      ? [{ id: roles['Girls Chat'].id, allow: [PermissionsBitField.Flags.ViewChannel] }]
      : []),
  ];
}

/**
 * Get permission overwrites for read-only channels
 * @param {import('discord.js').Guild} guild
 * @returns {Array}
 */
function readOnlyOverwrites(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel],
      deny: [PermissionsBitField.Flags.SendMessages],
    },
  ];
}

module.exports = {
  isAdmin,
  isMod,
  botHasPermissions,
  staffOverwrites,
  girlsChatOverwrites,
  readOnlyOverwrites,
};

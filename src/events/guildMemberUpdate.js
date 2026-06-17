'use strict';

const { logRoleChange } = require('../systems/logging/logger');

module.exports = {
  name: 'guildMemberUpdate',
  once: false,

  /**
   * @param {import('discord.js').GuildMember} oldMember
   * @param {import('discord.js').GuildMember} newMember
   */
  async execute(oldMember, newMember) {
    try {
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      const added = [...newRoles.values()].filter((r) => !oldRoles.has(r.id) && r.name !== '@everyone');
      const removed = [...oldRoles.values()].filter((r) => !newRoles.has(r.id) && r.name !== '@everyone');

      if (added.length || removed.length) {
        await logRoleChange(newMember, added, removed);
      }
    } catch (err) {
      console.error('[guildMemberUpdate] Error:', err.message);
    }
  },
};

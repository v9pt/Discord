'use strict';

const { ChannelType } = require('discord.js');
const { processMessage } = require('../systems/automod/automodManager');
const { handleIncomingDM, handleThreadReply } = require('../systems/modmail/modmailManager');

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (message.author.bot) return;

    // ── DM → Modmail ──────────────────────────────────────────────────────────
    if (message.channel.type === ChannelType.DM) {
      return handleIncomingDM(message, client);
    }

    // ── Thread reply → Modmail relay ──────────────────────────────────────────
    if (message.channel.isThread()) {
      return handleThreadReply(message);
    }

    // ── AutoMod (guild messages only) ─────────────────────────────────────────
    if (message.guild) {
      await processMessage(message);
    }
  },
};

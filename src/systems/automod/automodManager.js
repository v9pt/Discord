'use strict';

const { EmbedBuilder } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');
const Warning = require('../../models/Warning');
const rateLimiter = require('../../utils/rateLimiter');
const { logModAction } = require('../logging/logger');

// Known scam domains
const SCAM_DOMAINS = [
  'discord-nitro.gift',
  'discordnitro.gift',
  'discordapp.gift',
  'free-nitro',
  'steamgift.com',
  'nitro-free',
  'claimnitro',
  'get-nitro',
  'steam-trade',
  'csgo-skins',
];

// Invite regex
const DISCORD_INVITE_RE = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/([a-zA-Z0-9-]+)/gi;
// General URL regex
const URL_RE = /https?:\/\/[^\s]+/gi;

/**
 * Add a warning to a user and return total count
 * @param {string} userId
 * @param {string} guildId
 * @param {string} reason
 * @param {string} moderatorId
 * @param {string} moderatorTag
 * @returns {Promise<number>} total active warnings
 */
async function addWarning(userId, guildId, reason, moderatorId = 'AutoMod', moderatorTag = 'AutoMod') {
  const doc = await Warning.findOneAndUpdate(
    { userId, guildId },
    {
      $push: {
        warnings: { reason, moderatorId, moderatorTag },
      },
      $inc: { totalWarnings: 1 },
    },
    { upsert: true, new: true }
  );
  return doc.warnings.filter((w) => w.active).length;
}

/**
 * Escalate punishment based on warning count
 * @param {import('discord.js').GuildMember} member
 * @param {number} warnCount
 * @param {string} reason
 * @param {import('discord.js').Guild} guild
 */
async function escalatePunishment(member, warnCount, reason, guild) {
  try {
    if (warnCount >= 5) {
      await member.ban({ reason: `AutoMod: ${reason} (${warnCount} warnings)`, deleteMessageSeconds: 86400 });
      await logModAction(guild, { action: 'ban', target: member.user, moderator: 'AutoMod', reason });
    } else if (warnCount >= 4) {
      await member.kick(`AutoMod: ${reason} (${warnCount} warnings)`);
      await logModAction(guild, { action: 'kick', target: member.user, moderator: 'AutoMod', reason });
    } else if (warnCount >= 3) {
      const duration = 60 * 60 * 1000; // 1 hour
      await member.timeout(duration, `AutoMod: ${reason}`);
      await logModAction(guild, { action: 'timeout', target: member.user, moderator: 'AutoMod', reason, duration: '1 hour' });
    } else if (warnCount >= 2) {
      const duration = 5 * 60 * 1000; // 5 min
      await member.timeout(duration, `AutoMod: ${reason}`);
      await logModAction(guild, { action: 'timeout', target: member.user, moderator: 'AutoMod', reason, duration: '5 minutes' });
    }
    // 1 warning = just the warning is enough
  } catch (err) {
    console.error('[AutoMod] Escalation error:', err.message);
  }
}

/**
 * Send a DM warning to a user
 */
async function sendWarningDM(member, reason, warnCount) {
  const embed = new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setTitle('⚠️ AutoMod Warning')
    .setDescription(
      [
        `You have been warned in **${member.guild.name}**.`,
        '',
        `**Reason:** ${reason}`,
        `**Warning count:** ${warnCount}`,
        '',
        warnCount >= 4
          ? '🔴 You are at risk of being **banned**. Please follow the rules.'
          : warnCount >= 3
          ? '🟠 Further violations will result in a **kick**.'
          : warnCount >= 2
          ? '🟡 Further violations will result in a **timeout**.'
          : '⚠️ Please follow our server rules.',
      ].join('\n')
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  await member.user.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Main automod handler for incoming messages
 * @param {import('discord.js').Message} message
 */
async function processMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (message.member?.permissions.has('ManageMessages')) return; // Skip mods

  try {
    const guildData = await Guild.findOne({ guildId: message.guild.id });
    if (!guildData?.automod?.enabled) return;

    const cfg = guildData.automod;
    const { member, guild, content, channel } = message;
    const userId = member.id;

    // ── Anti Spam ────────────────────────────────────────────────────────────
    if (cfg.antiSpam) {
      const spamKey = `spam:${guild.id}:${userId}`;
      if (rateLimiter.isRateLimited(spamKey, cfg.spamThreshold || 5, cfg.spamWindowMs || 5000)) {
        await message.delete().catch(() => {});
        const warnCount = await addWarning(userId, guild.id, 'Spam', 'AutoMod', 'AutoMod');
        await sendWarningDM(member, 'Spamming messages', warnCount);
        await escalatePunishment(member, warnCount, 'Spam', guild);
        await logModAction(guild, { action: 'automod', target: member.user, moderator: 'AutoMod', reason: 'Spam' });
        return;
      }
    }

    // ── Anti Scam Links ──────────────────────────────────────────────────────
    if (cfg.antiScam) {
      const lowerContent = content.toLowerCase();
      const isScam = SCAM_DOMAINS.some((d) => lowerContent.includes(d));
      if (isScam) {
        await message.delete().catch(() => {});
        const warnCount = await addWarning(userId, guild.id, 'Scam link', 'AutoMod', 'AutoMod');
        await sendWarningDM(member, 'Posting scam/phishing links', warnCount);
        await escalatePunishment(member, warnCount, 'Scam Link', guild);
        await logModAction(guild, { action: 'automod', target: member.user, moderator: 'AutoMod', reason: 'Scam Link' });

        // Alert in channel
        const alertMsg = await channel.send(`⚠️ ${member} — Suspicious link detected and removed.`);
        setTimeout(() => alertMsg.delete().catch(() => {}), 5000);
        return;
      }
    }

    // ── Anti Link (Discord invites) ──────────────────────────────────────────
    if (cfg.antiLink) {
      if (DISCORD_INVITE_RE.test(content)) {
        await message.delete().catch(() => {});
        const warnCount = await addWarning(userId, guild.id, 'Unauthorized invite', 'AutoMod', 'AutoMod');
        await sendWarningDM(member, 'Posting Discord invite links', warnCount);
        await escalatePunishment(member, warnCount, 'Invite Link', guild);
        return;
      }
    }

    // ── Mass Mention ─────────────────────────────────────────────────────────
    if (cfg.massMention) {
      const mentionCount =
        (content.match(/<@[!&]?\d+>/g) || []).length +
        (content.match(/@everyone|@here/g) || []).length;
      if (mentionCount >= (cfg.mentionLimit || 5)) {
        await message.delete().catch(() => {});
        const warnCount = await addWarning(userId, guild.id, 'Mass mention', 'AutoMod', 'AutoMod');
        await sendWarningDM(member, `Mass mentioning (${mentionCount} mentions)`, warnCount);
        await escalatePunishment(member, warnCount, 'Mass Mention', guild);
        return;
      }
    }

    // ── Excessive Caps ───────────────────────────────────────────────────────
    if (cfg.excessiveCaps && content.length > 10) {
      const letters = content.replace(/[^a-zA-Z]/g, '');
      const upperCase = content.replace(/[^A-Z]/g, '');
      if (letters.length > 0) {
        const capsPercent = (upperCase.length / letters.length) * 100;
        if (capsPercent >= (cfg.capsPercent || 70)) {
          await message.delete().catch(() => {});
          const alertMsg = await channel.send(`📢 ${member} — Please avoid excessive caps!`);
          setTimeout(() => alertMsg.delete().catch(() => {}), 4000);
          return;
        }
      }
    }
  } catch (err) {
    console.error('[AutoMod] Process error:', err.message);
  }
}

// Join timestamps for raid detection
const joinTimestamps = new Map();

/**
 * Check for raid pattern on member join
 * @param {import('discord.js').GuildMember} member
 */
async function checkRaid(member) {
  const { guild } = member;

  try {
    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData?.automod?.antiRaid) return;

    const cfg = guildData.automod;
    const key = guild.id;
    const now = Date.now();
    const window = cfg.raidWindowMs || 10000;
    const threshold = cfg.raidJoinThreshold || 10;

    const timestamps = (joinTimestamps.get(key) || []).filter((t) => now - t < window);
    timestamps.push(now);
    joinTimestamps.set(key, timestamps);

    if (timestamps.length >= threshold) {
      console.warn(`⚠️ [AutoMod] Raid detected in ${guild.name}! ${timestamps.length} joins in ${window}ms`);

      // Log to staff
      await logModAction(guild, {
        action: 'automod',
        target: 'Server',
        moderator: 'AutoMod',
        reason: `Raid detected: ${timestamps.length} joins in ${window / 1000}s`,
      });

      // Kick the new member if account is < 7 days old
      const accountAgeMs = now - member.user.createdTimestamp;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (accountAgeMs < sevenDays) {
        await member.kick('AutoMod: Potential raid — new account').catch(() => {});
      }
    }
  } catch (err) {
    console.error('[AutoMod] Raid check error:', err.message);
  }
}

module.exports = { processMessage, checkRaid, addWarning };

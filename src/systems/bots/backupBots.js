'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');

/**
 * Famous free backup bots with their invite links and descriptions
 */
const BACKUP_BOTS = [
  {
    name: '🛡️ Wick',
    description: '**Best anti-raid & server protection bot.**\nBlocks mass joins, channel nukes, mass bans, webhook attacks. Essential when your bot is offline.',
    features: ['Anti-raid', 'Anti-nuke', 'Anti-mass ban', 'Webhook protection'],
    color: '#7B2FBE',
    invite: 'https://wickbot.com/invite',
    website: 'https://wickbot.com',
    emoji: '🛡️',
    priority: '🔴 CRITICAL',
  },
  {
    name: '🤖 MEE6',
    description: '**The most popular Discord bot.**\nModeration, auto-roles, leveling system, welcome messages, and music. Replaces most features when offline.',
    features: ['Auto-moderation', 'Welcome messages', 'Leveling/XP', 'Auto-roles'],
    color: '#F04747',
    invite: 'https://mee6.xyz/add',
    website: 'https://mee6.xyz',
    emoji: '🤖',
    priority: '🟠 RECOMMENDED',
  },
  {
    name: '⚙️ Carl-bot',
    description: '**Powerful moderation & reaction roles.**\nBest for reaction roles, automod, logging, tags, and embeds. Great MEE6 alternative with no premium wall.',
    features: ['Reaction roles', 'Automod', 'Logging', 'Custom commands'],
    color: '#5865F2',
    invite: 'https://carl.gg/add',
    website: 'https://carl.gg',
    emoji: '⚙️',
    priority: '🟠 RECOMMENDED',
  },
  {
    name: '🌐 YAGPDB',
    description: '**Yet Another General Purpose Discord Bot.**\nAdvanced automod, custom commands, logging, role management. Extremely customizable and free.',
    features: ['Custom commands', 'Advanced automod', 'Role management', 'Statistics'],
    color: '#43B581',
    invite: 'https://yagpdb.xyz/manage',
    website: 'https://yagpdb.xyz',
    emoji: '🌐',
    priority: '🟡 OPTIONAL',
  },
  {
    name: '🎵 Dyno',
    description: '**Premium moderation and utility bot.**\nCustomizable automod, announcements, modlogs, and music. Solid backup for moderation.',
    features: ['Moderation', 'Announcements', 'Automod', 'Mod logs'],
    color: '#7289DA',
    invite: 'https://dyno.gg/invite',
    website: 'https://dyno.gg',
    emoji: '🎵',
    priority: '🟡 OPTIONAL',
  },
  {
    name: '📊 Statbot',
    description: '**Server statistics and analytics bot.**\nTracks message counts, member growth, channel activity, and voice time. Adds professional stat channels.',
    features: ['Member counters', 'Channel stats', 'Server analytics', 'Voice tracking'],
    color: '#00D26A',
    invite: 'https://statbot.net/invite',
    website: 'https://statbot.net',
    emoji: '📊',
    priority: '🟡 OPTIONAL',
  },
];

/**
 * Post the backup bots panel into a given channel
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').Guild} guild
 */
async function postBackupBotsPanel(channel, guild) {
  // ── Header embed ──────────────────────────────────────────────────────────
  const headerEmbed = new EmbedBuilder()
    .setColor('#FF4500')
    .setTitle('🤖 Server Protection — Backup Bots Dashboard')
    .setDescription(
      [
        '> **Why this channel exists:**',
        '> Our custom bot may go offline for maintenance or updates.',
        '> These bots keep your server safe and running 24/7.',
        '',
        '**Invite priority guide:**',
        '🔴 **CRITICAL** — Invite immediately. Server protection.',
        '🟠 **RECOMMENDED** — Invite for full feature coverage.',
        '🟡 **OPTIONAL** — Nice to have for extra functionality.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n')
    )
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `${guild.name} | Keep these bots invited at all times` })
    .setTimestamp();

  await channel.send({ embeds: [headerEmbed] });

  // ── Individual bot embeds ─────────────────────────────────────────────────
  for (const bot of BACKUP_BOTS) {
    const botEmbed = new EmbedBuilder()
      .setColor(bot.color)
      .setTitle(`${bot.emoji} ${bot.name}`)
      .setDescription(bot.description)
      .addFields(
        {
          name: '✨ Key Features',
          value: bot.features.map((f) => `• ${f}`).join('\n'),
          inline: true,
        },
        {
          name: '⚡ Priority',
          value: bot.priority,
          inline: true,
        }
      )
      .setFooter({ text: FOOTER_TEXT });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(`Invite ${bot.name.replace(/^[^\w]+/, '').trim()}`)
        .setStyle(ButtonStyle.Link)
        .setURL(bot.invite)
        .setEmoji('➕'),
      new ButtonBuilder()
        .setLabel('Website')
        .setStyle(ButtonStyle.Link)
        .setURL(bot.website)
        .setEmoji('🌐')
    );

    await channel.send({ embeds: [botEmbed], components: [row] });
  }

  // ── Footer / instructions embed ───────────────────────────────────────────
  const footerEmbed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('📋 Setup Instructions for Backup Bots')
    .setDescription(
      [
        '**After inviting each bot:**',
        '',
        '**Wick (Anti-Raid)** — Go to `wickbot.com/dashboard` → select server → enable Anti-Raid, Anti-Nuke modules.',
        '',
        '**MEE6** — Go to `mee6.xyz/dashboard` → enable Moderator, Welcome, and Auto-Role plugins.',
        '',
        '**Carl-bot** — Go to `carl.gg` → click Manage → enable Reaction Roles with your existing role IDs.',
        '',
        '**YAGPDB** — Go to `yagpdb.xyz/manage` → add server → configure Automod and Logging.',
        '',
        '**Dyno** — Go to `dyno.gg` → Dashboard → enable Automod and Announce plugins.',
        '',
        '**Statbot** — Invite and it auto-creates stat channels. Go to `statbot.net` to configure.',
        '',
        '> 💡 **Tip:** Wick is the most important one — it prevents server nukes even without any other bot.',
      ].join('\n')
    )
    .setFooter({ text: `${FOOTER_TEXT} | Updated by setup system` })
    .setTimestamp();

  await channel.send({ embeds: [footerEmbed] });
}

module.exports = { postBackupBotsPanel, BACKUP_BOTS };

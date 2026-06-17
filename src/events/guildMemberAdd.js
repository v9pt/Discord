'use strict';

const { EmbedBuilder } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../config/colors');
const { generateWelcomeCard } = require('../systems/welcome/welcomeCard');
const { logMemberJoin } = require('../systems/logging/logger');
const { checkRaid } = require('../systems/automod/automodManager');
const Guild = require('../models/Guild');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member, client) {
    const { guild } = member;

    try {
      // Automod raid check
      await checkRaid(member);

      const guildData = await Guild.findOne({ guildId: guild.id });
      if (!guildData) return;

      // Assign New Member role
      if (guildData.roles.newMember) {
        const newMemberRole = guild.roles.cache.get(guildData.roles.newMember);
        if (newMemberRole) {
          await member.roles.add(newMemberRole).catch(() => {});
        }
      }

      // Find welcome channel — use introductions or general-chat
      const welcomeChannelId = guildData.channels.introductions || guildData.channels.generalChat;
      const welcomeChannel = welcomeChannelId ? guild.channels.cache.get(welcomeChannelId) : null;

      if (welcomeChannel) {
        // Generate and send welcome card
        const card = await generateWelcomeCard(member, 'welcome');

        const embed = new EmbedBuilder()
          .setColor(Colors.PRIMARY)
          .setTitle(`👋 Welcome to ${guild.name}!`)
          .setDescription(
            [
              `Hey ${member}, welcome to **${guild.name}**! 🎉`,
              `You are member **#${guild.memberCount}** — we're glad you're here!`,
              '',
              '**🚀 Get started in 3 easy steps:**',
              `> **Step 1** — ✅ Verify yourself in <#${guildData.channels.verify || 'the verify channel'}>`,
              `> **Step 2** — 🎭 Pick your game roles in <#${guildData.channels.roleSelection || 'role-selection'}>`,
              `> **Step 3** — 📜 Read the rules in <#${guildData.channels.rules || 'rules'}>`,
              '',
              `> 📖 New here? Check <#${guildData.channels.gettingStarted || guildData.channels.rules || ''}> for a full guide!`,
              '',
              '> 🎫 Need help? Open a ticket or DM this bot for modmail.',
              '> 📨 **Check your DMs** — we sent you a private welcome message!',
            ].join('\n')
          )
          .setFooter({ text: FOOTER_TEXT })
          .setTimestamp();

        await welcomeChannel.send({ embeds: [embed], files: [card] });
      }

      // ── Send a private DM to the new member ──────────────────────────────
      const dmEmbed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle(`🎉 Welcome to ${guild.name}!`)
        .setDescription(
          [
            `Hey **${member.user.username}**! Thanks for joining **${guild.name}**! 👋`,
            '',
            '**Here\'s everything you need to know to get started:**',
            '',
            '**✅ Step 1 — Verify Yourself**',
            '> Go to the **#verify** channel and click the Verify button.',
            '> This unlocks all channels and gives you the Member role.',
            '',
            '**🎭 Step 2 — Pick Your Roles**',
            '> Go to **#role-selection** to choose:',
            '> • 🔪 **Killer Main** or 💚 **Survivor Main** (Dead By Daylight)',
            '> • 🤠 **Cowgirl** (Red Dead Redemption 2)',
            '> • 💕 **Girls Chat** (unlocks a private girls-only channel)',
            '',
            '**📜 Step 3 — Read the Rules**',
            '> Check **#rules** so you know what\'s allowed.',
            '> Breaking rules = Warn → Timeout → Kick → Ban.',
            '',
            '**👋 Step 4 — Introduce Yourself**',
            '> Say hi in **#introductions** and tell us a little about yourself!',
            '',
            '**🆘 Need Help?**',
            '> DM **this bot** at any time — it will relay your message to staff.',
            '> Or open a ticket in the **#🎫-tickets** channel.',
            '',
            `*See you in the server! — The ${guild.name} team 🎉*`,
          ].join('\n')
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: guild.name })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] }).catch(() => {
        // Member has DMs disabled — silently skip, no error
      });

      // Log the join
      await logMemberJoin(member);
    } catch (err) {
      console.error('[guildMemberAdd] Error:', err.message);
    }
  },
};

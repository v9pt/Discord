'use strict';

const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');
const ModmailModel = require('../../models/Modmail');

/**
 * Handle an incoming DM from a user (create or continue modmail thread)
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').Client} client
 */
async function handleIncomingDM(message, client) {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  try {
    // Find the guild this user is in that has the bot set up
    // We look for the first guild where the user is a member and setup is complete
    let targetGuild = null;
    let guildData = null;

    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(message.author.id).catch(() => null);
      if (!member) continue;

      const data = await Guild.findOne({ guildId: guild.id, setupComplete: true });
      if (data?.channels?.modmail) {
        targetGuild = guild;
        guildData = data;
        break;
      }
    }

    if (!targetGuild || !guildData) {
      await message.author.send('❌ No configured server found. Please contact server staff directly.');
      return;
    }

    const modmailChannelId = guildData.channels.modmail;
    const modmailChannel = targetGuild.channels.cache.get(modmailChannelId);
    if (!modmailChannel) return;

    // Find or create modmail session
    let session = await ModmailModel.findOne({
      userId: message.author.id,
      guildId: targetGuild.id,
      open: true,
    });

    if (!session) {
      // Create new thread in modmail channel
      const thread = await modmailChannel.threads.create({
        name: `📬 ${message.author.username} (${message.author.id})`,
        autoArchiveDuration: 10080, // 7 days
        type: ChannelType.PrivateThread,
        reason: `Modmail from ${message.author.tag}`,
      });

      session = await ModmailModel.create({
        userId: message.author.id,
        userTag: message.author.tag,
        guildId: targetGuild.id,
        threadId: thread.id,
        channelId: modmailChannel.id,
        open: true,
        messages: [],
      });

      // Send header embed in thread
      const openEmbed = new EmbedBuilder()
        .setColor(Colors.PRIMARY)
        .setTitle('📬 New Modmail')
        .setDescription(
          [
            `**User:** ${message.author.tag} (${message.author.id})`,
            `**User mention:** <@${message.author.id}>`,
            '',
            'Reply in this thread to respond to the user.',
            'Use `/modmail close` to close this session.',
          ].join('\n')
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: FOOTER_TEXT })
        .setTimestamp();

      await thread.send({ embeds: [openEmbed] });

      // Confirm to user
      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle('📬 Modmail Opened')
            .setDescription(
              `Your message has been sent to the staff of **${targetGuild.name}**.\nThey will reply to you here via DM.`
            )
            .setFooter({ text: FOOTER_TEXT })
            .setTimestamp(),
        ],
      });
    }

    // Forward message to thread
    const thread = modmailChannel.threads.cache.get(session.threadId)
      || await modmailChannel.threads.fetch(session.threadId).catch(() => null);

    if (!thread) return;

    const forwardEmbed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(message.content || '*No text content*')
      .setFooter({ text: '📩 User Message' })
      .setTimestamp();

    if (message.attachments.size) {
      const urls = [...message.attachments.values()].map((a) => a.url).join('\n');
      forwardEmbed.addFields({ name: '📎 Attachments', value: urls });
    }

    await thread.send({ embeds: [forwardEmbed] });

    // Save message to DB
    session.messages.push({
      fromStaff: false,
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content,
      attachments: [...message.attachments.values()].map((a) => a.url),
    });
    await session.save();
  } catch (err) {
    console.error('[Modmail] Incoming DM error:', err.message);
  }
}

/**
 * Handle a staff reply in the modmail thread
 * @param {import('discord.js').Message} message
 */
async function handleThreadReply(message) {
  if (message.author.bot) return;
  if (!message.channel.isThread()) return;

  try {
    const session = await ModmailModel.findOne({
      threadId: message.channel.id,
      open: true,
    });

    if (!session) return;

    const client = message.client;
    const user = await client.users.fetch(session.userId).catch(() => null);
    if (!user) return;

    const replyEmbed = new EmbedBuilder()
      .setColor(Colors.PRIMARY)
      .setAuthor({
        name: `Staff • ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(message.content || '*No text content*')
      .setFooter({ text: `Reply from ${message.guild?.name || 'Staff'}` })
      .setTimestamp();

    await user.send({ embeds: [replyEmbed] }).catch(() => {
      message.channel.send('⚠️ Could not DM the user. They may have DMs disabled.');
    });

    // Save to DB
    session.messages.push({
      fromStaff: true,
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content,
    });
    await session.save();
  } catch (err) {
    console.error('[Modmail] Thread reply error:', err.message);
  }
}

/**
 * Close a modmail session
 * @param {string} userId
 * @param {string} guildId
 * @param {string} closedBy
 */
async function closeModmail(userId, guildId, closedBy) {
  const session = await ModmailModel.findOneAndUpdate(
    { userId, guildId, open: true },
    { open: false, closedAt: new Date(), closedBy },
    { new: true }
  );
  return session;
}

module.exports = { handleIncomingDM, handleThreadReply, closeModmail };

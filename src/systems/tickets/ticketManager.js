'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');
const TicketModel = require('../../models/Ticket');

const TICKET_CATEGORIES = [
  {
    customId: 'ticket_support',
    label: '🎧 Support',
    style: ButtonStyle.Primary,
    category: 'support',
    description: 'Get help from our staff team',
    color: Colors.INFO,
  },
  {
    customId: 'ticket_report',
    label: '🚨 Report User',
    style: ButtonStyle.Danger,
    category: 'report',
    description: 'Report a member breaking rules',
    color: Colors.ERROR,
  },
  {
    customId: 'ticket_partnership',
    label: '🤝 Partnership',
    style: ButtonStyle.Success,
    category: 'partnership',
    description: 'Partner with our server',
    color: Colors.SUCCESS,
  },
  {
    customId: 'ticket_application',
    label: '📋 Staff Application',
    style: ButtonStyle.Secondary,
    category: 'application',
    description: 'Apply to join the staff team',
    color: Colors.PRIMARY,
  },
];

/**
 * Post the ticket panel in the given channel
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').Guild} guild
 */
async function postTicketPanel(channel, guild) {
  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('🎫 Support Tickets')
    .setDescription(
      [
        'Need help or want to get in touch with staff?',
        'Select a ticket type below and our team will assist you.',
        '',
        '**Ticket Types:**',
        '> 🎧 **Support** — General help and questions',
        '> 🚨 **Report User** — Report a member breaking rules',
        '> 🤝 **Partnership** — Partnership inquiries',
        '> 📋 **Staff Application** — Apply to become staff',
        '',
        '> ⚠️ *Do not abuse the ticket system.*',
      ].join('\n')
    )
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    ...TICKET_CATEGORIES.map((cat) =>
      new ButtonBuilder()
        .setCustomId(cat.customId)
        .setLabel(cat.label)
        .setStyle(cat.style)
    )
  );

  await channel.send({ embeds: [embed], components: [row] });
}

/**
 * Create a new ticket channel
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} categoryType
 */
async function createTicket(interaction, categoryType) {
  await interaction.deferReply({ ephemeral: true });

  const { guild, member } = interaction;

  try {
    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData) {
      return interaction.editReply('❌ Server not configured. Contact an admin.');
    }

    // Check for existing open ticket
    const existingTicket = await TicketModel.findOne({
      guildId: guild.id,
      userId: member.id,
      status: 'open',
    });

    if (existingTicket) {
      const existingCh = guild.channels.cache.get(existingTicket.channelId);
      if (existingCh) {
        return interaction.editReply(
          `❌ You already have an open ticket: <#${existingTicket.channelId}>`
        );
      }
    }

    // Increment ticket counter
    guildData.ticketCounter += 1;
    await guildData.save();

    const ticketNum = String(guildData.ticketCounter).padStart(4, '0');
    const ticketId = `ticket-${ticketNum}`;
    const catConfig = TICKET_CATEGORIES.find((c) => c.category === categoryType);

    // Get staff roles for overwrites
    const adminRoleId = guildData.roles.admin;
    const modRoleId = guildData.roles.moderator;

    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
        ],
      },
    ];

    if (adminRoleId) {
      permissionOverwrites.push({
        id: adminRoleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages,
        ],
      });
    }
    if (modRoleId) {
      permissionOverwrites.push({
        id: modRoleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages,
        ],
      });
    }

    // Create ticket channel
    const ticketChannel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: guildData.ticketCategoryId || null,
      topic: `Ticket by ${member.user.tag} | Type: ${categoryType} | ID: ${ticketId}`,
      permissionOverwrites,
    });

    // Save to DB
    await TicketModel.create({
      ticketId,
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: member.id,
      userTag: member.user.tag,
      category: categoryType,
      status: 'open',
    });

    // Send opening embed in ticket channel
    const openEmbed = new EmbedBuilder()
      .setColor(catConfig?.color || Colors.PRIMARY)
      .setTitle(`${catConfig?.label || '🎫 Ticket'} — ${ticketId.toUpperCase()}`)
      .setDescription(
        [
          `Hello ${member}, thank you for creating a ticket!`,
          '',
          `**Category:** ${catConfig?.label || categoryType}`,
          `**Opened by:** ${member.user.tag}`,
          '',
          'Please describe your issue in detail and a staff member will assist you shortly.',
          '',
          '> *Average response time: < 24 hours*',
        ].join('\n')
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('✋ Claim Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await ticketChannel.send({
      content: `${member} | <@&${adminRoleId || ''}> <@&${modRoleId || ''}>`,
      embeds: [openEmbed],
      components: [controlRow],
    });

    return interaction.editReply(
      `✅ Your ticket has been created: <#${ticketChannel.id}>`
    );
  } catch (err) {
    console.error('[Tickets] Create error:', err.message);
    return interaction.editReply('❌ Failed to create ticket. Please try again.');
  }
}

/**
 * Close a ticket (generate transcript, update status)
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function closeTicket(interaction) {
  await interaction.deferReply();

  const { guild, channel, member } = interaction;

  try {
    const ticket = await TicketModel.findOne({
      channelId: channel.id,
      guildId: guild.id,
      status: 'open',
    });

    if (!ticket) {
      return interaction.editReply('❌ This is not an active ticket.');
    }

    // Generate HTML transcript
    let transcriptAttachment = null;
    try {
      transcriptAttachment = await createTranscript(channel, {
        limit: -1,
        filename: `transcript-${ticket.ticketId}.html`,
        saveImages: false,
        poweredBy: false,
      });
    } catch (transcriptErr) {
      console.error('[Tickets] Transcript error:', transcriptErr.message);
    }

    // Update DB
    ticket.status = 'closed';
    ticket.closedBy = member.id;
    ticket.closedAt = new Date();
    await ticket.save();

    const closedEmbed = new EmbedBuilder()
      .setColor(Colors.WARNING)
      .setTitle('🔒 Ticket Closed')
      .setDescription(
        [
          `**Ticket:** ${ticket.ticketId}`,
          `**Opened by:** <@${ticket.userId}>`,
          `**Closed by:** ${member.user.tag}`,
          `**Category:** ${ticket.category}`,
        ].join('\n')
      )
      .setFooter({ text: FOOTER_TEXT })
      .setTimestamp();

    const deleteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('🗑️ Delete Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ embeds: [closedEmbed], components: [deleteRow] });

    // Send transcript to logs channel
    const guildData = await Guild.findOne({ guildId: guild.id });
    const logsChannelId = guildData?.channels?.logs;

    if (logsChannelId && transcriptAttachment) {
      const logsChannel = guild.channels.cache.get(logsChannelId);
      if (logsChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(Colors.INFO)
          .setTitle('📋 Ticket Transcript')
          .addFields(
            { name: 'Ticket ID', value: ticket.ticketId, inline: true },
            { name: 'User', value: `<@${ticket.userId}>`, inline: true },
            { name: 'Category', value: ticket.category, inline: true },
            { name: 'Closed By', value: member.user.tag, inline: true }
          )
          .setFooter({ text: FOOTER_TEXT })
          .setTimestamp();

        await logsChannel.send({ embeds: [logEmbed], files: [transcriptAttachment] });
      }
    }

    // Lock the channel for the user
    await channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false,
    }).catch(() => {});
  } catch (err) {
    console.error('[Tickets] Close error:', err.message);
    return interaction.editReply('❌ Failed to close ticket.');
  }
}

/**
 * Delete a ticket channel
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function deleteTicket(interaction) {
  const { guild, channel } = interaction;

  try {
    const ticket = await TicketModel.findOneAndUpdate(
      { channelId: channel.id, guildId: guild.id },
      { status: 'deleted' },
      { new: true }
    );

    if (!ticket) {
      await interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });
    }

    await interaction.reply({ content: '🗑️ Deleting ticket in 3 seconds...', ephemeral: true });
    await new Promise((r) => setTimeout(r, 3000));
    await channel.delete('Ticket deleted').catch(() => {});
  } catch (err) {
    console.error('[Tickets] Delete error:', err.message);
    await interaction.reply({ content: '❌ Failed to delete ticket.', ephemeral: true });
  }
}

/**
 * Claim a ticket
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function claimTicket(interaction) {
  const { guild, channel, member } = interaction;

  try {
    const ticket = await TicketModel.findOneAndUpdate(
      { channelId: channel.id, guildId: guild.id, status: 'open' },
      { claimedBy: member.id, claimedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return interaction.reply({ content: '❌ Ticket not found or not open.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(`✋ **${member.user.tag}** has claimed this ticket and will assist you.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Tickets] Claim error:', err.message);
    await interaction.reply({ content: '❌ Failed to claim ticket.', ephemeral: true });
  }
}

module.exports = {
  postTicketPanel,
  createTicket,
  closeTicket,
  deleteTicket,
  claimTicket,
  TICKET_CATEGORIES,
};

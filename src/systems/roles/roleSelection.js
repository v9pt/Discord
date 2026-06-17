'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../../config/colors');
const Guild = require('../../models/Guild');

const ROLE_BUTTONS = [
  {
    customId: 'role_survivor_main',
    label: '🟢 Survivor Main',
    style: ButtonStyle.Success,
    roleKey: 'survivorMain',
    description: 'You prefer playing as a Survivor',
  },
  {
    customId: 'role_killer_main',
    label: '🔴 Killer Main',
    style: ButtonStyle.Danger,
    roleKey: 'killerMain',
    description: 'You prefer playing as a Killer',
  },
  {
    customId: 'role_dbd_veteran',
    label: '💀 DBD Veteran',
    style: ButtonStyle.Secondary,
    roleKey: 'dbdVeteran',
    description: '1000+ hours in DBD',
  },
  {
    customId: 'role_cowgirl',
    label: '🤠 Cowgirl',
    style: ButtonStyle.Secondary,
    roleKey: 'cowgirl',
    description: 'RDR2 enthusiast',
  },
  {
    customId: 'role_girls_chat',
    label: '💕 Girls Chat',
    style: ButtonStyle.Primary,
    roleKey: 'girlsChat',
    description: 'Access the Girls Chat category',
  },
];

/**
 * Post the role selection panel
 * @param {import('discord.js').TextChannel} channel
 * @param {import('discord.js').Guild} guild
 */
async function postRoleSelectionPanel(channel, guild) {
  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle('🎭 Role Selection')
    .setDescription(
      [
        'Select your roles below! Clicking a button will **toggle** the role on or off.',
        '',
        '**Available Roles:**',
        '> 🟢 **Survivor Main** — You prefer playing as a Survivor in DBD',
        '> 🔴 **Killer Main** — You prefer playing as a Killer in DBD',
        '> 💀 **DBD Veteran** — 1000+ hours in Dead By Daylight',
        '> 🤠 **Cowgirl** — Red Dead Redemption 2 enthusiast',
        '> 💕 **Girls Chat** — Unlock the Girls Chat category',
        '',
        '*You can select multiple roles. Click again to remove.*',
      ].join('\n')
    )
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();

  // Split into two rows (max 5 per row)
  const row1 = new ActionRowBuilder().addComponents(
    ...ROLE_BUTTONS.slice(0, 5).map((btn) =>
      new ButtonBuilder()
        .setCustomId(btn.customId)
        .setLabel(btn.label)
        .setStyle(btn.style)
    )
  );

  await channel.send({ embeds: [embed], components: [row1] });
}

/**
 * Handle a role selection button interaction
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} customId
 */
async function handleRoleButton(interaction, customId) {
  try {
    const { member, guild } = interaction;

    const btnConfig = ROLE_BUTTONS.find((b) => b.customId === customId);
    if (!btnConfig) return;

    const guildData = await Guild.findOne({ guildId: guild.id });
    if (!guildData) {
      return interaction.reply({
        content: '❌ Server is not set up. Please contact an admin.',
        ephemeral: true,
      });
    }

    const roleId = guildData.roles[btnConfig.roleKey];
    if (!roleId) {
      return interaction.reply({
        content: `❌ The **${btnConfig.label}** role has not been configured yet.`,
        ephemeral: true,
      });
    }

    const role = guild.roles.cache.get(roleId);
    if (!role) {
      return interaction.reply({
        content: `❌ Role not found. Please contact an admin.`,
        ephemeral: true,
      });
    }

    const hasRole = member.roles.cache.has(roleId);

    if (hasRole) {
      await member.roles.remove(role);
      await interaction.reply({
        content: `❌ Removed the **${role.name}** role.`,
        ephemeral: true,
      });
    } else {
      await member.roles.add(role);
      await interaction.reply({
        content: `✅ Added the **${role.name}** role!`,
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error('[RoleSelection] Error:', err.message);
    await interaction.reply({
      content: '❌ An error occurred. Please try again.',
      ephemeral: true,
    });
  }
}

module.exports = {
  postRoleSelectionPanel,
  handleRoleButton,
  ROLE_BUTTONS,
};

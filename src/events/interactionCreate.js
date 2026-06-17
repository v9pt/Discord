'use strict';

const { errorEmbed } = require('../utils/embedBuilder');
const { handleVerifyButton, handleRulesButton } = require('../systems/verification/verificationPanel');
const { handleRoleButton, ROLE_BUTTONS } = require('../systems/roles/roleSelection');
const {
  createTicket,
  closeTicket,
  deleteTicket,
  claimTicket,
  TICKET_CATEGORIES,
} = require('../systems/tickets/ticketManager');

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {
    // ── Slash Commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Unknown Command', `Command \`/${interaction.commandName}\` not found.`)],
          ephemeral: true,
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName}:`, err.message);
        const errorMsg = {
          embeds: [errorEmbed('❌ Command Error', 'An error occurred while executing this command.')],
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg).catch(() => {});
        } else {
          await interaction.reply(errorMsg).catch(() => {});
        }
      }
      return;
    }

    // ── Button Interactions ───────────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Verification
      if (id === 'verify_button') return handleVerifyButton(interaction);
      if (id === 'verify_rules') return handleRulesButton(interaction);

      // Role selection
      const roleBtn = ROLE_BUTTONS.find((b) => b.customId === id);
      if (roleBtn) return handleRoleButton(interaction, id);

      // Ticket creation
      const ticketCat = TICKET_CATEGORIES.find((c) => c.customId === id);
      if (ticketCat) return createTicket(interaction, ticketCat.category);

      // Ticket controls
      if (id === 'ticket_close') return closeTicket(interaction);
      if (id === 'ticket_delete') return deleteTicket(interaction);
      if (id === 'ticket_claim') return claimTicket(interaction);

      // Unhandled button
      console.warn(`[Buttons] Unhandled button: ${id}`);
    }
  },
};

'use strict';

const { logMessageDelete } = require('../systems/logging/logger');

module.exports = {
  name: 'messageDelete',
  once: false,

  async execute(message) {
    if (!message.guild || message.partial) return;
    await logMessageDelete(message);
  },
};

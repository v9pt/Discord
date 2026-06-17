'use strict';

const { logMessageEdit } = require('../systems/logging/logger');

module.exports = {
  name: 'messageUpdate',
  once: false,

  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.partial) return;
    await logMessageEdit(oldMessage, newMessage);
  },
};

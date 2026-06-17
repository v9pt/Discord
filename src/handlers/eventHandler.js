'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load all event handlers from the events/ directory
 * @param {import('discord.js').Client} client
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  for (const file of eventFiles) {
    try {
      const event = require(path.join(eventsPath, file));

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      console.log(`[Events] Loaded: ${event.name}`);
    } catch (err) {
      console.error(`[Events] Failed to load ${file}:`, err.message);
    }
  }
}

module.exports = { loadEvents };

'use strict';

const { EmbedBuilder } = require('discord.js');
const { Colors, FOOTER_TEXT } = require('../config/colors');

/**
 * Create a standardized embed with consistent branding
 * @param {Object} options
 * @param {string} options.title
 * @param {string} [options.description]
 * @param {'primary'|'success'|'error'|'warning'|'info'|'gold'} [options.type]
 * @param {Array<{name:string,value:string,inline?:boolean}>} [options.fields]
 * @param {string} [options.thumbnail]
 * @param {string} [options.image]
 * @param {string} [options.footer]
 * @param {boolean} [options.timestamp]
 * @returns {EmbedBuilder}
 */
function createEmbed({
  title,
  description,
  type = 'primary',
  fields = [],
  thumbnail,
  image,
  footer = FOOTER_TEXT,
  timestamp = true,
}) {
  const colorMap = {
    primary: Colors.PRIMARY,
    success: Colors.SUCCESS,
    error: Colors.ERROR,
    warning: Colors.WARNING,
    info: Colors.INFO,
    gold: Colors.GOLD,
  };

  const embed = new EmbedBuilder()
    .setColor(colorMap[type] || Colors.PRIMARY)
    .setTitle(title);

  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (footer) embed.setFooter({ text: footer });
  if (timestamp) embed.setTimestamp();

  return embed;
}

/**
 * Create a success embed
 */
function successEmbed(title, description) {
  return createEmbed({ title, description, type: 'success' });
}

/**
 * Create an error embed
 */
function errorEmbed(title, description) {
  return createEmbed({ title, description, type: 'error' });
}

/**
 * Create a warning embed
 */
function warningEmbed(title, description) {
  return createEmbed({ title, description, type: 'warning' });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed };

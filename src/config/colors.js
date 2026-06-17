'use strict';

/**
 * Brand color palette for embeds and canvas
 */
const Colors = {
  PRIMARY: 0x9B59B6,      // Purple - main brand color
  SUCCESS: 0x2ECC71,      // Green
  ERROR: 0xE74C3C,        // Red
  WARNING: 0xF39C12,      // Orange
  INFO: 0x3498DB,         // Blue
  DARK: 0x2C2F33,         // Dark background
  GOLD: 0xF1C40F,         // Gold for boosters
  MUTED: 0x4E4E50,        // Muted grey

  // Canvas hex strings
  canvas: {
    BACKGROUND: '#1a1a2e',
    ACCENT: '#9B59B6',
    ACCENT_LIGHT: '#C39BD3',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#B0B0B0',
    BORDER: '#9B59B6',
    OVERLAY: 'rgba(155, 89, 182, 0.3)',
  },
};

const FOOTER_TEXT = '⚡ Community Bot • Built with ❤️';
const BOT_VERSION = '1.0.0';

module.exports = { Colors, FOOTER_TEXT, BOT_VERSION };

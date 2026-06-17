'use strict';

const { Schema, model } = require('mongoose');

const AutomodConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    antiSpam: { type: Boolean, default: true },
    antiRaid: { type: Boolean, default: true },
    antiLink: { type: Boolean, default: true },
    antiScam: { type: Boolean, default: true },
    massMention: { type: Boolean, default: true },
    excessiveCaps: { type: Boolean, default: true },
    spamThreshold: { type: Number, default: 5 },      // messages in window
    spamWindowMs: { type: Number, default: 5000 },     // 5 seconds
    mentionLimit: { type: Number, default: 5 },
    capsPercent: { type: Number, default: 70 },
    raidJoinThreshold: { type: Number, default: 10 },  // joins in window
    raidWindowMs: { type: Number, default: 10000 },
    allowedLinks: { type: [String], default: [] },
    logChannelId: { type: String, default: null },
  },
  { _id: false }
);

const ChannelMapSchema = new Schema(
  {
    rules: String,
    announcements: String,
    events: String,
    faq: String,
    verify: String,
    roleSelection: String,
    introductions: String,
    dbdChat: String,
    rdrChat: String,
    generalChat: String,
    girlsChat: String,
    ventAndSupport: String,
    instagramShares: String,
    youtubeContent: String,
    generalVc: String,
    staffChat: String,
    applications: String,
    reports: String,
    logs: String,
    modmail: String,
    welcome: String,
    tickets: String,
  },
  { _id: false }
);

const RoleMapSchema = new Schema(
  {
    owner: String,
    admin: String,
    moderator: String,
    trialModerator: String,
    dbdVeteran: String,
    survivorMain: String,
    killerMain: String,
    cowgirl: String,
    girlsChat: String,
    booster: String,
    verified: String,
    member: String,
    newMember: String,
  },
  { _id: false }
);

const GuildSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    setupComplete: { type: Boolean, default: false },
    setupAt: { type: Date, default: null },
    channels: { type: ChannelMapSchema, default: () => ({}) },
    roles: { type: RoleMapSchema, default: () => ({}) },
    automod: { type: AutomodConfigSchema, default: () => ({}) },
    ticketCategoryId: { type: String, default: null },
    ticketCounter: { type: Number, default: 0 },
    prefix: { type: String, default: '!' },
  },
  { timestamps: true }
);

module.exports = model('Guild', GuildSchema);

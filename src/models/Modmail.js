'use strict';

const { Schema, model } = require('mongoose');

const ModmailMessageSchema = new Schema(
  {
    fromStaff: { type: Boolean, required: true },
    authorId: { type: String, required: true },
    authorTag: { type: String, required: true },
    content: { type: String, default: '' },
    attachments: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ModmailSchema = new Schema(
  {
    userId: { type: String, required: true },
    userTag: { type: String },
    guildId: { type: String, required: true },
    threadId: { type: String, default: null },
    channelId: { type: String, default: null },
    open: { type: Boolean, default: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
    messages: { type: [ModmailMessageSchema], default: [] },
  },
  { timestamps: true }
);

ModmailSchema.index({ userId: 1, guildId: 1, open: 1 });

module.exports = model('Modmail', ModmailSchema);

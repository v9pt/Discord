'use strict';

const { Schema, model } = require('mongoose');

const TicketMessageSchema = new Schema(
  {
    authorId: { type: String, required: true },
    authorTag: { type: String, required: true },
    content: { type: String, default: '' },
    attachments: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    userTag: { type: String, required: true },
    category: {
      type: String,
      enum: ['support', 'report', 'partnership', 'application'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'deleted'],
      default: 'open',
    },
    claimedBy: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    transcriptUrl: { type: String, default: null },
    messages: { type: [TicketMessageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model('Ticket', TicketSchema);

'use strict';

const { Schema, model } = require('mongoose');

const WarnEntrySchema = new Schema(
  {
    reason: { type: String, required: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const WarningSchema = new Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    userTag: { type: String },
    warnings: { type: [WarnEntrySchema], default: [] },
    totalWarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WarningSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = model('Warning', WarningSchema);

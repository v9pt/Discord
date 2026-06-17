'use strict';

const { Schema, model } = require('mongoose');

const VerificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: 'button' },
    ipHash: { type: String, default: null },
  },
  { timestamps: true }
);

VerificationSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = model('Verification', VerificationSchema);

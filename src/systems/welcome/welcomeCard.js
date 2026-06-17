'use strict';

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

/**
 * Draw a rounded rectangle path
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw a circle clip for avatars
 */
function circleClip(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
}

/**
 * Generate a welcome card image
 * @param {import('discord.js').GuildMember} member
 * @param {'welcome'|'goodbye'} type
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateWelcomeCard(member, type = 'welcome') {
  const canvas = createCanvas(900, 280);
  const ctx = canvas.getContext('2d');

  const isWelcome = type === 'welcome';
  const guild = member.guild;

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 280);
  bgGrad.addColorStop(0, '#0f0c29');
  bgGrad.addColorStop(0.5, '#1a1a2e');
  bgGrad.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, 900, 280, 20);
  ctx.fill();

  // ── Decorative accent strip ───────────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(0, 0, 900, 0);
  accentGrad.addColorStop(0, isWelcome ? '#9B59B6' : '#E74C3C');
  accentGrad.addColorStop(1, isWelcome ? '#3498DB' : '#E67E22');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, 900, 5);

  // ── Subtle grid overlay ───────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(155, 89, 182, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 900; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 280);
    ctx.stroke();
  }
  for (let i = 0; i < 280; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(900, i);
    ctx.stroke();
  }

  // ── Card panel ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundRect(ctx, 20, 20, 860, 240, 14);
  ctx.fill();

  // ── Avatar border glow ────────────────────────────────────────────────────
  const avatarX = 110;
  const avatarY = 140;
  const avatarR = 75;

  ctx.save();
  ctx.shadowColor = isWelcome ? '#9B59B6' : '#E74C3C';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 4, 0, Math.PI * 2);
  ctx.fillStyle = isWelcome ? '#9B59B6' : '#E74C3C';
  ctx.fill();
  ctx.restore();

  // ── Avatar ────────────────────────────────────────────────────────────────
  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    ctx.save();
    circleClip(ctx, avatarX, avatarY, avatarR);
    ctx.drawImage(avatar, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  } catch {
    // Fallback gradient if avatar fails to load
    ctx.save();
    const fallback = ctx.createRadialGradient(avatarX, avatarY, 0, avatarX, avatarY, avatarR);
    fallback.addColorStop(0, '#9B59B6');
    fallback.addColorStop(1, '#3498DB');
    ctx.fillStyle = fallback;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Server icon (small) ───────────────────────────────────────────────────
  try {
    const iconURL = guild.iconURL({ extension: 'png', size: 64 });
    if (iconURL) {
      const icon = await loadImage(iconURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + 55, avatarY + 55, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
      circleClip(ctx, avatarX + 55, avatarY + 55, 18);
      ctx.drawImage(icon, avatarX + 37, avatarY + 37, 36, 36);
      ctx.restore();
    }
  } catch { /* skip */ }

  // ── Title text ────────────────────────────────────────────────────────────
  const titleText = isWelcome ? 'WELCOME TO THE SERVER!' : 'GOODBYE, FRIEND!';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = isWelcome ? '#C39BD3' : '#F0B27A';
  ctx.letterSpacing = '3px';
  ctx.fillText(titleText, 230, 80);

  // ── Username ──────────────────────────────────────────────────────────────
  const displayName = member.user.username.slice(0, 22);
  ctx.font = 'bold 42px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.letterSpacing = '0px';
  ctx.fillText(displayName, 230, 135);

  // ── Discriminator / tag ───────────────────────────────────────────────────
  const tag = member.user.discriminator !== '0' ? `#${member.user.discriminator}` : '';
  if (tag) {
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#B0B0B0';
    ctx.fillText(tag, 230 + ctx.measureText(displayName).width + 4, 135);
  }

  // ── Subtitle line ─────────────────────────────────────────────────────────
  const subtitle = isWelcome
    ? `You are member #${guild.memberCount} of ${guild.name}`
    : `We'll miss you in ${guild.name}`;

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#9B9B9B';
  ctx.fillText(subtitle, 230, 170);

  // ── Separator line ────────────────────────────────────────────────────────
  const lineGrad = ctx.createLinearGradient(230, 0, 850, 0);
  lineGrad.addColorStop(0, isWelcome ? '#9B59B6' : '#E74C3C');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(230, 185);
  ctx.lineTo(860, 185);
  ctx.stroke();

  // ── Instructions ─────────────────────────────────────────────────────────
  if (isWelcome) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#7F8C8D';
    ctx.fillText('Head to #verify to gain full access • Check #rules • Grab roles in #role-selection', 230, 215);
  } else {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#7F8C8D';
    ctx.fillText(`Joined: ${member.joinedAt?.toLocaleDateString() || 'Unknown'}`, 230, 215);
  }

  // ── Bottom accent ─────────────────────────────────────────────────────────
  const bottomGrad = ctx.createLinearGradient(0, 275, 900, 280);
  bottomGrad.addColorStop(0, isWelcome ? '#9B59B6' : '#E74C3C');
  bottomGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 275, 900, 5);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, {
    name: isWelcome ? 'welcome.png' : 'goodbye.png',
  });
}

module.exports = { generateWelcomeCard };

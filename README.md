# 🤖 Discord Community Setup Bot

> Production-ready Discord bot that builds an entire server structure, roles, permissions, and systems from a single `/setup` command.

---

## ✨ Features

| System | Description |
|---|---|
| 🏗️ **Server Setup** | Creates all categories, channels, and roles from JSON template |
| ✅ **Verification** | Button-based verification panel with role assignment |
| 🎭 **Role Selection** | Toggle-based role selection panel (persists across restarts) |
| 🎫 **Ticket System** | Ticket Tool-style tickets with transcripts |
| 📬 **Modmail** | DM relay system with thread-based staff replies |
| 🤖 **AutoMod** | Spam, raid, link, scam, mention, and caps detection |
| 📋 **Logging** | Full audit logging for messages, members, and mod actions |
| 🎨 **Welcome Cards** | Canvas-based welcome/goodbye image cards |
| 🛡️ **Moderation** | Ban, kick, warn, timeout slash commands |

---

## 🚀 Quick Start

### 1. Discord Developer Portal Setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it → click **Create**
3. Go to **Bot** tab → click **Add Bot** → confirm
4. Copy the **Token** (store it securely)
5. Under **Privileged Gateway Intents**, enable:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
   - ✅ **Presence Intent**
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot` + `applications.commands`
   - Bot Permissions: `Administrator`
7. Copy the generated URL, open it in your browser, and invite the bot to your server
8. Copy the **Application ID** (your `CLIENT_ID`)

### 2. Installation

```bash
# Clone or download the project
cd Discord

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configure .env

```env
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
MONGODB_URI=mongodb://localhost:27017/communitybot
```

### 4. Deploy Commands

```bash
node deploy.js
```

> ⏰ Global commands take up to 1 hour to appear. For instant dev updates, see [Guild Deployment](#guild-deployment) below.

### 5. Start the Bot

```bash
npm start
```

### 6. Run Setup

In your Discord server, run:
```
/setup
```

That's it! The bot will build the entire server in 1-2 minutes.

---

## 🗂️ Project Structure

```
src/
├── commands/
│   ├── admin/          # ban, kick, warn, timeout
│   ├── community/      # ping
│   └── setup/          # /setup (main command)
├── events/             # Discord event handlers
├── handlers/           # Command, event, error loaders
├── database/           # MongoDB connection
├── models/             # Mongoose schemas
├── systems/
│   ├── tickets/        # Ticket Tool-style ticket system
│   ├── automod/        # Anti-spam, anti-raid, link filter
│   ├── welcome/        # Canvas welcome/goodbye cards
│   ├── verification/   # Button verification panel
│   ├── roles/          # Role selection panel
│   ├── logging/        # Audit log embeds
│   └── modmail/        # DM relay system
├── utils/              # Embed builder, permissions, rate limiter
└── config/             # Brand colors

templates/
└── dbd-community.json  # Server template (add more without code changes!)
```

---

## 📬 Modmail

Users can DM the bot to open a modmail session:
- DM creates a private thread in the `#modmail` staff channel
- Staff reply in the thread → message relayed back to user
- Full history stored in MongoDB
- Use `/modmail close` to end a session

---

## 🎫 Ticket System

Four ticket categories:
- 🎧 **Support** — General help
- 🚨 **Report User** — Report a member
- 🤝 **Partnership** — Server partnerships
- 📋 **Staff Application** — Join the team

Features:
- Claim tickets (assign to staff member)
- Close ticket → generates HTML transcript → sent to logs
- Delete ticket channel

---

## 🤖 AutoMod

Automatically enforces rules:

| Rule | Threshold |
|---|---|
| Anti-Spam | 5 messages / 5 seconds |
| Anti-Raid | 10 joins / 10 seconds |
| Anti-Invite | Blocks Discord invite links |
| Anti-Scam | Blocks known scam domains |
| Mass Mention | Max 5 mentions per message |
| Excessive Caps | 70%+ caps in 10+ char messages |

**Escalation:** 1 warn → 2 warns (5min timeout) → 3 warns (1h timeout) → 4 warns (kick) → 5 warns (ban)

---

## 🗃️ MongoDB Schemas

| Model | Purpose |
|---|---|
| `Guild` | Server settings, channel/role IDs, automod config |
| `Ticket` | Ticket lifecycle, messages, transcripts |
| `Warning` | Per-user warning history |
| `Modmail` | DM session history |
| `Verification` | User verification state |

---

## 🖥️ VPS Deployment (Ubuntu/Debian)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Install PM2
npm install -g pm2

# Clone and setup project
git clone <your-repo> /opt/community-bot
cd /opt/community-bot
npm install
cp .env.example .env
nano .env  # Fill in your values

# Deploy commands
node deploy.js

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🐳 Docker Deployment

```bash
# Fill in .env first
cp .env.example .env
nano .env

# Start everything
docker-compose up -d

# Deploy commands
docker exec community-bot node deploy.js

# View logs
docker-compose logs -f bot
```

---

## 🔧 Guild Deployment (Development)

For instant command updates during development, set `GUILD_ID` in your `.env` and create `deploy-guild.js`:

```javascript
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

// ... (same as deploy.js but use Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID))
```

---

## 📁 Adding Custom Server Templates

Create a new JSON file in `templates/`:

```json
{
  "name": "My Custom Server",
  "roles": [...],
  "categories": [...]
}
```

The template engine reads the JSON structure automatically. See `templates/dbd-community.json` for the full schema.

---

## 🔐 Required Bot Permissions

- Administrator (for full setup)
- Or minimum: Manage Channels, Manage Roles, Send Messages, Embed Links, Attach Files, Read Message History, Manage Messages, Kick Members, Ban Members, Moderate Members

---

## 📝 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TOKEN` | ✅ | Discord bot token |
| `CLIENT_ID` | ✅ | Discord application ID |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `GUILD_ID` | ❌ | For guild-specific command deployment |
| `NODE_ENV` | ❌ | `production` or `development` |

---

## 🛠️ Commands

| Command | Permission | Description |
|---|---|---|
| `/setup` | Administrator | Build entire server structure |
| `/ban` | Ban Members | Ban a member |
| `/kick` | Kick Members | Kick a member |
| `/warn add` | Moderate Members | Warn a member |
| `/warn list` | Moderate Members | View member warnings |
| `/warn clear` | Moderate Members | Clear member warnings |
| `/timeout` | Moderate Members | Timeout a member |
| `/ping` | Everyone | Check bot latency |

---

## 📄 License

ISC — Free to use and modify.

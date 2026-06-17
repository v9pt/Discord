require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
    console.log(`${client.user.tag} ready`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "setup") {
        const guild = interaction.guild;

        await interaction.reply({
            content: "Building server...",
            ephemeral: true
        });

        // ROLES
        const roles = {};

        const roleNames = [
            "Owner",
            "Admin",
            "Moderator",
            "DBD Veteran",
            "Survivor Main",
            "Killer Main",
            "Cowgirl",
            "Girls Chat",
            "Member",
            "New Member"
        ];

        for (const name of roleNames) {
            roles[name] =
                guild.roles.cache.find(r => r.name === name) ||
                await guild.roles.create({ name });
        }

        // CATEGORIES

        const welcome = await guild.channels.create({
            name: "WELCOME",
            type: ChannelType.GuildCategory
        });

        const dbd = await guild.channels.create({
            name: "DEAD BY DAYLIGHT",
            type: ChannelType.GuildCategory
        });

        const rdr = await guild.channels.create({
            name: "RED DEAD REDEMPTION",
            type: ChannelType.GuildCategory
        });

        const community = await guild.channels.create({
            name: "COMMUNITY",
            type: ChannelType.GuildCategory
        });

        const girls = await guild.channels.create({
            name: "GIRLS CHAT",
            type: ChannelType.GuildCategory
        });

        const social = await guild.channels.create({
            name: "SOCIAL MEDIA",
            type: ChannelType.GuildCategory
        });

        const staff = await guild.channels.create({
            name: "STAFF",
            type: ChannelType.GuildCategory
        });

        // WELCOME CHANNELS

        await guild.channels.create({
            name: "rules",
            type: ChannelType.GuildText,
            parent: welcome.id
        });

        await guild.channels.create({
            name: "announcements",
            type: ChannelType.GuildText,
            parent: welcome.id
        });

        await guild.channels.create({
            name: "introductions",
            type: ChannelType.GuildText,
            parent: welcome.id
        });

        await guild.channels.create({
            name: "role-selection",
            type: ChannelType.GuildText,
            parent: welcome.id
        });

        // DBD

        for (const ch of [
            "dbd-chat",
            "clips-and-screenshots",
            "tips-and-builds",
            "memes"
        ]) {
            await guild.channels.create({
                name: ch,
                type: ChannelType.GuildText,
                parent: dbd.id
            });
        }

        // RDR

        for (const ch of [
            "rdr-chat",
            "rdr-screenshots"
        ]) {
            await guild.channels.create({
                name: ch,
                type: ChannelType.GuildText,
                parent: rdr.id
            });
        }

        // COMMUNITY

        for (const ch of [
            "general-chat",
            "off-topic",
            "media-and-art"
        ]) {
            await guild.channels.create({
                name: ch,
                type: ChannelType.GuildText,
                parent: community.id
            });
        }

        // GIRLS

        await guild.channels.create({
            name: "girls-chat",
            type: ChannelType.GuildText,
            parent: girls.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: roles["Girls Chat"].id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });

        await guild.channels.create({
            name: "vent-and-support",
            type: ChannelType.GuildText,
            parent: girls.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: roles["Girls Chat"].id,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });

        // SOCIAL

        for (const ch of [
            "instagram-shares",
            "youtube-content"
        ]) {
            await guild.channels.create({
                name: ch,
                type: ChannelType.GuildText,
                parent: social.id
            });
        }

        // STAFF

        for (const ch of [
            "bot-commands",
            "modmail-inbox",
            "mod-chat",
            "logs"
        ]) {
            await guild.channels.create({
                name: ch,
                type: ChannelType.GuildText,
                parent: staff.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: roles["Admin"].id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: roles["Moderator"].id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });
        }

        await interaction.editReply("✅ Server setup complete.");
    }
});

client.login(process.env.TOKEN);
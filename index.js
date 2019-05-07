// Import the required modules
const Discord = require('discord.js');
const Http = require('http');

// Import configuration file
const config = require('./config.json');

// Create an instance of a Discord bot.
const bot = new Discord.Client();

const supportChannelWelcomeMessage = "Welcome to Hysummit Community Support! React with the appropriate emoji to create a support ticket to meet your needs.\n\n:white_check_mark: Server Help & Support\n\n:hammer: Request a Ban Appeal"
const supportChanngelWelcomeFooter = "Thank you for your patience."

bot.on('ready', () => {
    console.log('Manager Bot is ready for action!');

    const supportChannel = bot.channels.get(config.channels.support);
    
    supportChannel.fetchMessages({ limit: 1 }).then(messages => {
        let lastMessage = messages.first();
        if (!lastMessage || !lastMessage.author.bot) {
            const embeddedMessage = new Discord.RichEmbed()
                .setDescription(supportChannelWelcomeMessage)
                .setFooter(supportChanngelWelcomeFooter);

            supportChannel.send(embeddedMessage)
                .then(sentEmbeddedMessage => {
                    sentEmbeddedMessage.react("✅");
                    sentEmbeddedMessage.react("🔨");
                }).catch(console.error);
            console.log("Sending support welcome message.");
        }

        bot.on('messageReactionAdd', (reaction, user) => {
            if (!user.bot) {
                reaction.remove(user);
                const message = reaction.message;
                if (message.author.bot && message.embeds[0].description == supportChannelWelcomeMessage) {
                    if (reaction.emoji.name == "✅") {
                        createHelpChannel(message.guild, user);
                    } else if (reaction.emoji.name == "🔨") {
                        createBanAppealChannel(message.guild, user);
                    }
                }
            }
        });

    }).catch(console.error);
});

bot.login(config.token);

function createHelpChannel(guild, user) {
    const categoryName = config.categories.support;
    checkExistingCategory(categoryName, guild);
    const supportChannelName = "support-ticket-" + user.username.toLowerCase();
    const existingSupportChannel = guild.channels.find(c => c.type == "text" && c.name == supportChannelName);
    if (!existingSupportChannel) {
        createChannel(guild, supportChannelName)
        .then(channel => {
            checkExistingCategory(config.categories.support, guild);
            const roleEveryone = guild.roles.find(r => r.name == '@everyone');
            const roleBots = guild.roles.find(r => r.name == 'Bot');
            const roleSupportStaff = guild.roles.find(r => r.name == config.supportRole);

            const supportCategory = guild.channels.find(c => c.name == categoryName && c.type == "category");
            channel.setParent(supportCategory.id);
            channel.overwritePermissions(roleBots.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(roleSupportStaff.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(user.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(roleEveryone, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false,
                ATTACH_FILES: false,
                CREATE_INSTANT_INVITE: false
            });

            const description = "Support ticket created! Someone from our staff will be right with you. Feel free to mention any relevant details that we'll need to know to help you."
            const embeddedMessage = new Discord.RichEmbed()
                .setDescription(description)
                .setFooter("Ticket created by: " + user.username);
            channel.send(embeddedMessage);
        }).catch(console.error);
    }
}

function createBanAppealChannel(guild, user) {
    const categoryName = config.categories.appeal;
    checkExistingCategory(categoryName, guild);
    const supportChannelName = "ban-appeal-" + user.username.toLowerCase();
    const existingSupportChannel = guild.channels.find(c => c.type == "text" && c.name == supportChannelName);
    if (!existingSupportChannel) {
        createChannel(guild, supportChannelName)
        .then(channel => {
            checkExistingCategory(config.categories.appeal, guild);
            const roleEveryone = guild.roles.find(r => r.name == '@everyone');
            const roleBots = guild.roles.find(r => r.name == 'Bot');
            const roleSupportStaff = guild.roles.find(r => r.name == config.supportRole);

            const supportCategory = guild.channels.find(c => c.name == categoryName && c.type == "category");
            channel.setParent(supportCategory.id);
            channel.overwritePermissions(roleBots.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(roleSupportStaff.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(user.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(roleEveryone, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false,
                ATTACH_FILES: false,
                CREATE_INSTANT_INVITE: false
            });

            const description = "Ban Appeal ticket created! Someone from our staff will be right with you. Feel free to mention any relevant details that we'll need to know to help you."
            const embeddedMessage = new Discord.RichEmbed()
                .setDescription(description)
                .setFooter("Ticket created by: " + user.username);
            channel.send(embeddedMessage);
        }).catch(console.error);
    }
}

function checkExistingCategory(categoryName, guild) {
    const supportCategory = guild.channels.find(c => c.name == categoryName && c.type == "category");
    if (!supportCategory) {
        throw new Error("'" + categoryName + "' category does not exist!");
    }
}

function createChannel(guild, channelName) {
    console.log("Creating channel: " + channelName);
    return guild.createChannel(channelName);
}

function createChannelWithPermissions(guild, channelName, permitAllRoles) {

}

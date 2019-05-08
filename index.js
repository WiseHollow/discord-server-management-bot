// Import the required modules
const Discord = require('discord.js');
const Http = require('http');

// Import configuration file
const config = require('./config.json');

// Json Object of all ticket types
const ticketTypes = config.ticketTypes;

// Create an instance of a Discord bot.
const bot = new Discord.Client();

var welcomeMessageId = -1;

bot.on('ready', () => {
    validateConfiguration();
    validateSupportChannel();
    registerReactionEvents();
    console.log('Manager Bot is ready for action!')
});

bot.login(config.token);

function validateSupportChannel() {
    const channel = getSupportChannel();

    // Send welcome message if one isn't already on channel.
    channel.fetchMessages({ limit: 1 }).then(messages => {
        const lastMessage = messages.first();
        if (!lastMessage || !lastMessage.author.bot) {
            sendSupportWelcomeMessage();
        } else {
            welcomeMessageId = lastMessage.id;
        }
    }).catch(console.error);

    // Don't allow persistent user reactions on welcome message.
    bot.on('messageReactionAdd', (reaction, user) => {
        const message = reaction.message;
        if (!user.bot && message.id == welcomeMessageId) {
            reaction.remove(user);
        }
    });
}

function validateConfiguration() {
    if (getSupportChannel() == null) {
        throw new Error("Could not locate Support Channel with ID: " + config.supportChannelId);
    }
}

function getSupportChannel() {
    return bot.channels.get(config.supportChannelId);
}

function sendSupportWelcomeMessage() {
    const supportChannel = bot.channels.get(config.supportChannelId);
    var welcomeMessage = config.welcomeMessageContents + "\n\n";
    Object.keys(ticketTypes).forEach(ticketType => {
        const section = ticketTypes[ticketType];
        welcomeMessage = welcomeMessage + section.reaction + " " + section.reactionDescription + "\n\n";
    });

    const embeddedMessage = new Discord.RichEmbed()
        .setDescription(welcomeMessage)
        .setFooter(config.welcomeMessageFooter);
    supportChannel.send(embeddedMessage)
        .then(sentMessage => {
            welcomeMessageId = sentMessage.id
            Object.keys(ticketTypes).forEach(ticketType => {
                const section = ticketTypes[ticketType];
                sentMessage.react(section.reaction);
            });
        }).catch(console.error);
    console.log("Sent welcome message to support channel!");
}

function registerReactionEvents() {
    Object.keys(ticketTypes).forEach(ticketType => {
        bot.on('messageReactionAdd', (reaction, user) => {
            const message = reaction.message;

            // If user is reacting to our support welcome message.
            if (!user.bot && message.id == welcomeMessageId) {
                const section = ticketTypes[ticketType];

                if (reaction.emoji.name == section.reaction) {
                    createChannelForTicketType(message.guild, section, user);
                }
            }
        });
    });
}

function sendCreatedTicketQuote(createdChannel, user) {
    const supportChannel = getSupportChannel();

    const seconds = config.supportTicketCreatedNoticeLifetime / 1000;
    const messageBody = config.supportTicketCreatedBody.replace("%channel%", "<#" + createdChannel.id + ">").replace("%user%", "<@" + user.id + ">");
    const messageFooter = config.supportTicketCreatedFooter.replace("%seconds%", seconds);

    const embeddedMessage = new Discord.RichEmbed()
        .setDescription(messageBody)
        .setFooter(messageFooter);
    
    supportChannel.send(embeddedMessage).then(message => {
        setTimeout(function() {
            message.delete();
        }, config.supportTicketCreatedNoticeLifetime);
    })
}

function createChannelForTicketType(guild, ticketType, user) {
    const channelName = ticketType.title.replace("%username%", user.username).toLowerCase();
    const messageBody = ticketType.messageBody.replace("%username%", user.username);
    const messageFooter = ticketType.messageFooter.replace("%username%", user.username);
    const parent = guild.channels.get(ticketType.parent);

    const channelAlreadyExists = guild.channels.find(c => c.type == "text" && c.name == channelName) != null;
    if (!channelAlreadyExists) {
        console.log("Creating ticket for " + user.username + " (" + user.id + ")");

        const roleEveryone = guild.roles.find(r => r.name == '@everyone');
        const rolePermitAll = guild.roles.find(r => r.name == ticketType.permitAll);

        const embeddedMessage = new Discord.RichEmbed()
            .setDescription(messageBody)
            .setFooter(messageFooter);
        
        guild.createChannel(channelName).then(channel => {
            channel.overwritePermissions(roleEveryone, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false,
                ATTACH_FILES: false,
                CREATE_INSTANT_INVITE: false
            });
            channel.overwritePermissions(user.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });
            channel.overwritePermissions(rolePermitAll.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                ATTACH_FILES: true
            });

            channel.setParent(parent.id);
            channel.send(embeddedMessage);

            sendCreatedTicketQuote(channel, user);
        }).catch(console.error);
    }
}

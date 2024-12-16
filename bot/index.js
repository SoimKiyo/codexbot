const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const licenseApi = require('./features/licenses/licenseApi');

// Import features
const { registerCommands, handleInteraction } = require('./features/licenses/licenseCommands');
const verifyNewMembers = require('./features/verification/verifyNewMembers');
const handleVerificationButton = require('./features/verification/handleVerificationButton');
const createSuggestionEmbed = require('./features/suggestions/createSuggestionEmbed');
const handleSuggestionVotes = require('./features/suggestions/handleSuggestionVotes');
const createBugReportEmbed = require('./features/bugReports/createBugReportEmbed');
const handleBugReportStatus = require('./features/bugReports/handleBugReportStatus');
const licenseMenu = require('./features/licenses/licenseMenu');

// Create a new Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

// Ready event
client.once('ready', () => {
  console.log(`${client.user.tag} is now ONLINE`);
  registerCommands(config.CLIENT_ID, config.GUILD_ID);
});

// Event for new members
client.on('guildMemberAdd', async (member) => {
  await verifyNewMembers(member);
});

// Event for slash commands and interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    try {
      await handleInteraction(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'verify') {
      await handleVerificationButton.handleInteraction(interaction);
    } else if (interaction.customId.startsWith('license_')) {
      await licenseMenu.handleLicenseConfirmation(interaction);
    } else {
      await interaction.reply({ content: 'Unrecognized option.', ephemeral: true });
    }
  }

  if (interaction.isStringSelectMenu()) {
    try {
      if (interaction.customId === 'license_select') {
        await licenseMenu.handleSelectMenu(interaction);
      } else {
        await interaction.reply({ content: 'Unrecognized select menu.', ephemeral: true });
      }
    } catch (error) {
      console.error('Error handling select menu:', error);
      await interaction.reply({ content: 'An error occurred while handling the select menu.', ephemeral: true });
    }
  }
});

// Event for message reactions
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  // Handle suggestions reactions
  if (config.SUGGESTIONS_CHANNEL_IDS.includes(reaction.message.channel.id)) {
    await handleSuggestionVotes(client, reaction, user);
  }

  // Handle bug report reactions
  if (config.BUG_REPORTS_CHANNEL_IDS.includes(reaction.message.channel.id)) {
    await handleBugReportStatus(client, reaction, user);
  }
});

// Bot login
client.login(config.TOKEN)
  .catch(err => console.error('Login error:', err));

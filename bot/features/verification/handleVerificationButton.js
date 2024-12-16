const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createEmbed, sendErrorMessage } = require('../utils');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifymessage')
    .setDescription('Send a verification message to the channel.'),
  
  async execute(interaction) {
    // Check if the user has admin permissions
    const hasAdminRole = interaction.member.roles.cache.some(role => config.ADMIN_ROLE_IDS.includes(role.id));

    if (!hasAdminRole) {
      const embed = createEmbed(
        'Permission Denied',
        'You do not have permission to use this command.',
        '#FF0000'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      // Create the verification button
      const verifyButton = new ButtonBuilder()
        .setCustomId('verify')
        .setLabel('Verify')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder()
        .addComponents(verifyButton);

      const embed = createEmbed(
        'Verification',
        'Click the button below to verify yourself:',
        '#5865F2'
      );

      await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({ content: 'Verification message sent.', ephemeral: true });
    } catch (error) {
      console.error('Error sending verification message:', error);
      await sendErrorMessage(
        interaction.channel,
        'An error occurred while sending the verification message.'
      );
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'verify') {
      const member = interaction.member;

      try {
        // Remove unverified roles and add member roles
        await member.roles.remove(config.UNVERIFIED_ROLE_IDS);
        await member.roles.add(config.MEMBER_ROLE_IDS);

        const embed = createEmbed(
          'Verification Success',
          'You have been successfully verified and now have full access to the server!',
          '#00FF00'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Error during verification:', error);
        const embed = createEmbed(
          'Verification Error',
          'An error occurred while verifying. Please contact an administrator.',
          '#FF0000'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      const embed = createEmbed(
        'Unknown Option',
        'Unrecognized option.',
        '#FF0000'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

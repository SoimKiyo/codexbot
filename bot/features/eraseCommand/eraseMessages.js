const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('erase')
    .setDescription('Erase a specified number of messages in the current channel.')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const numMessages = interaction.options.getInteger('amount');

    // Check permissions: user must have "Manage Messages" permission
    if (!interaction.member.permissions.has('ManageMessages')) {
      return await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Validate the number of messages
    if (numMessages <= 0 || numMessages > 100) {
      return await interaction.reply({
        content: 'Please provide a number between 1 and 100.',
        ephemeral: true,
      });
    }

    try {
      // Fetch messages from the channel
      const fetchedMessages = await interaction.channel.messages.fetch({ limit: numMessages });

      // Filter out pinned messages and messages older than 14 days
      const messagesToDelete = fetchedMessages.filter(
        msg => !msg.pinned && (Date.now() - msg.createdTimestamp) < 1209600000
      );

      if (messagesToDelete.size === 0) {
        return await interaction.reply({
          content: 'No messages to delete or all messages are older than 14 days.',
          ephemeral: true,
        });
      }

      // Bulk delete messages
      await interaction.channel.bulkDelete(messagesToDelete, true);

      // Reply to confirm deletion
      await interaction.reply({
        content: `Successfully deleted ${messagesToDelete.size} messages.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.reply({
        content: 'An error occurred while trying to delete messages. Ensure I have the necessary permissions.',
        ephemeral: true,
      });
    }
  },
};

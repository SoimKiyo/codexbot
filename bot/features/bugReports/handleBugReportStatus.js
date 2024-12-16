const { BUG_REPORTS_CHANNEL_IDS, BUG_EMOJI_SOLVED, BUG_EMOJI_REJECTED, BUG_EMOJI_PENDING } = require('../../config');
const { createEmbed } = require('../utils');

module.exports = async (client, reaction, user) => {
  if (user.bot) return; // Ignore bot reactions

  // Ensure the reaction is in a bug report channel
  if (!BUG_REPORTS_CHANNEL_IDS.includes(reaction.message.channel.id)) return;

  // Check if the reaction emoji is valid for bug status
  if ([BUG_EMOJI_SOLVED, BUG_EMOJI_REJECTED, BUG_EMOJI_PENDING].includes(reaction.emoji.name)) {
    try {
      // Define statuses and their corresponding colors and labels
      const statusMap = {
        [BUG_EMOJI_SOLVED]: { color: '#00FF00', text: 'Solved' }, // Green
        [BUG_EMOJI_REJECTED]: { color: '#FF0000', text: 'Rejected' }, // Red
        [BUG_EMOJI_PENDING]: { color: '#808080', text: 'Pending' }, // Gray
      };

      // Get the existing embed and parse its description
      const existingEmbed = reaction.message.embeds[0];
      if (!existingEmbed) {
        console.error('No existing embed found on the message.');
        return;
      }

      const description = existingEmbed.description.split('\n\nStatus:')[0];
      const footerText = existingEmbed.footer?.text || '';

      // Update the embed with the new status
      const updatedEmbed = createEmbed(
        'Bug Report',
        description,
        statusMap[reaction.emoji.name].color,
        footerText
      ).setDescription(`${description}\n\nStatus: ${statusMap[reaction.emoji.name].text}`);

      // Edit the message with the updated embed
      await reaction.message.edit({ embeds: [updatedEmbed] });
    } catch (error) {
      console.error('Error updating bug report status:', error);
    }
  }
};

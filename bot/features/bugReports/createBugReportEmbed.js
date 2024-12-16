const { BUG_REPORTS_CHANNEL_IDS, BUG_EMOJI_SOLVED, BUG_EMOJI_REJECTED, BUG_EMOJI_PENDING } = require('../../config');
const { createEmbed } = require('../utils');

module.exports = async (client, bugMessage) => {
  try {
    // Iterate over all bug report channels
    for (const channelId of BUG_REPORTS_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId);

      if (!channel) {
        console.error(`Bug report channel with ID ${channelId} not found.`);
        continue;
      }

      // Create an embed for the bug report
      const embed = createEmbed(
        'New Bug Report',
        bugMessage.content,
        '#924a4a',
        `Reported by ${bugMessage.author.tag}`
      );

      // Send the embed to the channel
      const sentMessage = await channel.send({ embeds: [embed] });

      // Add reaction emojis for bug status
      await sentMessage.react(BUG_EMOJI_SOLVED);
      await sentMessage.react(BUG_EMOJI_REJECTED);
      await sentMessage.react(BUG_EMOJI_PENDING);
    }
  } catch (error) {
    console.error('Error creating a bug report embed:', error);
  }
};

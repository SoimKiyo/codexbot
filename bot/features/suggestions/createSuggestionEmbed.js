const { SUGGESTIONS_CHANNEL_IDS, VOTE_EMOJI_YES, VOTE_EMOJI_NO } = require('../../config');
const { createEmbed } = require('../utils');

module.exports = async (client, suggestionMessage) => {
  try {
    // Iterate through all suggestion channels
    for (const channelId of SUGGESTIONS_CHANNEL_IDS) {
      const channel = await client.channels.fetch(channelId);

      if (!channel) {
        console.error(`Suggestion channel with ID ${channelId} not found.`);
        continue;
      }

      // Create the suggestion embed
      const embed = createEmbed(
        'New Suggestion',
        suggestionMessage.content,
        '#5865F2',
        `Suggested by ${suggestionMessage.author.tag}`
      );

      // Send the embed and add reaction emojis
      const sentMessage = await channel.send({ embeds: [embed] });
      await sentMessage.react(VOTE_EMOJI_YES);
      await sentMessage.react(VOTE_EMOJI_NO);
    }
  } catch (error) {
    console.error('Error creating suggestion embed:', error);
  }
};

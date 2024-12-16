const { SUGGESTIONS_CHANNEL_IDS, VOTE_EMOJI_YES, VOTE_EMOJI_NO } = require('../../config');
const { createEmbed } = require('../utils');

module.exports = async (client, reaction, user) => {
  if (user.bot) return; // Ignore bot reactions

  // Ensure the reaction is in a suggestion channel
  if (!SUGGESTIONS_CHANNEL_IDS.includes(reaction.message.channel.id)) return;

  // Check if the reaction emoji is valid for voting
  if ([VOTE_EMOJI_YES, VOTE_EMOJI_NO].includes(reaction.emoji.name)) {
    try {
      // Retrieve current vote counts
      const votes = {
        [VOTE_EMOJI_YES]: reaction.message.reactions.cache.get(VOTE_EMOJI_YES)?.count - 1 || 0,
        [VOTE_EMOJI_NO]: reaction.message.reactions.cache.get(VOTE_EMOJI_NO)?.count - 1 || 0,
      };

      // Extract existing embed information
      const existingEmbed = reaction.message.embeds[0];
      if (!existingEmbed) {
        console.error('No embed found on the suggestion message.');
        return;
      }

      const description = existingEmbed.description;
      const footerText = existingEmbed.footer?.text || '';

      // Create an updated embed with the new vote counts
      const updatedEmbed = createEmbed(
        'Suggestion Update',
        description,
        '#5865F2',
        footerText
      ).addFields(
        { name: '👍 Yes Votes', value: `${votes[VOTE_EMOJI_YES]}`, inline: true },
        { name: '👎 No Votes', value: `${votes[VOTE_EMOJI_NO]}`, inline: true }
      );

      // Edit the message with the updated embed
      await reaction.message.edit({ embeds: [updatedEmbed] });
    } catch (error) {
      console.error('Error updating suggestion votes:', error);
    }
  }
};

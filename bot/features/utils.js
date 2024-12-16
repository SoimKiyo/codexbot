const { EmbedBuilder } = require('discord.js');

/**
 * Crée un embed simple avec un titre et une description.
 * @param {string} title - Le titre de l'embed.
 * @param {string} description - La description de l'embed.
 * @param {string} [color='#0000FF'] - La couleur de l'embed (en hexadécimal).
 * @param {string} [footer] - Le texte du footer de l'embed.
 * @returns {EmbedBuilder} - L'objet EmbedBuilder.
 */
function createEmbed(title, description, color = '#0000FF', footer = '') {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    // Ajoute le footer seulement s'il est fourni
    if (footer) {
        embed.setFooter({ text: footer });
    }

    return embed;
}

/**
 * Récupère un membre par son ID.
 * @param {Object} client - L'objet client Discord.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<GuildMember>} - Le membre Discord.
 */
async function getMemberById(client, userId) {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      throw new Error('Aucun serveur trouvé');
    }
    return await guild.members.fetch(userId);
  } catch (error) {
    console.error('Error fetching member:', error);
    throw error; // Rejette l'erreur pour que l'appelant puisse la gérer
  }
}

/**
 * Envoie un message d'erreur dans un canal.
 * @param {Object} channel - Le canal où envoyer le message d'erreur.
 * @param {string} errorMessage - Le message d'erreur à envoyer.
 */
async function sendErrorMessage(channel, errorMessage) {
  const embed = createEmbed('Erreur', errorMessage, '#FF0000'); // Utilise la couleur hexadécimale pour le rouge
  await channel.send({ embeds: [embed] });
}

module.exports = {
  createEmbed,
  getMemberById,
  sendErrorMessage,
};

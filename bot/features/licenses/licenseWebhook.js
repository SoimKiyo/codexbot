const axios = require('axios');
const config = require('../../config');

// Fonction pour créer un embed avec les informations utilisateur
function createEmbed(title, licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, problemDetails = '') {
    return {
        embeds: [{
            title: title,
            description: `**License Key:**\n\`\`\`${licenseKey}\`\`\`\n\n` +
                         `- License Information:\n` +
                         `\`🆔\` **Product Name:** \`${productName}\`\n` +
                         `\`🔩\` **Product Version:** \`${productVersion}\`\n` +
                         `\`⌛\` **Total Requests:** \`${totalRequests}\`\n\n` +
                         `- Hardware Information:\n` +
                         `\`🔎\` **IP:** \`${ip}\`\n` +
                         `\`💾\` **HWID:** \`${hwid}\`\n\n` +
                         `- User Information:\n` +
                         `\`🗣️\` **User:** <@${userId}>\n` +
                         `\`🆔\` **User ID:** \`${userId}\`\n\n` +
                         (problemDetails ? `- Problem Details:\n\`\`\`🛠️ ${problemDetails}\`\`\`` : ''),
            footer: { text: new Date().toISOString() }
        }]
    };
}

// Fonction pour envoyer un message via webhook
async function sendWebhook(url, title, licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag, problemDetails = '') {
    try {
        const embed = createEmbed(title, licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag, problemDetails = '');
        await axios.post(url, embed);
    } catch (error) {
        console.error(`Error sending webhook to ${url}:`, error.message);
    }
}

// Fonction pour gérer une connexion réussie
async function handleSuccess(licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag) {
    await sendWebhook(config.SUCCESS_WEBHOOK_URL, '✅ AUTHORIZED LOGIN', licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag);
}

// Fonction pour gérer une connexion échouée
async function handleFailure(licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag, problemDetails) {
    await sendWebhook(config.FAILURE_WEBHOOK_URL, '❌ UNAUTHORIZED LOGIN', licenseKey, productName, productVersion, totalRequests, ip, hwid, userId, userTag, problemDetails);
}

module.exports = {
    handleSuccess,
    handleFailure
};

module.exports = {
  TOKEN: 'YOUR_BOT_TOKEN', // Replace with your bot token
  CLIENT_ID: 'YOUR_CLIENT_ID', // Replace with your bot client ID
  GUILD_ID: 'YOUR_GUILD_ID', // Replace with your guild ID
  ADMIN_ROLE_IDS: ['ADMIN_ROLE_ID'], // Replace with admin role IDs
  MONGODB: 'mongodb://127.0.0.1:27017/YourDatabase', // Replace with your MongoDB connection string
  APISRVURL : 'http://127.0.0.1', // Replace with your API server URL
  APISRVPORT : '5000', // Replace with your API server Port

  // Antibot verification
  UNVERIFIED_ROLE_IDS: ['UNVERIFIED_ROLE_ID'], // Replace with unverified role IDs
  MEMBER_ROLE_IDS: ['MEMBER_ROLE_ID'], // Replace with member role IDs

  // Suggestions system
  SUGGESTIONS_CHANNEL_IDS: ['SUGGESTIONS_CHANNEL_ID'], // Replace with suggestion channel IDs
  VOTE_EMOJI_YES: '👍',
  VOTE_EMOJI_NO: '👎',

  // Bug report system
  BUG_REPORTS_CHANNEL_IDS: ['BUG_REPORTS_CHANNEL_ID'], // Replace with bug report channel IDs
  BUG_EMOJI_SOLVED: '✅',
  BUG_EMOJI_REJECTED: '❌',
  BUG_EMOJI_PENDING: '🔧',

  // Webhooks for license notifications
  SUCCESS_WEBHOOK_URL: 'YOUR_SUCCESS_WEBHOOK_URL', // Replace with success webhook URL
  FAILURE_WEBHOOK_URL: 'YOUR_FAILURE_WEBHOOK_URL', // Replace with failure webhook URL
};

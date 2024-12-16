const config = require('../../config');

module.exports = async (member) => {
  try {
    // Assign unverified roles to new members
    await member.roles.add(config.UNVERIFIED_ROLE_IDS);
    console.log(`Unverified roles assigned to ${member.user.tag}`);
  } catch (error) {
    console.error(`Error assigning unverified roles to ${member.user.tag}:`, error);
  }
};

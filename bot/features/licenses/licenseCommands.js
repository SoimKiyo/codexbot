const axios = require('axios');
const config = require('../../config');
const { createEmbed } = require('../utils');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const mongoose = require('mongoose');

// API URL
const API_URL = `${config.APISRVURL}:${config.APISRVPORT}`;

// Defining commands
const commands = [
  {
    name: 'product',
    description: 'Product management',
    options: [
      {
        type: 1, // Subcommand group
        name: 'create',
        description: 'Create a product',
        options: [
          { type: 3, name: 'name', description: 'Product Name', required: true },
          { type: 3, name: 'version', description: 'Product version', required: true },
          { type: 4, name: 'maxlicenses', description: 'Maximum number of licenses', required: true },
          { type: 3, name: 'role', description: 'Role required for the product', required: true }
        ]
      },
      {
        type: 1, // Subcommand group
        name: 'delete',
        description: 'Delete a product',
        options: [
          { type: 3, name: 'id', description: 'Product ID', required: true }
        ]
      }
    ]
  },
  {
    name: 'license',
    description: 'License Management',
    options: [
      {
        type: 1, // Subcommand group
        name: 'create',
        description: 'Create a license',
        options: [
          { type: 3, name: 'product', description: 'Product ID', required: true },
          { type: 3, name: 'duration', description: 'Duration of the license', required: true },
          { type: 6, name: 'user', description: 'User for license', required: true }
        ]
      },
      {
        type: 1, // Subcommand group
        name: 'delete',
        description: 'Delete a license',
        options: [
          { type: 3, name: 'id', description: 'License ID', required: true }
        ]
      }     
    ]
  },
  {
    name: 'licenses',
    description: 'List licenses for the user',
    options: [
        {
            type: 4, // Integer
            name: 'page',
            description: 'Page to display',
            required: false
        }
    ]
  },
  {
    name: 'blacklist',
    description: 'Blacklist management',
    options: [
      {
        type: 1, // Subcommand group
        name: 'add',
        description: 'Add to blacklist',
        options: [
          { type: 6, name: 'user', description: 'User to add', required: true },
          { type: 3, name: 'type', description: 'Blacklist type (HWID/IP)', required: true }
        ]
      },
      {
        type: 1, // Subcommand group
        name: 'delete',
        description: 'Remove from blacklist',
        options: [
          { type: 3, name: 'id', description: 'Blacklist ID', required: true }
        ]
      }
    ]
  },
  {
    name: 'info',
    description: 'Retrieve user information',
    options: [
      {
        type: 6, // User
        name: 'user',
        description: 'User to search',
        required: true
      },
      {
        type: 3, // String
        name: 'type',
        description: 'Type of information to search for (blacklist/licenses)',
        required: true,
        choices: [
          { name: 'Licenses', value: 'licenses' },
          { name: 'Blacklist', value: 'blacklist' }
        ]
      },
      {
        type: 4, // Integer
        name: 'page',
        description: 'Page to display',
        required: false
      }
    ]
  }  
];

// Function to register commands with the Discord API
const registerCommands = async (clientId, guildId) => {
    const rest = new REST({ version: '10' }).setToken(config.TOKEN);
  
    try {
      console.log('Deploying slash commands...');
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log('Commands deployed successfully.');
    } catch (error) {
      console.error('Error deploying commands:', error);
    }
  };


  function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // Check if user is an administrator
    function isAdmin(member) {
        return config.ADMIN_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    }

// Function to manage command interactions
const handleInteraction = async (interaction) => {
    if (!interaction.isCommand()) return;
  
    const { commandName, options, member } = interaction;
  
    // Check administrator permissions for certain commands
    const isCommandAdminOnly = !['licenses'].includes(commandName);

    // Check if the command is restricted to administrators and if the user is not an administrator
    if (isCommandAdminOnly && !isAdmin(member)) {
        return interaction.reply({
            embeds: [createEmbed(
                'Error',
                'You do not have permission to execute this command.',
                '#FA2A3D'
            )],
            ephemeral: true
        });
    }

    if (commandName === 'product') {
      const subcommand = options.getSubcommand();
  
      if (subcommand === 'create') {
        const name = options.getString('name');
        const version = options.getString('version');
        const maxLicenses = options.getInteger('maxlicenses');
        const role = options.getString('role');
        const creatorId = interaction.user.id;
      
        if (!name || !version || !maxLicenses || !role) {
          await interaction.reply({ embeds: [createEmbed('Error', 'All fields are required to create a product.', '#FA2A3D')] });
          return;
        }
      
        try {
          // Product creation
          const responseProduct = await axios.post(`${API_URL}/api/product/create`, { name, version, maxLicenses, role, creatorId });
          const product = responseProduct.data;

          // Success response
          await interaction.reply({
            embeds: [createEmbed(
              '📦 Product Created',
              `**Product Name:**\n\`\`\`${product.name}\`\`\`\n` +
              `- **Product Informations:**\n` +
              `\`🆔\` **Product ID:** \`${product._id}\`\n` +
              `\`🔩\` **Product Version:** \`${product.version}\`\n` +
              `\`⏲️\` **Created At:** \`${new Date(product.createdAt).toLocaleDateString()}\`\n` +
              `- **Product Created By:**\n` +
              `\`👤\` **User:** <@${product.creatorId}>\n` +
              `\`🆔\` **User Id:** \`${product.creatorId}\`\n`,
              '#36FF7F'
            )]
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({ embeds: [createEmbed('Error', `Error creating the product. ${error.message}`, '#FA2A3D')] });
        }
      } else if (subcommand === 'delete') {
        const id = options.getString('id');
        
        // Check the validity of the ObjectiveIf
        if (!isValidObjectId(id)) {
          await interaction.reply({ embeds: [createEmbed('Error', 'Invalid product ID.', '#FA2A3D')] });
          return;
        }
        
        try {
          // Check the validity of the ObjectiveIf
          const response = await axios.get(`${API_URL}/api/product/${id}`);
          const product = response.data;
          
          if (!product) {
            await interaction.reply({ embeds: [createEmbed('Error', 'Product not found.', '#FA2A3D')] });
            return;
          }
          
          // Send an embed with product details
          await interaction.reply({
            embeds: [createEmbed(
              '📦 Product Removed',
              `**Product ID:**\n\`\`\`${product._id}\`\`\`\n` +
              `- **Product Informations:**\n` +
              `\`📦\` **Product Name:** \`${product.name}\`\n` +
              `\`🔩\` **Product Version:** \`${product.version}\`\n` +
              `\`⏲️\` **Created At:** \`${product.createdAt}\`\n` +
              `- **Product Created By:**\n` +
              `\`👤\` **User:** <@${product.creatorId}>\n` +
              `\`🆔\` **User Id:** \`${product.creatorId}\`\n`,
              '#FA2A3D'
            )]
          });
          
          // Delete product
          await axios.delete(`${API_URL}/api/product/delete/${id}`);
        } catch (error) {
          console.error(error);
          await interaction.reply({ embeds: [createEmbed('Error', `Error deleting the product. ${error.message}`, '#FA2A3D')] });
        }
      } 
    } else if (commandName === 'license') {
      const subcommand = options.getSubcommand();
  
      if (subcommand === 'create') {
        const productId = options.getString('product');
        const duration = options.getString('duration');
        const user = options.getUser('user');
        const creatorId = interaction.user.id;

        if (!user) {
            await interaction.reply({ embeds: [createEmbed('Error', 'User not specified.', '#FA2A3D')] });
            return;
        }

        const userId = user.id;
  
        try {
          // Check if the product exists
          const responseProduct = await axios.get(`${API_URL}/api/product/${productId}`);
          const product = responseProduct.data;
          if (!product) {
            await interaction.reply({ embeds: [createEmbed('Error', 'Product not found.', '#FA2A3D')] });
            return;
          }
  
          // Creation of the license
          const response = await axios.post(`${API_URL}/api/license/create`, { productId, userId, duration, creatorId });
          const license = response.data;
          await interaction.reply({
            embeds: [createEmbed(
              '🔑 License Key Created',
              `**License Key:**\n\`\`\`${license.key}\`\`\`\n` +
              `- **License Informations:**\n` +
              `\`🆔\` **License ID:** \`${license._id}\`\n` +
              `\`📦\` **Product Name:** \`${product.name}\`\n` +
              `\`🔩\` **Product Version:** \`${product.version}\`\n` +
              `\`⏱️\` **Expires:** \`${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'}\`\n` +
              `\`⏲️\` **Created At:** \`${new Date(license.createdAt).toLocaleDateString()}\`\n` +
              `- **License User Info:**\n` +
              `\`👤\` **User:** <@${license.userId}>\n` +
              `\`🆔\` **User Id:** \`${license.userId}\`\n` +
              `- **License Created By:**\n` +
              `\`👤\` **User:** <@${license.creatorId}>\n` +
              `\`🆔\` **User Id:** \`${license.creatorId}\`\n`,
              '#36FF7F'
            )]
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({ embeds: [createEmbed('Error', `Error creating the license. ${error.message}`, '#FA2A3D')] });
        }
  
      } else if (subcommand === 'delete') {
        const id = options.getString('id');
      
        try {
            // Check if license exists
            const responseLicense = await axios.get(`${API_URL}/api/license/${id}`);
            const license = responseLicense.data;
            
            if (!license) {
                await interaction.reply({ embeds: [createEmbed('Error', 'Licence not found.', '#FA2A3D')] });
                return;
            }
    
            // Retrieve associated product details
            const responseProduct = await axios.get(`${API_URL}/api/product/${license.product}`);
            const product = responseProduct.data;
      
            if (!product) {
                await interaction.reply({ embeds: [createEmbed('Error', 'Associated product not found.', '#FA2A3D')] });
                return;
            }
      
            // Send an embed with license details
            await interaction.reply({
                embeds: [createEmbed(
                  '🔑 License Key Removed',
                  `**License Key ID:**\n\`\`\`${license._id}\`\`\`\n` +
                  `- **License Informations:**\n` +
                  `\`📦\` **Product Name:** \`${product.name}\`\n` +
                  `\`🔩\` **Product Version:** \`${product.version}\`\n` +
                  `- **License User Info:**\n` +
                  `\`👤\` **User:** <@${license.userId}>\n` +
                  `\`🆔\` **User Id:** \`${license.userId}\`\n` +
                  `- **License Created By:**\n` +
                  `\`👤\` **User:** <@${license.creatorId}>\n` +
                  `\`🆔\` **User Id:** \`${license.creatorId}\`\n`,
                  '#FA2A3D'
                )]
            });
            
            // Delete license
            await axios.delete(`${API_URL}/api/license/delete/${id}`);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 404) {
                await interaction.reply({ embeds: [createEmbed('Error', 'License not found.', '#FA2A3D')] });
            } else {
                await interaction.reply({ embeds: [createEmbed('Error', `Error deleting the license. ${error.message}`, '#FA2A3D')] });
            }
        }
       }
    } else if (commandName === 'info') {
        const user = options.getUser('user');
        const type = options.getString('type');
        const page = options.getInteger('page') || 1;
    
        try {
            const userId = user.id;
    
            // Retrieve user information based on type
            const response = await axios.get(`${API_URL}/api/info/${userId}`);
            const { licenses, blacklists } = response.data;
    
            let data, embed;
    
            // Determine the data to use and the total number of pages
            if (type === 'licenses') {
                data = licenses;
            } else if (type === 'blacklist') {
                data = blacklists;
            } else {
                return await interaction.reply({ embeds: [createEmbed('Error', 'Invalid type. Use "blacklist" or "licenses".', '#FA2A3D')] });
            }
    
            const totalPages = Math.ceil(data.length / 1); // 1 item per page
    
            if (data.length === 0) {
                return interaction.reply({ embeds: [createEmbed(`No ${type === 'licenses' ? 'License' : 'Blacklist'}`, `User ${user.username} as no ${type === 'licenses' ? 'license' : 'entry in the blacklist'}.`, '#FA2A3D')] });
            }
    
            const item = data[page - 1];
            if (!item) {
                return interaction.reply({ embeds: [createEmbed('Invalid Page', `Page ${page} does not exist.`, '#FA2A3D')] });
            }
    
            // Create the embed based on the type
            if (type === 'licenses') {
                embed = createEmbed(
                    `🔑 License Key pour ${user.username}`,
                    `**License Key:**\n\`\`\`${item.key}\`\`\`\n` +
                    `- **License Informations:**\n` +
                    `\`🆔\` **License ID:** \`${item._id}\`\n` +
                    `\`📦\` **Product Name:** \`${item.product.name}\`\n` +
                    `\`🔩\` **Product Version:** \`${item.product.version}\`\n` +
                    `\`⏱️\` **Expires:** \`${item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never'}\`\n` +
                    `\`⏲️\` **Created At:** \`${new Date(item.createdAt).toLocaleDateString()}\`\n` +
                    `- **License Created By:**\n` +
                    `\`👤\` **User:** <@${item.creatorId}>\n` +
                    `\`🆔\` **User Id:** \`${item.creatorId}\`\n`,
                    '#FFFFFF'
                );
            } else if (type === 'blacklist') {
                embed = createEmbed(
                    `⚫ Blacklist pour ${user.username}`,
                    `**Blacklist Type:**\n\`${item.type}\`\n` +
                    `- **Blacklist Informations:**\n` +
                    `\`🆔\` **Blacklist ID:** \`${item._id}\`\n` +
                    `\`⏲️\` **Created At:** \`${new Date(item.createdAt).toLocaleDateString()}\`\n` +
                    `- **Blacklist Created By:**\n` +
                    `\`👤\` **User:** <@${item.creatorId}>\n` +
                    `\`🆔\` **User Id:** \`${item.creatorId}\`\n`,
                    '#FFFFFF'
                );
            }
    
            // Ajouter le footer avec le numéro de page
            embed.setFooter({ text: `Page ${page} - ${totalPages}` });
    
            await interaction.reply({ embeds: [embed] });
    
        } catch (error) {
            console.error(error);
            await interaction.reply({ embeds: [createEmbed('Error', `Error retrieving information. ${error.message}`, '#FA2A3D')] });
        }
    } else if (commandName === 'licenses') {
        const page = options.getInteger('page') || 1;
    
        try {
            const userId = interaction.user.id;
            
            // Retrieve license information for user
            const response = await axios.get(`${API_URL}/api/license/user/${userId}`);
            const licenses = response.data;
            
            const totalPages = Math.ceil(licenses.length / 1); // 1 item per page
  
            // Language-specific message translations
            const messages = {
                noLicenses: "User has no licenses.",
                invalidPage: "Page does not exist.",
                licenseKey: "🔑 License Key",
                productName: "Product Name",
                productVersion: "Product Version",
                error: "Error retrieving information.",
                pageFooter: `Page ${page} - ${totalPages}`,
            };
    
            if (licenses.length === 0) {
                return interaction.reply({ 
                    embeds: [createEmbed('No License', messages.noLicenses, '#FA2A3D')], 
                    ephemeral: true 
                });
            }
    
            const license = licenses[page - 1];
            if (!license) {
                return interaction.reply({ 
                    embeds: [createEmbed('Invalid Page', messages.invalidPage, '#FA2A3D')], 
                    ephemeral: true 
                });
            }
    
            const embed = createEmbed(
                messages.licenseKey,
                `**License Key:**\n\`\`\`${license.key}\`\`\`\n` +
                `\`📦\` **${messages.productName}:** \`${license.product.name}\`\n` +
                `\`🔩\` **${messages.productVersion}:** \`${license.product.version}\`\n`,
                '#924a4a'
            );
    
            // Add footer with page number
            embed.setFooter({ text: messages.pageFooter });
    
            // Reply to the user with an ephemeral message
            await interaction.reply({ embeds: [embed], ephemeral: true });
    
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                embeds: [createEmbed('Error', `${messages.error} ${error.message}`, '#FA2A3D')], 
                ephemeral: true 
            });
        }
    } else if (commandName === 'blacklist') {
      const subcommand = options.getSubcommand();
  
      if (subcommand === 'add') {
        const user = options.getUser('user');
        const type = options.getString('type');
        const creatorId = interaction.user.id;
      
        try {
          // Sending request to add to blacklist
          const response = await axios.post(`${API_URL}/api/blacklist/add`, { userId: user.id, type, creatorId });
      
          // Retrieving blacklisted entry details from API response
          const blacklistEntry = response.data;
      
          await interaction.reply({
            embeds: [createEmbed(
              '⚫ Blacklist Added',
              `**Blacklist Type:**\n\`\`\`${blacklistEntry.type}\`\`\`\n` +
              `- **Blacklist Informations:**\n` +
              `\`🆔\` **Blacklist ID:** \`${blacklistEntry._id}\`\n` +
              `\`⏲️\` **Created At:** \`${new Date(blacklistEntry.createdAt).toLocaleDateString()}\`\n` +
              `- **User Informations:**\n` +
              `\`👤\` **User:** <@${user.id}>\n` +
              `\`🆔\` **User Id:** \`${user.id}\`\n` +
              `- **Blacklist Created By:**\n` +
              `\`👤\` **User:** <@${blacklistEntry.creatorId}>\n` +
              `\`🆔\` **User Id:** \`${blacklistEntry.creatorId}\`\n`,
              '#36FF7F'
            )]
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({ embeds: [createEmbed('Error', `Error adding to the blacklist. ${error.message}`, '#FA2A3D')] });
        }
      } else if (subcommand === 'delete') {
        const id = options.getString('id');
        
        // Check the validity of the ObjectiveIf
        if (!isValidObjectId(id)) {
            await interaction.reply({ embeds: [createEmbed('Error', 'Invalid blacklist ID.', '#FA2A3D')] });
            return;
        }
        
        try {
            // Retrieve blacklist details before deleting it
            const response = await axios.get(`${API_URL}/api/blacklist/${id}`);
            const blacklistEntry = response.data;
            
            if (!blacklistEntry) {
                await interaction.reply({ embeds: [createEmbed('Error', 'Blacklist not found.', '#FA2A3D')] });
                return;
            }
            
            // Send an embed with the blacklist details
            await interaction.reply({
                embeds: [createEmbed(
                  '⚫ Blacklist Removed',
                  `**Blacklist ID:**\n\`\`\`${blacklistEntry._id}\`\`\`\n` +
                  `- **Blacklist Informations:**\n` +
                  `\`🛠️\` **Blacklist Type:** \`${blacklistEntry.type}\`\n` +
                  `\`⏲️\` **Created At:** \`${blacklistEntry.createdAt}\`\n` +
                  `- **User Informations:**\n` +
                  `\`👤\` **User:** <@${blacklistEntry.userId}>\n` +
                  `\`🆔\` **User Id:** \`${blacklistEntry.userId}\`\n` +
                  `- **Blacklist Created By:**\n` +
                  `\`👤\` **User:** <@${blacklistEntry.creatorId}>\n` +
                  `\`🆔\` **User Id:** \`${blacklistEntry.creatorId}\`\n`,
                  '#FA2A3D'
                )]
            });
            
            // Delete the blacklist
            await axios.delete(`${API_URL}/api/blacklist/delete/${id}`);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 404) {
                await interaction.reply({ embeds: [createEmbed('Error', 'Blacklist not found.', '#FA2A3D')] });
            } else {
                await interaction.reply({ embeds: [createEmbed('Error', `Error deleting the blacklist. ${error.message}`, '#FA2A3D')] });
            }
        }
      }
    }
};

module.exports = {
  registerCommands,
  handleInteraction
};

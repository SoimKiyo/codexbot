const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config');
const { createEmbed } = require('../utils');

module.exports = {
  data: {
    name: 'licensemenu',
    description: 'Configure the license retrieval menu',
  },

  async execute(interaction) {
    const texts = {
      accessDenied: '❌ Access Denied',
      mustBeAdmin: 'You must be an administrator to use this command.',
      errorOccurred: '⚠️ An error occurred while fetching products.',
      noProducts: '🚫 No products are available at the moment.',
      chooseProduct: '📋 Choose a Product',
      selectProduct: "**License Retrieval Process**\n\nNeed to obtain a key? Follow the steps below to receive your product license:\n\n1. Select the product from the list below that you need a license for.\n\n2. Once you've selected the product, confirm the creation of your license.\n\n3. You will receive your license key via direct message.\n\n*Please note that some products have a key limit (this should be mentioned on the product's display or in its documentation). If you wish to view one of your previous keys, use the command /licenses.*\n\nIf you encounter any issues or are unable to retrieve a key, please ensure that you have the required role associated with the product, or contact support.\n\nThank you for your attention and cooperation!",
    };

    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ 
        embeds: [createEmbed(texts.accessDenied, texts.mustBeAdmin, '#FA2A3D')], 
        ephemeral: true 
      });
    }

    try {
      const productsResponse = await fetch(`${config.APISRV}/api/product`);
      if (!productsResponse.ok) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Error', texts.errorOccurred, '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const products = await productsResponse.json();

      if (!Array.isArray(products) || products.length === 0) {
        return interaction.reply({ 
          embeds: [createEmbed(texts.noProducts, texts.noProducts, '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const selectMenuOptions = products.map(product => {
        const requiredRoleId = product.role ? product.role.replace(/<@&(\d+)>/, '$1') : null;
        const role = requiredRoleId ? interaction.guild.roles.cache.get(requiredRoleId) : null;
        const roleName = role ? role.name : ('Unknown Role');

        return new StringSelectMenuOptionBuilder()
          .setLabel(product.name || ('Unknown Product'))
          .setValue(product._id ? product._id.toString() : 'unknown')
          .setDescription(('Required role: ') + roleName);
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('license_select')
        .setPlaceholder('Choose a product')
        .addOptions(selectMenuOptions);

      const row = new ActionRowBuilder()
        .addComponents(selectMenu);

      const embed = createEmbed(
        texts.chooseProduct,
        texts.selectProduct,
        '#924a4a'
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error executing license menu:', error);
      await interaction.reply({ 
        embeds: [createEmbed('⚠️ Error', texts.errorOccurred, '#FA2A3D')], 
        ephemeral: true 
      });
    }
  },

  async handleSelectMenu(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'license_select') return;

    const productId = interaction.values[0];

    try {
      const productResponse = await fetch(`${config.APISRV}/api/product/${productId}`);
      if (!productResponse.ok) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Product Not Found', 'The selected product could not be found.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const product = await productResponse.json();
      if (!product) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Product Not Found', 'The selected product could not be found.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const requiredRoleId = product.role ? product.role.replace(/<@&(\d+)>/, '$1') : null;
      if (requiredRoleId && !interaction.member.roles.cache.has(requiredRoleId)) {
        return interaction.reply({ 
          embeds: [createEmbed('❌ Insufficient Permissions', 'You do not have the required role for this product.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const licensesResponse = await fetch(`${config.APISRV}/api/license/user/${interaction.user.id}`);
      if (!licensesResponse.ok) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Error', 'An error occurred while checking licenses.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const licenses = await licensesResponse.json();
      const productLicenses = licenses.filter(license => license.product.toString() === productId);
      if (productLicenses.length >= product.maxLicenses) {
        return interaction.reply({ 
          embeds: [createEmbed('🚫 License Limit Reached', 'You have reached the maximum number of licenses for this product.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const embed = createEmbed(
        '🔑 License Confirmation',
        'Please click the button below to confirm the creation of your license.',
        '#36FF7F'
      );

      const button = new ButtonBuilder()
        .setCustomId(`confirm_${productId}`)
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder()
        .addComponents(button);

      await interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        ephemeral: true 
      });
    } catch (error) {
      console.error('Error handling select menu:', error);
      await interaction.reply({ 
        embeds: [createEmbed('⚠️ Error', 'An error occurred while handling the select menu.', '#FA2A3D')], 
        ephemeral: true 
      });
    }
  },

  async handleLicenseMenuCommand(message) {
    if (!message.content.startsWith(';licensemenu')) return;

    const hasAdminRole = message.member.roles.cache.some(role => config.ADMIN_ROLE_IDS.includes(role.id));

    if (!hasAdminRole) {
      return message.reply({ 
        embeds: [createEmbed('❌ Accès Refusé', 'You must be an administrator to use this command.', '#FA2A3D')] 
      });
    }

    try {
      await this.execute({
        member: message.member,
        reply: (content) => message.reply(content),
        guild: message.guild
      });
    } catch (error) {
      console.error('Error executing license menu command:', error);
      await message.reply({ 
        embeds: [createEmbed('⚠️ Error', 'An error occurred while executing the command.', '#FA2A3D')] 
      });
    }
  },

  async handleLicenseConfirmation(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('confirm_')) return;

    const productId = interaction.customId.split('_')[1];

    try {
      const productResponse = await fetch(`${config.APISRV}/api/product/${productId}`);
      if (!productResponse.ok) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Product Not Found', 'The product associated with the license could not be found.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const product = await productResponse.json();
      if (!product) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Product Not Found', 'The product associated with the license could not be found.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const licenseResponse = await fetch(`${config.APISRV}/api/license/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId: interaction.user.id,
          duration: 'never',
          creatorId: interaction.user.id,
          createdAt: new Date(),
        }),
      });
      if (!licenseResponse.ok) {
        return interaction.reply({ 
          embeds: [createEmbed('⚠️ Error', 'An error occurred while creating the license.', '#FA2A3D')], 
          ephemeral: true 
        });
      }

      const license = await licenseResponse.json();

      await interaction.reply({ 
        embeds: [createEmbed('✅ License Confirmed', 'Your license has been confirmed!', '#36FF7F')], 
        ephemeral: true 
      });

      try {
        const user = await interaction.client.users.fetch(interaction.user.id);
        const embed = createEmbed(
          '🔑 License Key Retrieved',
          `**${'License Key'}:**\n\`\`\`${license.key}\`\`\`\n\n- **${'Product Information'}:**\n\`📦\` **${'Product Name'}:** \`${product.name || ('Unknown Product')}\`\n\`🔩\` **${'Product Version'}:** \`${product.version || ('Unknown Version')}\``,
          '#924a4a',
          'Thanks for using ForgotDot'
        );
        await user.send({ embeds: [embed] });
      } catch (error) {
        await interaction.followUp({ 
          embeds: [createEmbed('⚠️ Error', 'Failed to send the license details to your DM. Please check your DM settings.', '#FA2A3D')], 
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error('Error handling license confirmation:', error);
      await interaction.reply({ 
        embeds: [createEmbed('⚠️ Error', 'An error occurred while confirming the license.', '#FA2A3D')], 
        ephemeral: true 
      });
    }
  }
};

const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const params = require("../../jsons/param.json");

module.exports = {
  name: "createguild",
  description: "Créer une guilde : prix : " + params.guildPrice + " fragments",
  options: [
    {
      name: "name",
      description: "Nom de la Guilde",
      type: 3,
      required: true,
    },
    {
      name: "color",
      description: "Couleurs de la guilde (hex code, e.g., #ff5733)",
      type: 3,
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const userId = interaction.user.id;

    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    // Check if the user has the required role, is not in a guild, and guild limit is not reached
    const requiredRoleId = "1246944929675087914";
    const maxGuilds = 20;
    const guildName = interaction.options.getString("guild_name");
    const guildColorInput = interaction.options.getString("guild_color");

    try {
      const roles = await dbManager.getRoleByUserId(userId);
      const hasRequiredRole = roles.some(
        (role) => role.idRole === requiredRoleId
      );
      if (!hasRequiredRole) {
        throw new Error(
          "Vous n'avez pas le rôle requis pour créer une guilde."
        );
      }

      // Vérifier si la couleur spécifiée est en format hexadécimal

      if (!/^#[0-9A-F]{6}$/i.test(guildColorInput)) {
        throw new Error(
          "Le code couleur de la guilde doit être spécifié en format hexadécimal (par exemple, #ff5733)."
        );
      }

      const userData = await dbManager.getStats(userId);
      const userGuildId = userData.guildId;
      if (userGuildId !== null) {
        throw new Error(
          "Vous êtes déjà associé à une guilde. Veuillez quitter votre guilde actuelle pour en créer une nouvelle."
        );
      }

      const guilds = await dbManager.getGuild();
      if (guilds.length >= maxGuilds) {
        throw new Error(
          "Le nombre maximum de guildes a été atteint. Veuillez supprimer une guilde pour en créer une nouvelle."
        );
      }
      const guildPrice = params.guildPrice; // Récupérer le prix de création de guilde depuis les paramètres
      const userFragments = userData.power;

      if (userFragments < guildPrice) {
        throw new Error(
          "Vous n'avez pas suffisamment de fragments pour créer une guilde."
        );
      }

      // Create the guild
      const guildColor = guildColorInput.toUpperCase();
      await dbManager.createGuild(guildColor, guildName, userId);
      await dbManager.updatePower(userId, -params.guildPrice);

      const embed = new EmbedBuilder()
        .setTitle("Guilde créée")
        .setColor(guildColor)
        .setDescription(
          `Votre guilde "${guildName}" a été créée avec succès ! et 40000 ${emoji(
            emo.power
          )} attribué à la guilde`
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      // Handle errors
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Accès Refusé ⚠️")
        .setColor(color.error)
        .setDescription(
          `> ${error.message}\n\n` +
            `Veuillez vérifier les conditions pour pouvoir créer une guilde:\n` +
            `- Avoir le rôle nécessaire (${requiredRoleId})\n` +
            `- Moins de ${maxGuilds} guildes au total\n` +
            `- Ne pas être déjà dans une guilde\n` +
            `- Avoir suffisamment de fragments (${params.guildPrice} ${emoji(
              emo.power
            )}  requis)`
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      return interaction.reply({ embeds: [embed] });
    }
  },
};

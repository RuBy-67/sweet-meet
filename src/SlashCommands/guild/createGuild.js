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
      name: "description",
      description: "une description de la guilde",
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

    // Check si l'user à le role et si le max de guild n'est pas attein
    const requiredRoleId = "1246944929675087914";
    const maxGuilds = 20;
    const guildName = interaction.options.getString("name");
    const guildColorInput =
      "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
    const guildDescription = interaction.options.getString("description");

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
      if (guildName.length > 20) {
        throw new Error(
          "Le nom de la guilde ne peut pas dépasser 20 caractères."
        );
      }

      // Créer la guilde
      const guildColor = guildColorInput.toUpperCase();
      let tag = guildName.substring(0, 3).toUpperCase();
      let suffix = 1;
      let uniqueTag = tag;
      while (await dbManager.getGuildByTag(uniqueTag)) {
        uniqueTag = tag + suffix;
        suffix++;
      }

      await dbManager.createGuild(
        guildColor,
        guildName,
        guildDescription,
        uniqueTag,
        userId
      );
      const guildId = await dbManager.getGuildByOwnerId(userId);
      await dbManager.updateUserGuild(guildId.id, userId);
      await dbManager.updatePower(userId, -params.guildPrice);
      conjoint = await dbManager.getMarriage(userId);
      if (conjoint.length > 0) {
        if (conjoint.idUser1 != userId) {
          await dbManager.addClassToUser(conjoint[0].idUser1, guildId.id, 1);
          await dbManager.updateUserGuild(guildId.id, conjoint[0].idUser2);
        } else if (conjoint.idUser2 != userId) {
          await dbManager.addClassToUser(conjoint[0].idUser2, guildId.id, 1);
          await dbManager.updateUserGuild(guildId.id, conjoint[0].idUser2);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Guilde créée")
        .setColor(guildColor)
        .setDescription(
          `Votre guilde "${guildName}" a été créée avec succès ! et 40000 ${emoji(
            emo.power
          )} attribué à la guilde\nTag de guilde : \`\`${uniqueTag}\`\`\nLe code couleur de la guilde est (Aléatoire) : ${guildColor}, modifiable à partir du Niveau 2 de guilde`
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

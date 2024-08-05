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

    /*if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }*/
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    // Check si l'user à le role et si le max de guild n'est pas attein
    const requiredRoleId = "1246944929675087914"; //1267908548650602558 (test) //1246944929675087914 (prod)
    const maxGuilds = 20;
    const guildName = interaction.options.getString("name");
    const guildColorInput =
      "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
    const guildDescription = interaction.options.getString("description");
    const member = await interaction.guild.members.fetch(interaction.user.id);

    try {
      const hasRequiredRole = member.roles.cache.some(
        (role) => role.id === requiredRoleId
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
      if (userData.guildId !== null) {
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
      if (guildDescription.length > 250) {
        throw new Error(
          "La description de la guilde ne peut pas dépasser 100 caractères."
        );
      }
      // Créer la guilde
      const guildColor = guildColorInput.toUpperCase();
      let tag = guildName.substring(0, 3).toUpperCase();
      let suffix = 1;
      let uniqueTag = tag;
      const maxAttempts = 8; // Limite maximale d'itérations
      let attempts = 0;
      while ((await dbManager.getGuildByTag(uniqueTag).length) > 0) {
        if (attempts >= maxAttempts) {
          throw new Error(
            "Impossible de générer un tag de guilde unique après plusieurs tentatives."
          );
        }
        uniqueTag = tag + suffix;
        suffix++;
        attempts++;
      }

      await dbManager.createGuild(
        guildColor,
        guildName,
        guildDescription,
        uniqueTag,
        userId
      );
      const guildId = await dbManager.getGuildByOwnerId(userId);
      console.log(guildId[0].id);
      await dbManager.updateUserGuild(guildId[0].id, userId);

      await dbManager.updatePower(userId, -params.guildPrice);
      const [conjoint] = await dbManager.getMarriage(userId);
      console.log(conjoint);
      console.log(conjoint.length);
      if (conjoint.length == 1) {
        if (conjoint[0].idUser1 != userId) {
          console.log("conjoint 1 " + conjoint.idUser);
          console.log(guildId[0].id);
          await dbManager.addClassToUser(conjoint.idUser, guildId[0].id, 1);
          await dbManager.updateUserGuild(guildId[0].id, conjoint.idUser2);
        } else if (conjoint[0].idUser2 != userId) {
          console.log("conjoint 2" + conjoint.idUser2);
          console.log(guildId[0].id);
          await dbManager.addClassToUser(conjoint.idUser2, guildId[0].id, 1);
          await dbManager.updateUserGuild(guildId[0].id, conjoint.idUser);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Guilde créée")
        .setColor(guildColor)
        .setDescription(
          `Félicitations, noble Empereur! Vous êtes désormais à la tête d'un véritable empire.\nVotre guilde "${guildName} **[${uniqueTag}]** a été créée avec succès ! et 40000${emoji(
            emo.power
          )} attribué à la guilde\nCouleurs de Guilde (Aléatoire) : ${guildColor} (modifiable à partir du __Niveau 2__)\n\nPour gérer votre guilde, vous trouverez les commandes ici : \`/gestionguild help\`, \`/guild info\`.\n\n*Si vous êtes marié, votre impératrice vous a automatiquement rejoint et règne à vos côtés sur votre cher royaume, apportant sagesse et grâce à votre règne.*`
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
          `> Erreur -> ${error.message}\n\n` +
            `Veuillez vérifier les conditions pour pouvoir créer une guilde:\n` +
            `- Avoir le rôle nécessaire (<@&${requiredRoleId}>)\n` +
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

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

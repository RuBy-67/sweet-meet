const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const config = require("../../jsons/config.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "createGuild",
  description: "Create a guild",
  options: [
    {
      name: "name",
      description: "Name of the guild",
      type: 3,
      required: true,
    },
    {
      name: "color",
      description: "Banner color of the guild (hex code, e.g., #ff5733)",
      type: 3,
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const userId = interaction.user.id;
    const guildName = interaction.options.getString("name");
    const guildColor = interaction.options.getString("color");

    const colors = await dbManager.getColor(userId);

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
    const roles = await dbManager.getRoleByUserId(userId);

    const requiredRoleId = "1246944929675087914";
    const hasRequiredRole = roles.some(
      (role) => role.idRole === requiredRoleId
    );

    if (!hasRequiredRole) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Accès Refusé ⚠️")
        .setColor(color.error)
        .setDescription(
          `> Vous n'avez pas le rôle requis pour créer une guilde.\n` +
            `Veuillez acheter le rôle nécessaire dans la boutique pour pouvoir créer une guilde.`
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      return interaction.reply({ embeds: [embed] });
    }

    const maxGuilds = 20;
    const guilds = await dbManager.getGuild();
    if (guilds.length >= maxGuilds) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Création de guilde impossible ⚠️")
        .setColor(color.error)
        .setDescription(
          `> Le nombre maximum de guildes a été atteint. Veuillez supprimer une guilde pour en créer une nouvelle.`
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      return interaction.reply({ embeds: [embed] });
    }

    /// create guild (insert into database)
    await dbManager.createGuild(guildName, guildColor, userId);

    const embed = new EmbedBuilder()
      .setTitle("Guilde créée")
      .setColor(guildColor)
      .setDescription(`La guilde **${guildName}** a été créée avec succès !`)
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};

const {
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const Dating = require("../../class/dateManager");
const dateManager = new Dating();

module.exports = {
  name: "dateprofil",
  description: "dateprofil",
  options: null,
  run: async (client, interaction, args) => {
    if (!config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> La commande est actuellement en maintenance, veuillez réessayer plus tard.`
        )
        .setColor(color.error);
      return interaction.reply({ embeds: [embed] });
    }
    if (cooldownInfo) return;
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    /*const embed = new EmbedBuilder()
      .setTitle("Titre") ....*/

    /* pour appeller une fonction de la classe dateManager*/
    //Exemple :  await dateManager.insertIntoProfile(userId, dateOrientation, dateDesc, dateMP, prenom, age);
    /* étant des fonction async, il faut les appeler avec await !*/
  },
};

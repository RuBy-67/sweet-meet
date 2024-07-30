const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const params = require("../../jsons/param.json");
const color = require("../../jsons/color.json");
const Player = require("../../class/player");
const { description } = require("./guild");
const player = new Player();

module.exports = {
  name: "campagne",
  description: "🚨 Empreur, reine et ministre de la guilde",
  options: [
    {
      type: 1,
      name: "solo",
      description: "campagne solo",
      options: [
        {
          type: 3,
          name: "choix",
          description: "A venir",
          choices: [
            {
              name: `A venir`,
              value: "2",
            },
            {
              name: `A venir`,
              value: "1",
            },
          ],
          required: true,
        },
      ],
    },
    {
      type: 1,
      name: "entrainement",
      description: "campagne d'entrainement",
      options: [
        {
          type: 3,
          name: "difficulté",
          description: "difficulté des Bosses",
          choices: [
            {
              name: `Facile`,
              value: "1",
            },
            {
              name: `Moyen`,
              value: "2",
            },
            {
              name: `Difficile`,

              value: "3",
            },
            {
              name: `Légendaire`,
              value: "4",
            },
          ],
          required: true,
        },
        {
          type: 3,
          name: "boss",
          description: "Qui voulez-vous affronter ?",
          choices: [
            {
              name: `Malakar`,
              value: "malakar",
            },
            {
              name: `Zarathos`,
              value: "zarathos",
            },
            {
              name: `Xerath`,

              value: "xerath",
            },
            {
              name: `Lyrathia `,
              value: "lyrathia",
            },
            {
              name: `Thalgrimm `,
              value: "thalgrimm",
            },
            {
              name: `Vorgoth`,
              value: "vorgoth",
            },
            {
              name: `Morvath`,
              value: "morvath",
            },
            {
              name: `Draugr`,
              value: "draugr",
            },
          ],
          required: true,
        },
      ],
    },
  ],
  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        )
        .setColor(color.error);
      return interaction.reply({ embeds: [embed] });
    }
    const Embedcolors = await dbManager.getColor(interaction.user.id);

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "help":
      default:
        return interaction.reply({
          content: "Commande Invalide",
          ephemeral: true,
        });
    }
  },
};

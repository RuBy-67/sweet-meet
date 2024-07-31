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
const Boss = require("../../class/bossManager");
const { name } = require("../guild/guild");
const bosses = new Boss();

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
            { name: `Malakar`, value: "1" },
            { name: `Zarathos`, value: "2" },
            { name: `Xerath`, value: "3" },
            { name: `Lyrathia `, value: "4" },
            { name: `Thalgrimm `, value: "5" },
            { name: `Vorgoth`, value: "6" },
            { name: `Morvath`, value: "7" },
            { name: `Nexar`, value: "8" },
            { name: `Korgath`, value: "9" },
            { name: `Seraphina`, value: "10" },
            { name: `Draugr`, value: "8" },
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
    const userId = interaction.user.id;
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "entrainement":
        const difficulty = interaction.options.getString("difficulté");

        const boss = interaction.options.getString("boss");
        const bossInfo = await bosses.getInfoBossById(boss);
        let attaque = bossInfo.attaque;
        let defense = bossInfo.defense;
        let sante = bossInfo.sante;
        let recompenseV = 8000;
        let recompenseD = 2000;
        if (difficulty === "1") {
          attaque = attaque * 0.5;
          defense = defense * 0.5;
          sante = sante * 0.5;
          recompenseV = recompenseV * 2;
          recompenseD = recompenseD * 0.5;
        } else if (difficulty === "2") {
          attaque = attaque * 0.75;
          defense = defense * 0.75;
          sante = sante * 0.75;
          recompenseV = recompenseV * 2;
          recompenseD = recompenseD * 0.75;
        } else if (difficulty === "3") {
          attaque = attaque * 1.25;
          defense = defense * 1.25;
          sante = sante * 1.25;
          recompenseV = recompenseV * 3;
          recompenseD = recompenseD * 1.25;
        } else if (difficulty === "4") {
          attaque = attaque * 1.5;
          defense = defense * 1.5;
          sante = sante * 1.5;
          recompenseV = recompenseV * 5;
          recompenseD = recompenseD * 2;
        }
        const embed = new EmbedBuilder()
          .setTitle(`Entraînement contre ${bossInfo.nom}`)
          .setThumbnail(bossInfo.image)
          .setDescription(`*${bossInfo.lore}*\n\nCarte du boss`)
          .addFields(
            { name: "Nom du Boss", value: bossInfo.nom, inline: true },
            { name: "Difficulté", value: difficulty, inline: true },
            {
              name: "Habilite",
              value: `__Habilité 1:__ *${bossInfo.habilite1}*\n__Habilité 2:__ *${bossInfo.habilite2}*`,
            },
            {
              name: "Faiblesse",
              value: `__Faiblesse 1:__ *${bossInfo.faiblesse1}*\n__Faiblesse 2:__ *${bossInfo.faiblesse2}*`,
            },
            {
              name: "Statistiques",
              value: `⚔️__Attaque:__ *${attaque}*\n🛡️__Défense:__ *${defense}*\n💚__Santé:__ *${sante}*`,
            },
            {
              name: "Récompense",
              value: `Victoire: ${recompenseV} ${emoji(
                emo.power
              )} \nDéfaite: ${recompenseD} ${emoji(emo.power)}`,
            }
          )
          .setColor(Embedcolors);

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("start_duel")
            .setLabel("Lancer le duel")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("cancel_duel")
            .setLabel("Annuler le duel")
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
          embeds: [embed],
          components: [actionRow],
        });

        // Créer un collector pour gérer les interactions de boutons
        const filter = (i) =>
          i.customId === "start_duel" || i.customId === "cancel_duel";
        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: 60000, // Temps de validité du collector (1 minute)
        });

        collector.on("collect", async (i) => {
          if (i.customId === "start_duel") {
            // Logique pour lancer le duel
            const startEmbed = new EmbedBuilder()
              .setTitle("Duel Commencé")
              .setDescription(
                `Vous avez commencé un duel contre **${bossInfo.name}**! Bonne chance!`
              )
              .setColor(color.success);

            await i.update({ embeds: [startEmbed], components: [] });
          } else if (i.customId === "cancel_duel") {
            // Logique pour annuler le duel
            const cancelEmbed = new EmbedBuilder()
              .setTitle("Duel Annulé")
              .setDescription(
                `Le duel contre **${bossInfo.name}** a été annulé.`
              )
              .setColor(color.error);

            await i.update({ embeds: [cancelEmbed], components: [] });
          }
        });

        collector.on("end", (collected, reason) => {
          if (reason === "time") {
            interaction.editReply({
              content: "Le temps est écoulé pour lancer ou annuler le duel.",
              components: [],
            });
          }
        });
        break;

      default:
        return interaction.reply({
          content: "Commande Invalide",
          ephemeral: true,
        });
    }
  },
};

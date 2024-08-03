const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const params = require("../../jsons/param.json");
const color = require("../../jsons/color.json");
const Player = require("../../class/player");
const player = new Player();
const Boss = require("../../class/bossManager");
const { name } = require("../guild/guild");
const bosses = new Boss();
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();

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
              name: `income`,
              value: "2",
            },
            {
              name: `income`,
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
            { name: `Draugr`, value: "11" },
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
        let difficultyString = "";
        let attaque = bossInfo.attaque;
        let defense = bossInfo.defense;
        let sante = bossInfo.sante;
        let recompenseV = 8000;
        let recompenseD = 8000;
        if (difficulty === "1") {
          attaque = Math.round(attaque * 0.3);
          defense = Math.round(defense * 0.3);
          sante = Math.round(sante * 0.3);
          recompenseV = recompenseV * 0.25;
          recompenseD = recompenseD * 0.1;
          difficultyString = "Facile";
        } else if (difficulty === "2") {
          attaque = Math.round(attaque * 0.75);
          defense = Math.round(defense * 0.75);
          sante = Math.round(sante * 0.75);
          recompenseV = Math.round(recompenseV * 0.75);
          recompenseD = recompenseD * 0.5;
          difficultyString = "Moyen";
        } else if (difficulty === "3") {
          attaque = Math.round(attaque * 1.55);
          defense = Math.round(defense * 1.55);
          sante = Math.round(sante * 1.55);
          recompenseV = Math.round(recompenseV * 1.25);
          recompenseD = recompenseD * 1;
          difficultyString = "Difficile";
        } else if (difficulty === "4") {
          attaque = Math.round(attaque * 2.5);
          defense = Math.round(defense * 2.5);
          sante = Math.round(sante * 2.22);
          recompenseV = Math.round(recompenseV * 2);
          recompenseD = recompenseD * 1.25;
          difficultyString = "Légendaire";
        }
        const embed = new EmbedBuilder()
          .setTitle(`Entraînement contre ${bossInfo.nom}`)
          .setThumbnail(bossInfo.image)
          .setDescription(`*${bossInfo.lore}*\n\n***Carte du boss***`)
          .addFields(
            { name: "Nom du Boss", value: bossInfo.nom, inline: true },
            {
              name: "Difficulté",
              value: `**${difficultyString}**`,
              inline: true,
            },
            { name: " ", value: ` ` },
            {
              name: "Habilités",
              value: `- *${bossInfo.habilite1}*\n- *${bossInfo.habilite2}*`,
            },
            {
              name: "Faiblesse",
              value: `- *${bossInfo.faiblesse1}*\n- *${bossInfo.faiblesse2}*`,
            },
            {
              name: "Statistiques",
              value: `⚔️__Attaque:__ *${attaque}*\n🛡️__Défense:__ *${defense}*\n💚__Santé:__ *${sante}*`,
              inline: true,
            },
            {
              name: "Récompense",
              value: `Victoire: ${recompenseV} ${emoji(
                emo.power
              )} \nDéfaite: -${recompenseD} ${emoji(emo.power)}`,
              inline: true,
            }
          )
          .setColor(Embedcolors)
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

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
          ephemeral: true,
        });

        // Créer un collector pour gérer les interactions de boutons
        const filter = (i) =>
          i.customId === "start_duel" || i.customId === "cancel_duel";
        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: 60000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "start_duel") {
            const commandName = "entrainement";
            const cooldownDuration = params.cooldownEntrainement;
            const cooldownInfo = await cooldown.handleCooldown(
              interaction,
              commandName,
              cooldownDuration
            );

            if (cooldownInfo) return; // uniquement si duel lancé

            // Logique pour lancer le duel
            const startEmbed = new EmbedBuilder()
              .setTitle("Duel Commencé")
              .setDescription(
                `Vous avez commencé un duel contre **${bossInfo.nom}**!`
              )
              .setImage(bossInfo.image)
              .setColor(Embedcolors);
            await i.update({ embeds: [startEmbed], components: [] });
            await bosses.startDuel(
              userId,
              bossInfo,
              difficulty,
              i,
              recompenseD,
              recompenseV,
              Embedcolors,
              client
            );
            return;
          } else if (i.customId === "cancel_duel") {
            // Logique pour annuler le duel
            const cancelEmbed = new EmbedBuilder()
              .setTitle("Duel Annulé")
              .setDescription(
                `Le duel contre **${bossInfo.nom}** a été annulé.`
              )
              .setColor(color.error);

            await i.update({ embeds: [cancelEmbed], components: [] });
          }
        });

        collector.on("end", (collected, reason) => {
          if (reason === "time") {
            interaction.editReply({
              content: " ",
              components: [],
            });
          }
        });
        break;
      case "solo":
        return interaction.reply({
          content: "Commande à venir",
          ephemeral: true,
        });
      default:
        return interaction.reply({
          content: "Commande Invalide",
          ephemeral: true,
        });
    }
  },
};

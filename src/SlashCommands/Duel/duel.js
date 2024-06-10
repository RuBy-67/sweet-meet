const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const param = require(`../../jsons/param.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const Player = require("../../class/player");
const player = new Player();
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();
const config = require("../../config.json");

module.exports = {
  name: "duel",
  description:
    "Duel avec un autre joueur pour gagner des Fragments de Protection",
  options: [
    {
      name: "membre",
      description: "Le membre avec lequel vous voulez faire un duel",
      type: 6,
      required: true,
    },
    {
      name: "paris",
      description:
        "Fragments mis en jeu pour le duel (n'influe pas sur le résultat du duel)",
      type: 4,
      min: 100,
      required: true,
    },
  ],
  run: async (client, interaction, args) => {
    const commandName = "duel";
    const cooldownDuration = param.cooldownDuel;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration
    );
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
    if (cooldownInfo) return;
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const temps = Math.floor(Date.now() / 1000) + 60;
    const membre = interaction.options.getUser("membre");
    const userId = interaction.user.id;
    const userName = interaction.user.username;
    let paris = interaction.options.getInteger("paris");
    const userPower = await dbManager.getStats(userId);
    const adversaryPower = await dbManager.getStats(membre.id);
    if (userPower.power < paris) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `Vous n'avez pas assez de Fragments pour initier ce duel avec une mise de ${paris}.`
        )
        .setColor(color.error);

      return interaction.reply({ embeds: [embed] });
    }

    if (adversaryPower.power < paris) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `${membre.username} n'a pas assez de Fragments pour accepter ce duel avec une mise de ${paris}.`
        )
        .setColor(color.error);

      return interaction.reply({ embeds: [embed] });
    }
    if (membre === interaction.user) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `Vous ne pouvez pas initier un duel avec vous-même. (Bien essayé)`
        )
        .setColor(color.error);

      return interaction.reply({ embeds: [embed] });
    }
    if (paris < 0) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setDescription(
          `Vous ne pouvez pas initier un duel avec une mise de ${paris} inférieur à 0 (hé oui).`
        )
        .setColor(color.error);

      return interaction.reply({ embeds: [embed] });
    }

    const [userMaterials, adversaryMaterials] = await Promise.all([
      player.getMaterialsById(userId),
      player.getMaterialsById(membre.id),
    ]);
    const userMaterialNames = getMaterialNames(userMaterials);
    const adversaryMaterialNames = await getMaterialNames(adversaryMaterials);
    function getMaterialNames(materials) {
      if (materials.length === 0) return [];
      const materialNames = materials.map(
        (material) =>
          `${emoji(emo[material.nom])} \`${material.nom}\` *=>* lvl: ${
            material.materiauLevel
          }`
      );
      return materialNames;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accept_duel")
        .setLabel("Accepter")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("decline_duel")
        .setLabel("Refuser")
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle("Duel Initié")
      .setDescription(
        `Vous avez initié un duel avec **${
          membre.username
        }** avec une mise en jeu de  ${paris * 2} ${emoji(
          emo.power
        )}.\nFin <t:${temps}:R>\n\n*Appuyez sur le bouton ci-dessous pour accepter/refuser le duel.*`
      )
      .addFields(
        {
          name: "Vos détails",
          value: `Fragments de Protection : ${userPower.power} ${emoji(
            emo.power
          )}\n\n**Materiaux :**\n ${
            userMaterialNames.length > 0
              ? userMaterialNames.join("\n")
              : "Aucun"
          }`,
          inline: true,
        },
        {
          name: `Détail de ${membre.username}`,
          value: `Fragments de Protection : ${adversaryPower.power}${emoji(
            emo.power
          )}\n\n**Materiaux :**\n ${
            adversaryMaterialNames.length > 0
              ? adversaryMaterialNames.join("\n")
              : "Aucun"
          }`,
          inline: true,
        },
        {
          name: `Répartition des gains:`,
          value: "75% pour le gagnant et 25% pour le perdant",
          inline: false,
        }
      )
      .setImage("https://media1.tenor.com/m/6QwxgzQLGKUAAAAC/battle.gif")
      .setColor(color.pink);
    const message = await interaction.reply({
      content: `Duel initié avec <@${
        membre.id
      }> avec une mise de ${paris} ${emoji(emo.power)}.`,
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });
    const filter = (interaction) => interaction.user.id === membre.id;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "accept_duel") {
        row.components.forEach((component) => component.setDisabled(true));
        message.edit({ components: [row] });
        const [winner, duelId] = await player.fightBattle(userId, membre.id);
        await player.updatePower(membre.id, -paris);
        await player.updatePower(userId, -paris);
        paris = paris * 2;
        parisWin = Math.floor(paris * (75 / 100));
        parisLose = Math.floor(paris * (25 / 100));
        parisDraw = Math.floor((paris / 2) * 1.02);
        if (winner === userId) {
          await player.updatePower(userId, parisWin);
          await player.updatePower(membre.id, parisLose);
        } else if (winner === membre.id) {
          await player.updatePower(membre.id, parisWin);
          await player.updatePower(membre.id, parisLose);
        } else {
          await player.updatePower(userId, parisDraw);
          await player.updatePower(membre.id, parisDraw);
        }

        buttonInteraction
          .reply(
            `- __${userName} :__ *${await player.getRandomMessage(
              "start"
            )}*\n- __${membre.username} :__ *${await player.getRandomMessage(
              "start"
            )}*`
          )
          .then(async (message) => {
            await new Promise((resolve) => setTimeout(resolve, 100)); // Attendre 100 ms avant de commencer duelProgress

            await player.duelProgress(
              message,
              userName,
              membre,
              winner,
              duelId,
              userId,
              parisWin,
              parisLose,
              parisDraw
            );
            await new Promise((resolve) => setTimeout(resolve, 29000)); // Attendre 30 secondes supplémentaires après duelProgress
            const [duelDetail] = await dbManager.getDuelDetails(duelId, userId);
            const [duelDetail2] = await dbManager.getDuelDetails(
              duelId,
              membre.id
            );
            let gainUserId, gainMembreId;

            if (winner === userId) {
              gainUserId = parisWin;
              gainMembreId = -parisLose;
            } else if (winner === membre.id) {
              gainUserId = -parisLose;
              gainMembreId = parisWin;
            } else if (winner === null) {
              gainUserId = parisDraw;
              gainMembreId = parisDraw;
            } else {
              gainUserId = parisDraw;
              gainMembreId = parisDraw;
            }
            const duelEmbed = new EmbedBuilder()
              .setTitle("Duel terminé")
              .setDescription(
                `Le duel entre <@${userId}> et <@${membre.id}> est terminé.`
              )
              .addFields(
                {
                  name: `Détails de ${userName}`,
                  value:
                    `> Fragments de Protection: **${
                      duelDetail.powerUser1
                    }**  ${emoji(emo.power)} (Gain: **${gainUserId}**)\n` +
                    `${
                      duelDetail.nomMateriau1
                        ? `> __Materiaux 1:__ ${emoji(
                            emo[duelDetail.nomMateriau1]
                          )} **${duelDetail.nomMateriau1}**, Type: ${
                            duelDetail.typeMateriau1
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail.nomMateriau2
                        ? `> __Materiaux 2:__ ${emoji(
                            emo[duelDetail.nomMateriau2]
                          )} **${duelDetail.nomMateriau2}**, Type: ${
                            duelDetail.typeMateriau2
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail.nomMateriau3
                        ? `> __Materiaux 3:__ ${emoji(
                            emo[duelDetail.nomMateriau3]
                          )} **${duelDetail.nomMateriau3}**, Type: ${
                            duelDetail.typeMateriau3
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail.nomMateriau4
                        ? `> __Materiaux 4:__ ${emoji(
                            emo[duelDetail.nomMateriau4]
                          )} **${duelDetail.nomMateriau4}**, Type: ${
                            duelDetail.typeMateriau4
                          }\n`
                        : ""
                    }`,
                },
                {
                  name: `Détails de ${membre.username}`,
                  value:
                    `> Fragments de Protection: **${
                      duelDetail2.powerUser1
                    }** ${emoji(emo.power)} (Gain: **${gainMembreId}**)\n` +
                    `${
                      duelDetail2.nomMateriau1
                        ? `> __Materiaux 1:__ ${emoji(
                            emo[duelDetail2.nomMateriau1]
                          )} **${duelDetail2.nomMateriau1}**, Type: ${
                            duelDetail2.typeMateriau1
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail2.nomMateriau2
                        ? `> __Materiaux 2:__ ${emoji(
                            emo[duelDetail2.nomMateriau2]
                          )} **${duelDetail2.nomMateriau2}**, Type: ${
                            duelDetail2.typeMateriau2
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail2.nomMateriau3
                        ? `> __Materiaux 3:__ ${emoji(
                            emo[duelDetail2.nomMateriau3]
                          )} **${duelDetail2.nomMateriau3}**, Type: ${
                            duelDetail2.typeMateriau3
                          }\n`
                        : ""
                    }` +
                    `${
                      duelDetail2.nomMateriau4
                        ? `> __Materiaux 4:__ ${emoji(
                            emo[duelDetail2.nomMateriau4]
                          )} **${duelDetail2.nomMateriau4}**, Type: ${
                            duelDetail2.typeMateriau4
                          }\n`
                        : ""
                    }`,
                }
              )
              .setColor(color.pink)
              .setFooter({
                text: `Duel ID: ${duelId} | Demandé(e) par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              });
            message.edit({ embeds: [duelEmbed] });
          });
      } else if (buttonInteraction.customId === "decline_duel") {
        buttonInteraction.reply("Duel refusé.");
        row.components.forEach((component) => component.setDisabled(true));
        message.edit({ components: [row] });
      }
    });

    collector.on("end", () => {
      row.components.forEach((component) => component.setDisabled(true));
      message.edit({ components: [row] });
    });
  },
};

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
const config = require("../../jsons/config.json");

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
    const cooldownMessage =
      "Pour éviter les abus, vous ne pouvez pas utiliser la commande DUEL trop souvent. Veuillez réessayer plus tard.";
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration,
      cooldownMessage
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
    const colors = await dbManager.getColor(userId);
    const userPower = await dbManager.getStats(userId);
    const adversaryPower = await dbManager.getStats(membre.id);
    function createErrorEmbed(title, description) {
      return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color.error);
    }
    const checks = [
      {
        condition: userPower.power < paris,
        message: `Vous n'avez pas assez de Fragments pour initier ce duel avec une mise de **${paris}** ${emoji(
          emo.power
        )}.\n\n> Votre solde actuel est de **${userPower.power}** ${emoji(
          emo.power
        )}.`,
      },
      {
        condition: adversaryPower.power < paris,
        message: `${
          membre.username
        } n'a pas assez de Fragments pour accepter ce duel avec une mise de **${paris}** ${emoji(
          emo.power
        )}.\n\n> Son solde actuel est de **${userPower.power}** ${emoji(
          emo.power
        )}.`,
      },
      {
        condition: membre === interaction.user,
        message: `Vous ne pouvez pas initier un duel avec vous-même. (Bien essayé)`,
      },
      {
        condition: paris < 0,
        message: `Vous ne pouvez pas initier un duel avec une mise de ${paris} inférieur à 0 ${emoji(
          emo.power
        )}. (hé oui).`,
      },
    ];
    for (const check of checks) {
      if (check.condition) {
        const embed = createErrorEmbed("Erreur", check.message);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
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
      .setColor(colors);
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
        await message.edit({ components: [row] });
        const [winner, duelId] = await player.fightBattle(userId, membre.id);
        const powerChange = -paris;
        await Promise.all([
          player.updatePower(userId, powerChange),
          player.updatePower(membre.id, powerChange),
        ]);

        const parisMultiplier = 2;
        const parisWin = Math.floor(paris * 0.75 * parisMultiplier);
        const parisLose = Math.floor(paris * 0.25 * parisMultiplier);
        const parisDraw = Math.floor((paris / 2) * 1.02);
        const addGuildBank = Math.round(parisWin / 1.5);

        // Gestion de la banque de guilde
        let guildMessage = "";
        const stat = await dbManager.getStats(winner);
        if (stat.guildId) {
          await dbManager.addGuildBank(stat.guildId, addGuildBank);
          const guildInfo = await dbManager.getGuildInfo(stat.guildId);
          guildMessage = `**${addGuildBank}** ${emoji(
            emo.power
          )} ont été ajoutés à la banque de guilde de ${guildInfo.nom} **[${
            guildInfo.tag
          }]**`;
        }
        const powerUpdates = {
          [userId]: winner === userId ? parisWin : parisDraw,
          [membre.id]: winner === membre.id ? parisWin : parisDraw,
        };
        if (winner) {
          if (winner === userId || winner === membre.id) {
            powerUpdates[winner] = parisWin;
            powerUpdates[winner === userId ? membre.id : userId] = parisLose;
          }
        } else {
          powerUpdates[userId] = parisDraw;
          powerUpdates[membre.id] = parisDraw;
        }

        await Promise.all([
          player.updatePower(userId, powerUpdates[userId]),
          player.updatePower(membre.id, powerUpdates[membre.id]),
        ]);

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
            const [[duelDetail], [duelDetail2]] = await Promise.all([
              dbManager.getDuelDetails(duelId, userId),
              dbManager.getDuelDetails(duelId, membre.id),
            ]);

            const gainUserId =
              winner === userId
                ? parisWin
                : winner === membre.id
                ? -parisLose
                : parisDraw;

            const gainMembreId =
              winner === membre.id
                ? parisWin
                : winner === userId
                ? -parisLose
                : parisDraw;
            const [getStatOpponent, getStati] = await Promise.all([
              dbManager.getStats(membre.id),
              dbManager.getStats(userId),
            ]);

            const [getGuildi, getGuildOpponent] = await Promise.all([
              getStati.guildId
                ? dbManager.getGuildInfo(getStati.guildId)
                : Promise.resolve({ tag: "*pas de guilde*" }),
              getStatOpponent.guildId
                ? dbManager.getGuildInfo(getStatOpponent.guildId)
                : Promise.resolve({ tag: "*pas de guilde*" }),
            ]);
            const duelEmbed = new EmbedBuilder()
              .setTitle("Duel terminé")
              .setDescription(
                `Le duel entre <@${userId}> et <@${membre.id}> est terminé.\n- ${guildMessage}`
              )
              .addFields(
                {
                  name: `Détails de ${userName} **[${getGuildi.tag}]** `,
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
                  name: `Détails de ${membre.username} **[${getGuildOpponent.tag}]** `,
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
              .setColor(colors)
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

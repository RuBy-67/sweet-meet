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
const { options } = require("./info");
const e = require("express");
const player = new Player();

module.exports = {
  name: "caserne",
  description: "caserne et gestion de vos troupe / commandant",
  options: [
    {
      type: 1,
      name: "train",
      description: "Train des troupes",
      options: [
        {
          type: 3,
          name: "type",
          description: "Type de troupes",
          required: true,
          choices: [
            {
              name: "Infanterie",
              value: "infanterie",
            },
            {
              name: "Archer",
              value: "archer",
            },
            {
              name: "Cavalierie",
              value: "cavalierie",
            },
            {
              name: "Machine",
              value: "machine",
            },
          ],
        },
        {
          type: 3,
          name: "niveau",
          description: "Niveau des troupes",
          required: true,
          choices: [
            {
              name: "5",
              value: "5",
            },
            {
              name: "4",
              value: "4",
            },
            {
              name: "3",
              value: "3",
            },
            {
              name: "2",
              value: "2",
            },
            {
              name: "1",
              value: "1",
            },
          ],
        },
        {
          type: 4,
          name: "nombre",
          description: "Combien de troupes voulez-vous entrainer",
          required: true,
        },
      ],
    },
    {
      type: 1,
      name: "info", ///ok
      description: "info sur la caserne",
    },
    {
      type: 1,
      name: "default",
      description: "Armées par défaut", //! enregistré dans la db (4 par user)
    },
    {
      type: 1,
      name: "troops",
      description: "Gérer vos troupe (Améliorer)",
    },
    {
      type: 1,
      name: "détails",
      description: "Détail de votre caserne", //! niveau , détails des troupes, (bonus)
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
    const userId = interaction.user.id;
    const user = await dbManager.getStats(userId);
    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(color.error)
        .setDescription(
          `Vous n'avez pas encore commencé votre aventure. Tapez \`/createAccount\` pour commencer.`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const colors = await dbManager.getColor(interaction.user.id);
    const power = await dbManager.getPower(userId);
    const powerFr = power.toLocaleString("fr-FR", {
      useGrouping: true,
    });

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "info":
        async function createCaserneEmbed(user, caserneInfo) {
          const bonus = await dbManager.getBonus("caserne");
          const powerUpdate = await dbManager.getPower(userId);
          const formattedPower = powerUpdate.toLocaleString("fr-FR", {
            useGrouping: true,
          });
          const caserneLvl = caserneInfo[0].lvl;
          let priceUpgrade;
          if (caserneLvl >= 1 && caserneLvl <= 9) {
            priceUpgrade = caserneLvl * 2250;
          } else if (caserneLvl >= 10 && caserneLvl <= 21) {
            priceUpgrade = (caserneLvl - 9) * 4700 + 9 * 2250;
          } else if (caserneLvl >= 22 && caserneLvl <= 25) {
            priceUpgrade = (caserneLvl - 21) * 6500 + 12 * 4700 + 9 * 2250;
          }
          let farmableTroopLvl = 1;
          if (caserneLvl >= 7) {
            farmableTroopLvl = 2;
          }
          if (caserneLvl >= 13) {
            farmableTroopLvl = 3;
          }
          if (caserneLvl >= 20) {
            farmableTroopLvl = 4;
          }
          if (caserneLvl >= 25) {
            farmableTroopLvl = 5;
          }

          let bonus1 = bonus.bonus1 * caserneLvl;
          let bonus2 = caserneLvl >= 10 ? bonus.bonus2 * (caserneLvl - 6) : 0;
          let bonus3 = caserneLvl >= 22 ? bonus.bonus3 * (caserneLvl - 18) : 0;
          if (caserneLvl === 25) {
            bonus3 = Math.round(bonus3 * 1.6);
            bonus1 = Math.round(bonus1 * 1.3);
            bonus2 = Math.round(bonus2 * 1.4);
          }
          const priceUpgradeText =
            caserneLvl === 25 ? "Max" : `${priceUpgrade} ${emoji(emo.power)}`;
          //troupe en formation ?
          let trainingInfoString = "Aucune troupe en formation";
          if (caserneInfo[0].troopAmount > 0) {
            const troopType = caserneInfo[0].troopType;
            const troopLevel = caserneInfo[0].troopLevel;
            const troopAmount = caserneInfo[0].troopAmount;
            const endTime = caserneInfo[0].troopEndTime;
            const remainingTime = Math.floor(endTime / 1000);
            trainingInfoString = `**${troopAmount} ${troopType}(s) niveau ${troopLevel}** en formation. Fin <t:${endTime}:R>.`;
          }
          const baseCapacity = params.batiment.caserne.baseCapacity;
          const trainingCapacity = Math.round(
            baseCapacity + baseCapacity * (bonus1 / 100)
          );

          return new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Caserne ⚔️")
            .setColor(colors)
            .setImage(
              "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Ffc899c09-5ab1-4dcc-a949-9eb1ef7e0e97%2Fimage.png?table=block&id=65ab0b24-7a32-445a-b8c8-9ef070227dcc&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
            )
            .setDescription(
              "La caserne vous permet de former des troupes pour vos combats, de les améliorer et de set les matériaux de vos boss"
            )
            .addFields(
              {
                name: "Niveau de la caserne",
                value: `**${caserneLvl}/25**\n- Puissance Caserne : **${
                  params.batiment.basePower.caserne * caserneLvl
                }**\n- Niveau troupe max : **${farmableTroopLvl}/5**\n- Capacité d'entraînement : **${trainingCapacity}**`,
                inline: true,
              },
              {
                name: "Prix d'Amélioration",
                value: `**${priceUpgradeText}**`,
                inline: true,
              },
              {
                name: "Camps de Formation",
                value: trainingInfoString,
                inline: false,
              },
              {
                name: "Bonus Actuels",
                value:
                  `- **Bonus1 :** (Augmentation Capacité d’entraînement) **${bonus1}%**\n` +
                  (caserneLvl >= 10
                    ? `- **Bonus2 :** (Réduction du temps d’entraînement) **${bonus2}%**\n`
                    : "") +
                  (caserneLvl >= 22
                    ? `- **Bonus3 :** (Réduction du prix d’entraînement des troupes) **${bonus3}%**`
                    : ""),
                inline: false,
              }
            )
            .setFooter({
              text: `Demande de ${user.tag}`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            });
        }

        const caserneInfo = await dbManager.getCaserneInfo(userId);
        // Création de l'embed initial
        const caserneEmbed = await createCaserneEmbed(
          interaction.user,
          caserneInfo
        );

        // Ajout du bouton pour l'amélioration de la caserne
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("upgradeCaserne")
            .setLabel("Améliorer la Caserne")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(caserneInfo[0].lvl === 25)
        );

        // Envoi du message
        await interaction.reply({
          embeds: [caserneEmbed],
          components: [actionRow],
        });

        client.on("interactionCreate", async (interaction) => {
          if (!interaction.isButton()) return;

          const { customId } = interaction;

          if (customId === "upgradeCaserne") {
            const userId = interaction.user.id;

            const stats = await dbManager.getStats(userId); // Pour les fragments
            const caserne = await dbManager.getCaserneLvl(userId);
            const caserneLvl = caserne[0].lvl;

            // Calcul du prix d'amélioration
            let priceUpgrade;
            if (caserneLvl >= 1 && caserneLvl <= 9) {
              priceUpgrade = caserneLvl * 2500;
            } else if (caserneLvl >= 10 && caserneLvl <= 21) {
              priceUpgrade = (caserneLvl - 9) * 5500 + 9 * 2500;
            } else if (caserneLvl >= 22 && caserneLvl <= 25) {
              priceUpgrade = (caserneLvl - 21) * 8500 + 12 * 5500 + 9 * 2500;
            }

            // Vérification des fragments
            if (stats.fragments < priceUpgrade) {
              await interaction.reply({
                content: `Vous n'avez pas assez de fragments (${
                  stats.fragments
                } ${emoji(
                  emo.power
                )}) pour améliorer la Caserne ${priceUpgrade} ${emoji(
                  emo.power
                )}.`,
                ephemeral: true,
              });
              return;
            }

            // Mise à jour du niveau de la caserne
            const newCaserneLvl = caserneLvl + 1;
            if (newCaserneLvl > 25) {
              await interaction.reply({
                content: "La Caserne est déjà au niveau maximum.",
                ephemeral: true,
              });
              return;
            }

            await dbManager.updateCaserne(userId);
            await dbManager.updatePower(userId, -priceUpgrade);

            // Création de l'embed mis à jour
            const updatedCaserneEmbed = await createCaserneEmbed(
              interaction.user,
              caserneLvl
            );

            // Création d'un nouvel action row avec le bouton
            const newActionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("upgradeCaserne")
                .setLabel("Améliorer la Caserne")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(newCaserneLvl === 25)
            );

            // Réponse à l'interaction
            await interaction.update({
              embeds: [updatedCaserneEmbed],
              components: [newActionRow],
            });
          }
        });

      case "default":
      //! set un max de 4 armées par défaut par user

      case "troops":
      //! géré ses troupe (améliorer)

      case "détails":
      //! niveau , détails de sa carner et de ses troupes, + (bonus)

      case "train":
        const troopType = interaction.options.getString("type");
        const troopLevel = parseInt(interaction.options.getString("niveau"));
        const troopAmount = interaction.options.getInteger("nombre");
        const caserne = await dbManager.getCaserneInfo(userId);
        const bonus = await dbManager.getBonus("caserne");
        const stat = await dbManager.getStats(userId);

        const caserneLvl = caserne[0].lvl;

        // Calcul des bonus
        let bonus1 = bonus.bonus1 * caserneLvl;
        let bonus2 = caserneLvl >= 10 ? bonus.bonus2 * (caserneLvl - 6) : 0;
        let bonus3 = caserneLvl >= 22 ? bonus.bonus3 * (caserneLvl - 18) : 0;

        if (caserneLvl === 25) {
          bonus3 = Math.round(bonus3 * 1.6);
          bonus1 = Math.round(bonus1 * 1.3);
          bonus2 = Math.round(bonus2 * 1.4);
        }

        // Capacité d'entraînement de la caserne
        const baseCapacity = params.batiment.caserne.baseCapacity;
        const trainingCapacity = Math.round(
          baseCapacity + baseCapacity * (bonus1 / 100)
        );
        /*if (caserne.troopAmount + troopAmount > trainingCapacity) {*/
        if (caserne[0].troopAmount > 0) {
          const embedErrorCapacity = new EmbedBuilder()
            .setTitle("Entrainement en cours")
            .setDescription(
              `Vous avez déjà ${caserne[0].troopAmount} troupe(s) en formation.`
            )
            .setColor(color.error);

          return interaction.reply({
            embeds: [embedErrorCapacity],
            ephemeral: true,
          });
        }
        if (troopAmount > trainingCapacity) {
          // ! Création de l'embed pour la capacité dépassée
          const embedErrorCapacity = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${powerFr}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Erreur : Capacité dépassée")
            .setDescription(
              `Capacité d'entraînement dépassée. Maximum : **${trainingCapacity}** troupes.`
            )
            .setColor(color.error);

          return interaction.reply({
            embeds: [embedErrorCapacity],
            ephemeral: true,
          });
        }

        const trainingCost = {
          1: 10,
          2: 20,
          3: 30,
          4: 50,
          5: 80,
        };

        // Temps d'entraînement par niveau de troupe (en secondes)
        const trainingTime = {
          1: 12,
          2: 17,
          3: 22,
          4: 27,
          5: 37,
        };

        // Calcul du coût total avec bonus si applicable
        let totalCost = Math.round(trainingCost[troopLevel] * troopAmount);
        if (caserneLvl >= 22) {
          totalCost = Math.round(totalCost - totalCost * (bonus3 / 100));
        }

        // Calcul du temps total avec bonus si applicable
        let totalTime = trainingTime[troopLevel] * troopAmount;
        if (caserneLvl >= 10) {
          totalTime = totalTime - totalTime * (bonus2 / 100);
        }

        // Vérifier le niveau de la caserne pour chaque niveau de troupe
        if (
          (troopLevel === 2 && caserneLvl < 7) ||
          (troopLevel === 3 && caserneLvl < 13) ||
          (troopLevel === 4 && caserneLvl < 20) ||
          (troopLevel === 5 && caserneLvl < 25)
        ) {
          // ! Création de l'embed pour le niveau de caserne insuffisant
          const embedErrorLevel = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${powerFr}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Erreur : Niveau de caserne insuffisant")
            .setDescription(
              `Votre caserne doit être au niveau ${
                [7, 13, 20, 25][troopLevel - 2]
              } pour entraîner des troupes de niveau ${troopLevel}.`
            )
            .setColor(color.error);

          return interaction.reply({
            embeds: [embedErrorLevel],
            ephemeral: true,
          });
        }

        // Vérifier les fragments disponibles
        if (stat.fragments < totalCost) {
          const embedErrorFragments = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${powerFr}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Erreur : Fragments insuffisants")
            .setDescription(
              `Vous n'avez pas assez de fragments pour entraîner ces troupes. Coût requis : ${totalCost} ${emoji(
                emo.power
              )}.`
            )
            .setColor(color.error);

          return interaction.reply({
            embeds: [embedErrorFragments],
            ephemeral: true,
          });
        }

        // ! Création de l'embed pour confirmer l'entraînement
        const endTime = Date.now() + totalTime * 1000;

        const embedConfirmation = new EmbedBuilder()

          .setAuthor({
            name: `Puissance : ${powerFr}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle("Entraînement de troupes")
          /*.setThumbnail("")*/
          .setDescription(
            `Voulez vous commencer l'entraînement de **${troopAmount}** troupe(s) ${troopType}(s) niveau **${troopLevel}**.`
          )
          .addFields(
            {
              name: "Coût",
              value: `${totalCost} ${emoji(emo.power)}`,
              inline: true,
            },
            {
              name: "Temps d'entraînement",
              value: `<t:${Math.floor(endTime / 1000)}:R>`,
              inline: true,
            }
          )
          .setColor(colors);

        const rowTrain = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(
              `confirm_${userId}_${troopType}_${troopLevel}_${troopAmount}_${endTime}`
            )
            .setLabel("Confirmer")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`cancel_${userId}`)
            .setLabel("Annuler")
            .setStyle(ButtonStyle.Danger)
        );

        const replyMessage = await interaction.reply({
          embeds: [embedConfirmation],
          components: [rowTrain],
          fetchReply: true,
        });
        const filter = (i) => i.user.id === userId;
        const collector = replyMessage.createMessageComponentCollector({
          filter,
          time: 60000,
        }); // 60 secondes
        collector.on("collect", async (i) => {
          if (i.customId.startsWith("confirm")) {
            await dbManager.updatePower(userId, -totalCost);
            await dbManager.addTraining(
              userId,
              troopType,
              troopLevel,
              troopAmount,
              endTime / 1000
            );

            const embedSuccess = new EmbedBuilder()
              .setAuthor({
                name: `Puissance : ${powerFr}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle("Entraînement de troupes confirmé")
              .setDescription(
                `L'entraînement de ${troopAmount} troupe(s) ${troopType}(s) niveau ${troopLevel} a commencé\n\nFin le <t:${Math.floor(
                  endTime / 1000
                )}:f>.`
              )
              .setColor(colors);

            await i.update({
              embeds: [embedSuccess],
              components: [],
            });
          } else if (i.customId.startsWith("cancel")) {
            const embedCanceled = new EmbedBuilder()
              .setTitle("Entraînement annulé")
              .setDescription("L'entraînement des troupes a été annulé.")
              .setColor(color.error);

            await i.update({
              embeds: [embedCanceled],
              components: [],
            });
          }
        });

        collector.on("end", (collected) => {
          if (collected.size === 0) {
            const embedTimeout = new EmbedBuilder()
              .setTitle("Temps écoulé")
              .setDescription(
                "Le temps pour confirmer ou annuler l'entraînement est écoulé."
              )
              .setColor(color.error);

            replyMessage.edit({
              embeds: [embedTimeout],
              components: [],
              e,
            });
          }
        });

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

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
          name: "type", // ok
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
      options: [
        {
          type: 3,
          name: "type", // ok
          description: "Type d'action, nouvelle armée (max4) ou mise à jour",
          required: true,
          choices: [
            {
              name: "Update",
              value: "update",
            },
            {
              name: "Create",
              value: "create",
            },
            {
              name: "Delete",
              value: "delete",
            },
          ],
        },
        {
          type: 3,
          name: "armée",
          description: "Nom de l'armée",
          required: true,
          choices: [
            {
              name: "Armée 1",
              value: "armee1",
            },
            {
              name: "Armée 2",
              value: "armee2",
            },
            {
              name: "Armée 3",
              value: "armee3",
            },
            {
              name: "Armée 4",
              value: "armee4",
            },
          ],
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
      case "default":
        const armyName = interaction.options.getString("armée");
        const type = interaction.options.getString("type");
        const userId = interaction.user.id;
        switch (type) {
          case "create":

          case "update":
          case "delete":
            const detailArmy = await dbManager.getArmy(userId, armyName);
            const confirmationRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("confirmDelete")
                .setLabel("Oui")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("cancelDelete")
                .setLabel("Non")
                .setStyle(ButtonStyle.Secondary)
            );

            // Send a message asking for confirmation
            const msg = await interaction.reply({
              content: `Êtes-vous sûr de vouloir supprimer l'armée **${armyName}** ?`,
              components: [confirmationRow],
              ephemeral: true, // Set to true if you want to keep it private for the user
            });

            // Create a collector for button interactions
            const filter = (i) =>
              i.customId === "confirmDelete" || i.customId === "cancelDelete";
            const collector = msg.createMessageComponentCollector({
              filter,
              time: 15000, // 15 seconds to respond
            });

            collector.on("collect", async (i) => {
              if (i.user.id !== interaction.user.id) {
                return i.reply({
                  content: "Vous ne pouvez pas répondre à cette confirmation.",
                  ephemeral: true,
                });
              }

              if (i.customId === "confirmDelete") {
                // Execute the deleteArmy function when confirmed
                await dbManager.deleteArmy(userId, armyName);
                await i.update({
                  content: `L'armée **${armyName}** a été supprimée avec succès.`,
                  components: [], // Remove buttons after confirmation
                });
              } else if (i.customId === "cancelDelete") {
                // Cancel the deletion process
                await i.update({
                  content: "Suppression annulée.",
                  components: [], // Remove buttons after cancellation
                });
              }
            });

            // Handle the end of the interaction if the user doesn't respond in time
            collector.on("end", (collected) => {
              if (collected.size === 0) {
                msg.edit({
                  content:
                    "La suppression a expiré, aucune action n'a été effectuée.",
                  components: [],
                });
              }
            });
        }
        // Étape 1: Choix des Boss
        const bossList = await dbManager.getBossByUser(userId);
        const bossOptions = [];
        for (const boss of bossList) {
          const bossInfo = await dbManager.getBossInfo(boss.bossId);
          bossOptions.push({
            label: `${bossInfo[0].nom}`,
            description: `(Niveau ${boss.level})`,
            value: `${boss.bossId}`, // Assurez-vous d'utiliser boss.bossId comme valeur
          });
        }

        const embedBossSelection = new EmbedBuilder()
          .setTitle(`Sélectionnez les Boss pour l'armée "${armyName}"`)
          .setDescription("Veuillez choisir jusqu'à 2 boss pour cette armée.")
          .setColor(colors);

        const bossSelectionMenu = new StringSelectMenuBuilder()
          .setCustomId("select-boss")
          .setPlaceholder("Choisir les boss")
          .addOptions(bossOptions)
          .setMaxValues(2);

        await interaction.reply({
          embeds: [embedBossSelection],
          components: [new ActionRowBuilder().addComponents(bossSelectionMenu)],
          ephemeral: true,
        });

        const bossCollector =
          interaction.channel.createMessageComponentCollector({
            filter: (i) => i.customId === "select-boss" && i.user.id === userId,
            time: 60000,
          });

        bossCollector.on("collect", async (i) => {
          const selectedBossIds = i.values;
          const bossInfo = await dbManager.getBossInfoArray(selectedBossIds);

          const maxCapacity = Math.max(
            ...(await Promise.all(
              bossInfo.map(async (boss) => {
                const bossInfoUser = await dbManager.getBossByUserByBossId(
                  userId,
                  boss.id
                );
                return boss.capacity * bossInfoUser[0].level * 0.6;
              })
            ))
          );

          // Obtenez les troupes disponibles pour l'utilisateur
          const troops = await dbManager.getTroopsArray(userId);

          const troopOptions = troops.map((troop) => ({
            label: troop.name,
            value: troop.name,
          }));

          // Créez des boutons pour chaque type et niveau de troupe
          const createTroopButtons = (type, level) => {
            return [
              new ButtonBuilder()
                .setCustomId(`add-${type}Lvl${level}-1`)
                .setLabel(`+1 ${type} Lvl ${level}`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`add-${type}Lvl${level}-100`)
                .setLabel(`+100 ${type} Lvl ${level}`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`reset-${type}Lvl${level}`)
                .setLabel(`Reset ${type} Lvl ${level}`)
                .setStyle(ButtonStyle.Danger),
            ];
          };

          const troopButtonsRows = [];
          const troopTypes = ["archer", "chevalier", "infanterie", "machine"];
          const maxLevels = 5;

          troopTypes.forEach((type) => {
            for (let level = 1; level <= maxLevels; level++) {
              troopButtonsRows.push(createTroopButtons(type, level));
            }
          });

          // Pagination
          const createPaginationButtons = (page) => {
            const maxPages = Math.ceil(troopButtonsRows.length / 5);

            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`page-${page - 1}`)
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
              new ButtonBuilder()
                .setCustomId(`page-${page + 1}`)
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === maxPages)
            );

            return actionRow;
          };

          const updateMessageWithPagination = async (interaction, page) => {
            const start = (page - 1) * 5;
            const end = start + 5;
            const buttonsToShow = troopButtonsRows.slice(start, end);

            // Assurez-vous que chaque ActionRow contient des boutons ou des sélecteurs corrects
            const actionRow = new ActionRowBuilder();
            buttonsToShow.forEach((button) => actionRow.addComponents(button));

            await interaction.update({
              embeds: [embedTroopSelection],
              components: [
                actionRow, // Ajoutez seulement un ActionRow avec jusqu'à 5 composants
                createPaginationButtons(page), // Pagination boutons
              ],
            });
          };

          // Créez l'embed pour la sélection des troupes
          const embedTroopSelection = new EmbedBuilder()
            .setTitle(`Sélectionnez les Troupes pour l'armée "${armyName}"`)
            .setDescription(
              `Veuillez choisir les troupes dans la limite de la capacité maximale: ${maxCapacity}.`
            )
            .setColor(colors);

          // Envoi du message initial avec la première page
          await updateMessageWithPagination(i, 1);

          // Interaction pour la pagination
          const troopCollector = i.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 60000,
          });

          troopCollector.on("collect", async (troopInteraction) => {
            const [action, troopType, level, amount] =
              troopInteraction.customId.split("-");

            // Mise à jour de la construction de l'armée
            if (action === "add") {
              armyInConstruction[`${troopType}Lvl${level}`] += parseInt(
                amount,
                10
              );
            } else if (action === "reset") {
              armyInConstruction[`${troopType}Lvl${level}`] = 0;
            }

            const updatedEmbedTroopSelection = new EmbedBuilder()
              .setTitle(`Sélectionnez les Troupes pour l'armée "${armyName}"`)
              .setDescription(
                `Veuillez choisir les troupes dans la limite de la capacité maximale: ${maxCapacity}.`
              )
              .setColor(colors)
              .addFields({
                name: "Troupes sélectionnées",
                value:
                  Object.entries(armyInConstruction)
                    .filter(([key, value]) => value > 0)
                    .map(([key, value]) => `- ${key}: ${value}`)
                    .join("\n") || "Aucune troupe sélectionnée.",
              });

            await troopInteraction.update({
              embeds: [updatedEmbedTroopSelection],
              components: troopButtonsRows.slice(0, 5), // Always show the first 5 rows of buttons
            });
          });

          troopCollector.on("end", async () => {
            const embedConfirmation = new EmbedBuilder()
              .setTitle(`Confirmer l'armée "${armyName}"`)
              .setDescription(
                `Boss sélectionnés: ${selectedBossIds.join(
                  ", "
                )}\nTroupes sélectionnées: ${
                  Object.entries(armyInConstruction)
                    .filter(([key, value]) => value > 0)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ") || "Aucune troupe sélectionnée."
                }`
              )
              .setColor(colors);

            const confirmButton = new ButtonBuilder()
              .setCustomId("confirm-army")
              .setLabel("Confirmer")
              .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
              .setCustomId("cancel-army")
              .setLabel("Annuler")
              .setStyle(ButtonStyle.Danger);

            await i.followUp({
              embeds: [embedConfirmation],
              components: [
                new ActionRowBuilder().addComponents(
                  confirmButton,
                  cancelButton
                ),
              ],
              ephemeral: true,
            });

            const confirmationCollector =
              i.channel.createMessageComponentCollector({
                filter: (i) => i.user.id === userId,
                time: 60000,
              });

            confirmationCollector.on("collect", async (confirmInteraction) => {
              if (confirmInteraction.customId === "confirm-army") {
                await dbManager.insertArmy(
                  userId,
                  armyName,
                  selectedBossIds,
                  Object.entries(armyInConstruction)
                    .filter(([key, value]) => value > 0)
                    .map(([key, value]) => ({ type: key, quantity: value }))
                );

                await confirmInteraction.update({
                  content: "Votre armée a été définie avec succès.",
                  components: [],
                });
              } else if (confirmInteraction.customId === "cancel-army") {
                await confirmInteraction.update({
                  content: "L'opération a été annulée.",
                  components: [],
                });
              }
            });
          });
        });

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
          const troupeString = await dbManager.getTroops(userId, client);

          return new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Caserne ⚔️")
            .setColor(colors)
            .setImage(
              "https://media.discordapp.net/attachments/1246893100790448198/1285311938154332225/image3.png?ex=66e9cf85&is=66e87e05&hm=f10e53f678a0ef4e89fcdeae9ca0506833d59b7f73ea1b53dc5092a6f7eab535&=&format=webp&quality=lossless&width=608&height=608"
            )
            .setDescription(
              "La caserne vous permet de former des troupes pour vos combats, de les améliorer et de créer vos armée par défaut"
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
                name: "Vos Troupes",
                value: troupeString,
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

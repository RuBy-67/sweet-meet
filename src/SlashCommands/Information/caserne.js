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
            {
              name: "Details",
              value: "detail",
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
            const existingArmy = await dbManager.getArmyByName(
              userId,
              armyName
            );
            if (existingArmy.length > 0) {
              return interaction.reply({
                content: `L'armée "${armyName}" existe déjà.`,
                ephemeral: true,
              });
            }

            // Si l'armée n'existe pas, on passe au choix des boss
            const bossList = await dbManager.getBossByUser(userId);
            const bossOptions = [];
            for (const boss of bossList) {
              const bossInfo = await dbManager.getBossInfo(boss.bossId);
              bossOptions.push({
                label: `${bossInfo[0].nom}`,
                description: `(Niveau ${boss.level})`,
                value: `${boss.id}`,
              });
            }

            const embedBossSelection = new EmbedBuilder()
              .setTitle(`Sélectionnez les Boss pour l'armée "${armyName}"`)
              .setDescription(
                "Veuillez choisir jusqu'à 2 boss pour cette armée."
              )
              .setColor(colors);

            const bossSelectionMenu = new StringSelectMenuBuilder()
              .setCustomId("select-boss")
              .setPlaceholder("Choisir les boss")
              .addOptions(bossOptions)
              .setMaxValues(2);

            await interaction.reply({
              embeds: [embedBossSelection],
              components: [
                new ActionRowBuilder().addComponents(bossSelectionMenu),
              ],
              ephemeral: true,
            });

            const bossCollector =
              interaction.channel.createMessageComponentCollector({
                filter: (i) =>
                  i.customId === "select-boss" && i.user.id === userId,
                time: 60000,
              });

            bossCollector.on("collect", async (i) => {
              const selectedBossIds = i.values;

              // Sauvegarder les boss dans l'armée en construction
              await dbManager.insertArmyInConstruction(
                userId,
                armyName,
                selectedBossIds
              );

              await i.update({
                content: `Les boss ont été sélectionnés pour l'armée "${armyName}". Utilisez maintenant la commande "update" pour ajouter des troupes, vous avez un max de 4 armées`,
                components: [],
              });
            });

            break;
          case "detail":
            // Récupérer les informations de l'armée depuis la base de données
            const [armyDetails] = await dbManager.getTroopsForArmy(
              userId,
              armyName
            );

            // Filtrer les clés à exclure et obtenir les valeurs restantes qui sont supérieures à 0
            const filteredArmyDetails = Object.entries(armyDetails).filter(
              ([key, value]) =>
                !["id", "nom", "discordId", "boss1", "boss2"].includes(key) &&
                value > 0
            );

            // Calculer la capacité actuelle de l'armée
            const currentCapacity = filteredArmyDetails.reduce(
              (total, [_, value]) => total + value,
              0
            );

            // Détails des bosses
            const boss1Id = armyDetails.boss1;
            const boss2Id = armyDetails.boss2;
            const maxCapacityArmy = await dbManager.calculateMaxCapacity(
              userId,
              boss1Id,
              boss2Id
            );

            let bossDetails = "";

            // Récupérer les informations de boss 1
            if (boss1Id) {
              const boss1Level = await dbManager.getBossInfoByIdUnique(boss1Id); // Récupérer le niveau
              const boss1Info = await dbManager.getBossInfo(
                boss1Level[0].bossId
              ); // Récupérer les infos générales
              bossDetails += `- Boss 1: **${boss1Info[0].nom}**, Level: **${
                boss1Level[0].level
              }**/60\n__Type:__ ${
                params.troops.type[boss1Info[0].troopType]
              }\n`; // Ajouter les détails du boss 1
            }

            // Récupérer les informations de boss 2
            if (boss2Id) {
              const boss2Level = await dbManager.getBossInfoByIdUnique(boss2Id); // Récupérer le niveau
              const boss2Info = await dbManager.getBossInfo(
                boss2Level[0].bossId
              ); // Récupérer les infos générales
              bossDetails += `- Boss 2: **${boss2Info[0].nom}**, Level: **${
                boss2Level[0].level
              }**/60\n__Type:__ ${
                params.troops.type[boss2Info[0].troopType]
              }\n`; // Ajouter les détails du boss 2
            }

            // Créer une description des troupes dans l'armée
            const armyDescription =
              filteredArmyDetails.length > 0
                ? filteredArmyDetails
                    .map(([key, value]) => `- ${key}: **${value}**`)
                    .join("\n")
                : "Aucune troupe dans l'armée.";

            // Créer l'embed pour afficher les détails de l'armée
            const detailEmbed = new EmbedBuilder()
              .setTitle(`Détails de l'armée "${armyName}"`)
              .setDescription(
                `Capacité actuelle: **${currentCapacity}**/**${maxCapacityArmy}**\n${bossDetails}`
              )
              .addFields({
                name: "Troupes dans l'armée",
                value: armyDescription,
              })
              .setColor(colors);

            // Envoyer l'embed avec les détails à l'utilisateur
            await interaction.reply({ embeds: [detailEmbed] });
            break;

          case "update":
            // Récupérer l'armée en fonction du nom fourni
            const [armyToUpdate] = await dbManager.getArmyByName(
              userId,
              armyName
            );

            if (!armyToUpdate) {
              return interaction.reply({
                content: `L'armée "${armyName}" n'existe pas, veuillez d'abord la créer avec '/caserne default create'`,
                ephemeral: true,
              });
            }

            // Récupérer les boss de l'armée
            const boss1 = armyToUpdate.boss1;
            const boss2 = armyToUpdate.boss2;
            const maxCapacity = await dbManager.calculateMaxCapacity(
              userId,
              boss1,
              boss2
            );

            // Récupérer les troupes actuelles de l'armée
            const currentTroops = await dbManager.getTroopsForArmy(
              userId,
              armyName
            );
            const calculateTotalTroops = (army) => {
              // Initialiser le total à 0
              let total = 0;

              // Itérer sur chaque propriété de l'objet army
              for (const key in army) {
                // Vérifier si la clé correspond à une troupe (commence par "archer", "chevalier", "infanterie" ou "machine")
                if (
                  key.startsWith("archer") ||
                  key.startsWith("chevalier") ||
                  key.startsWith("infanterie") ||
                  key.startsWith("machine")
                ) {
                  // Additionner la quantité de la troupe
                  total += army[key];
                }
              }

              return total;
            };

            // Calculer le total des troupes
            const totalTroops = calculateTotalTroops(currentTroops);

            // Embed initial de sélection des troupes
            const embedTroopSelection = new EmbedBuilder()
              .setTitle(`Sélectionnez les Troupes pour l'armée "${armyName}"`)
              .setDescription(
                `Capacité maximale: ${maxCapacity}\nCurrent Troops: ${totalTroops}`
              )
              .setColor(colors);

            // Création du menu déroulant avec toutes les troupes et niveaux
            const currentInventory = await dbManager.getUserInventory(userId);

            const troopLevelOptions = [
              {
                label: "Archer Niveau 1",
                value: "archer-1",
                emoji: "🏹",
                key: "archerLvl1",
              },
              {
                label: "Archer Niveau 2",
                value: "archer-2",
                emoji: "🏹",
                key: "archerLvl2",
              },
              {
                label: "Archer Niveau 3",
                value: "archer-3",
                emoji: "🏹",
                key: "archerLvl3",
              },
              {
                label: "Archer Niveau 4",
                value: "archer-4",
                emoji: "🏹",
                key: "archerLvl4",
              },
              {
                label: "Archer Niveau 5",
                value: "archer-5",
                emoji: "🏹",
                key: "archerLvl5",
              },
              {
                label: "Chevalier Niveau 1",
                value: "chevalier-1",
                emoji: emo.horse,
                key: "chevalierLvl1",
              },
              {
                label: "Chevalier Niveau 2",
                value: "chevalier-2",
                emoji: emo.horse,
                key: "chevalierLvl2",
              },
              {
                label: "Chevalier Niveau 3",
                value: "chevalier-3",
                emoji: emo.horse,
                key: "chevalierLvl3",
              },
              {
                label: "Chevalier Niveau 4",
                value: "chevalier-4",
                emoji: emo.horse,
                key: "chevalierLvl4",
              },
              {
                label: "Chevalier Niveau 5",
                value: "chevalier-5",
                emoji: emo.horse,
                key: "chevalierLvl5",
              },
              {
                label: "Infanterie Niveau 1",
                value: "infanterie-1",
                emoji: emo.infant,
                key: "infanterieLvl1",
              },
              {
                label: "Infanterie Niveau 2",
                value: "infanterie-2",
                emoji: emo.infant,
                key: "infanterieLvl2",
              },
              {
                label: "Infanterie Niveau 3",
                value: "infanterie-3",
                emoji: emo.infant,
                key: "infanterieLvl3",
              },
              {
                label: "Infanterie Niveau 4",
                value: "infanterie-4",
                emoji: emo.infant,
                key: "infanterieLvl4",
              },
              {
                label: "Infanterie Niveau 5",
                value: "infanterie-5",
                emoji: emo.infant,
                key: "infanterieLvl5",
              },
              {
                label: "Machine Niveau 1",
                value: "machine-1",
                emoji: emo.machine,
                key: "machineLvl1",
              },
              {
                label: "Machine Niveau 2",
                value: "machine-2",
                emoji: emo.machine,
                key: "machineLvl2",
              },
              {
                label: "Machine Niveau 3",
                value: "machine-3",
                emoji: emo.machine,
                key: "machineLvl3",
              },
              {
                label: "Machine Niveau 4",
                value: "machine-4",
                emoji: emo.machine,
                key: "machineLvl4",
              },
              {
                label: "Machine Niveau 5",
                value: "machine-5",
                emoji: emo.machine,
                key: "machineLvl5",
              },
            ];
            const availableTroops = troopLevelOptions.filter(
              (option) => currentInventory[option.key] > 0
            );

            const levelSelectMenu = new StringSelectMenuBuilder()
              .setCustomId("select-troop-level")
              .setPlaceholder("Choisissez une troupe et son niveau")
              .addOptions(availableTroops);

            const levelSelectRow = new ActionRowBuilder().addComponents(
              levelSelectMenu
            );

            // Afficher l'embed avec le menu déroulant
            await interaction.reply({
              embeds: [embedTroopSelection],
              components: [levelSelectRow],
            });

            // Gestion des interactions de sélection de troupe
            const troopCollector =
              interaction.channel.createMessageComponentCollector({
                filter: (i) => i.user.id === userId,
                time: 60000,
              });

            troopCollector.on("collect", async (interaction) => {
              const [action, quantity, troopType, level] =
                interaction.customId.split("-");

              // Déterminer si l'interaction est pour sélectionner un type de troupe ou pour ajuster la quantité
              const isTroopSelection =
                interaction.customId === "select-troop-level";

              // Si c'est une sélection de type de troupe
              if (isTroopSelection) {
                const selectedValue = interaction.values[0];
                const [troopType, level] = selectedValue.split("-");
                const currentInventory = await dbManager.getUserInventory(
                  userId
                );
                const availableTroops =
                  currentInventory[`${troopType}Lvl${level}`];

                // Création des boutons de quantité
                const createQuantityButtons = (action, quantities) => {
                  return new ActionRowBuilder().addComponents(
                    ...quantities.map((qty) => {
                      const quantityStr = qty
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                      return new ButtonBuilder()
                        .setCustomId(`${action}-${qty}-${troopType}-${level}`)
                        .setLabel(
                          action === "add"
                            ? `+${quantityStr}`
                            : `-${quantityStr}`
                        )
                        .setStyle(
                          action === "add"
                            ? ButtonStyle.Primary
                            : ButtonStyle.Danger
                        )
                        .setDisabled(
                          action === "add" ? availableTroops < qty : false
                        );
                    })
                  );
                };

                const addQuantities = [0];
                const quantityButtonsRowMore = createQuantityButtons(
                  "add",
                  addQuantities
                );

                // Mise à jour de l'embed avec les boutons de quantité
                await interaction.update({
                  embeds: [embedTroopSelection],
                  components: [quantityButtonsRowMore],
                });
              } else if (action && quantity && troopType && level) {
                const quantityValue = parseInt(quantity, 10);

                // Fonction pour obtenir le total des troupes dans l'armée en construction
                function getTotalTroops(armyInConstruction) {
                  return Object.values(armyInConstruction).reduce(
                    (total, qty) => total + qty,
                    0
                  );
                }

                // Récupération de l'inventaire de l'utilisateur
                const currentInventory = await dbManager.getUserInventory(
                  userId
                );
                const availableTroops =
                  currentInventory[`${troopType}Lvl${level}`];

                // Quantité actuelle de troupes de ce type dans l'armée en construction
                const currentKey = `${troopType}Lvl${level}`;
                const currentArmyTroops = currentInventory[currentKey] || 0;

                // Vérification de l'action d'ajout
                if (action === "add") {
                  // Vérifiez si l'utilisateur a assez de troupes et s'il dépasse la capacité
                  if (quantityValue > availableTroops) {
                    return interaction.update({
                      content: `Vous avez ${availableTroops} ${troopType} de niveau ${level} dans votre inventaire.`,
                      components: [],
                    });
                  }

                  if (
                    getTotalTroops(currentInventory) + quantityValue >
                    maxCapacity
                  ) {
                    return interaction.update({
                      content: `La capacité maximale de l'armée est de ${maxCapacity}.`,
                      components: [],
                    });
                  }

                  // Mettre à jour la base de données pour retirer les troupes de l'inventaire
                  await dbManager.updateUserTroops(
                    userId,
                    troopType,
                    level,
                    -quantityValue
                  );
                  // Ajouter ces troupes à l'armée de l'utilisateur
                  await dbManager.updateUserArmy(
                    userId,
                    armyName,
                    troopType,
                    level,
                    quantityValue
                  );
                } else if (action === "remove") {
                  // Vérifiez si l'utilisateur peut retirer les troupes
                  if (quantityValue > currentArmyTroops) {
                    return interaction.update({
                      content: `Vous ne pouvez pas retirer plus de troupes que vous n'en avez actuellement dans l'armée (${currentArmyTroops} disponibles).`,
                      components: [],
                    });
                  }

                  // Mettre à jour la base de données pour retirer les troupes de l'armée
                  await dbManager.updateUserArmy(
                    userId,
                    armyName,
                    troopType,
                    level,
                    -quantityValue
                  );
                  // Remettre ces troupes dans l'inventaire de l'utilisateur
                  await dbManager.updateUserTroops(
                    userId,
                    troopType,
                    level,
                    quantityValue
                  );
                }

                // Récupérer à nouveau l'inventaire mis à jour depuis la base de données
                const updatedInventory = await dbManager.getUserInventory(
                  userId
                );
                const [army] = await dbManager.getTroopsForArmy(
                  userId,
                  armyName
                );
                const filteredArmy = Object.entries(army).filter(
                  ([key, value]) =>
                    !["id", "nom", "discordId", "boss1", "boss2"].includes(
                      key
                    ) && value > 0
                );
                const currentCapacity = filteredArmy.reduce(
                  (total, [key, value]) => total + value,
                  0
                );

                // Mise à jour de l'embed avec les troupes actuelles
                const updatedEmbedTroopSelection = new EmbedBuilder()
                  .setTitle(
                    `Sélection ${troopType} lvl${level} pour l' ${armyName}`
                  )
                  .setDescription(
                    `Capacité maximale: **${maxCapacity}**\nCapacité actuelle: **${currentCapacity}**`
                  )
                  .addFields(
                    {
                      name: "Troupes Disponibles",
                      value:
                        Object.entries(updatedInventory)
                          .filter(([key, value]) => value > 0)
                          .map(([key, value]) => `- ${key}: **${value}**`)
                          .join("\n") || "Aucune troupe disponible.",
                    },
                    {
                      name: "Troupes dans l'armée",
                      value:
                        filteredArmy.length > 0
                          ? filteredArmy
                              .map(([key, value]) => `- ${key}: **${value}**`)
                              .join("\n")
                          : "Aucune troupe sélectionnée.",
                    }
                  )
                  .setColor(colors);

                // Boutons de retrait dynamiques
                const quantityButtonsRowLess =
                  new ActionRowBuilder().addComponents(
                    ...[1, 100, 1000, 10000, 100000].map((q) =>
                      new ButtonBuilder()
                        .setCustomId(`remove-${q}-${troopType}-${level}`)
                        .setLabel(`-${q}`)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(updatedInventory[currentKey] < q)
                    )
                  );

                // Boutons d'ajout dynamiques
                const quantityButtonsRowMore =
                  new ActionRowBuilder().addComponents(
                    ...[1, 100, 1000, 10000, 100000].map((q) =>
                      new ButtonBuilder()
                        .setCustomId(`add-${q}-${troopType}-${level}`)
                        .setLabel(`+${q}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(
                          updatedInventory[`${troopType}Lvl${level}`] < q
                        )
                    )
                  );

                // Bouton de confirmation et changement de type de troupe
                const changeTroopTypeButton = new ButtonBuilder()
                  .setCustomId("change-troop-type")
                  .setLabel("Changer le type de troupe")
                  .setStyle(ButtonStyle.Secondary);

                const confirmRow = new ActionRowBuilder().addComponents(
                  changeTroopTypeButton
                );

                await interaction.update({
                  embeds: [updatedEmbedTroopSelection],
                  components: [
                    quantityButtonsRowMore,
                    quantityButtonsRowLess,
                    confirmRow,
                  ],
                });
              }
            });

            // Gestion de la confirmation et du changement de type de troupe
            troopCollector.on("collect", async (interaction) => {
              if (interaction.customId === "change-troop-type") {
                await interaction.update({
                  content: "Pour le moment refaite la commande",
                  embeds: [],
                  components: [],
                });
              }
            });

            // Confirmation de la fin de la sélection de troupe
            troopCollector.on("end", async () => {
              await interaction.editReply({
                content: "Sélection de troupes terminée.",
                components: [],
              });
            });
            break;

          case "delete":
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

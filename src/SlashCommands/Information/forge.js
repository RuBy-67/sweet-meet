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
const player = new Player();
const Boss = require("../../class/bossManager");
const bossManager = new Boss();

module.exports = {
  name: "forge",
  description: "forge",
  options: [
    {
      type: 1,
      name: "sell",
      description: "Vendre un objet dans la boutique",
      options: [
        {
          type: 3,
          name: "ou",
          description: "Choisissez ou vendre votre matériel",
          required: true,
          choices: [
            {
              name: "Boutique",
              value: "boutique",
            },
            {
              name: "Marchand",
              value: "marchand",
            },
          ],
        },
      ],
    },
    {
      type: 1,
      name: "upgrade",
      description: "Ameliorer un matériau",
      options: [
        {
          type: 3,
          name: "quoi",
          description: "Choisissez quoi upgrader",
          required: true,
          choices: [
            {
              name: "materiau",
              value: "materiau",
            },
            {
              name: "forge",
              value: "forge",
            },
          ],
        },
      ],
    },
    {
      type: 1,
      name: "activatepotion",
      description: "Activer une potion pour le combat",
    },

    {
      type: 1,
      name: "setmateriaux",
      description: "Mettre actif un materiau pour le combat",
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
    const colors = await dbManager.getColor(interaction.user.id);
    const userId = interaction.user.id;
    const power = await dbManager.getPower(userId);

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "sell":
        const sellOption = interaction.options.getString("ou");
        const userMaterials = await dbManager.getMateriauByUserId(
          interaction.user.id
        );
        const filteredMaterials = userMaterials.filter(
          (material) => material.etat !== 1
        );

        if (userMaterials.length === 0) {
          const noMaterialsEmbed = new EmbedBuilder()
            .setAuthor({
              name:
                "Puissance : " +
                power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Boutique - Vente")
            .setColor(color.error)
            .setDescription("Vous ne possédez aucun matériau à vendre.")
            .setThumbnail(
              "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
            )
            .setFooter({
              text: `Demandé(e) par ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });
          return interaction.reply({ embeds: [noMaterialsEmbed] });
        }
        switch (sellOption) {
          case "boutique":
            const embed = new EmbedBuilder()
              .setAuthor({
                name:
                  "Puissance : " +
                  power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle("Boutique - Vente")
              .setColor(colors)
              .setThumbnail(
                "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
              )
              .setDescription(
                "Choisissez un objet à vendre dans la liste ci-dessous, *Les matériaux équipés ne sont pas vendable.*"
              )
              .setFooter({
                text: `Demandé(e) par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              });

            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("sell_select")
                .setPlaceholder("Choisissez un objet à vendre")
                .setMaxValues(1)
                .addOptions(
                  ...userMaterials.map((material) => ({
                    emoji: emo[material.nom] || `❔`,
                    label: `${material.nom} => lvl: ${material.level}`,
                    description: `Prix: ${Math.floor(
                      params.boutique.vente.prix.materiaux[material.rarete] *
                        material.level *
                        1.6
                    )}`,
                    value: `${material.mid}_${material.materiauId}_${material.level}`,
                  }))
                )
            );

            await interaction.reply({
              embeds: [embed],
              components: [row],
              ephemeral: true,
            });

            const filter = (i) =>
              i.customId === "sell_select" && i.user.id === interaction.user.id;
            const collector =
              interaction.channel.createMessageComponentCollector({
                filter,
                time: 60000,
              });

            collector.on("collect", async (i) => {
              collector.stop();

              const [idUnique, idMateriau, level] = i.values[0].split("_");
              const [selectedMaterial] = await dbManager.getDataMateriauById(
                idMateriau
              );

              const confirmationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("confirm")
                  .setLabel("Valider")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId("cancel")
                  .setLabel("Refuser")
                  .setStyle(ButtonStyle.Danger)
              );

              await i.update({
                content: `Êtes-vous sûr de vendre **${
                  selectedMaterial.nom
                }** pour ${Math.floor(
                  params.boutique.vente.prix.materiaux[
                    selectedMaterial.rarete
                  ] *
                    level *
                    1.6
                )} ${emoji(emo.power)} ?`,
                components: [confirmationRow],
                embeds: [],
                ephemeral: true,
              });

              const confirmFilter = (btnInt) =>
                btnInt.user.id === interaction.user.id &&
                (btnInt.customId === "confirm" || btnInt.customId === "cancel");

              const confirmationCollector =
                interaction.channel.createMessageComponentCollector({
                  confirmFilter,
                  time: 30000,
                });

              confirmationCollector.on("collect", async (btnInt) => {
                confirmationCollector.stop();

                if (btnInt.customId === "confirm") {
                  const prix = Math.floor(
                    params.boutique.vente.prix.materiaux[
                      selectedMaterial.rarete
                    ] *
                      level *
                      1.6
                  );
                  await dbManager.removeMaterialFromUser(idUnique);
                  await dbManager.updatePower(i.user.id, prix);
                  await btnInt.update({
                    content: `La vente de **${
                      selectedMaterial.nom
                    }** a été effectuée avec succès pour ${prix} ${emoji(
                      emo.power
                    )}.`,
                    components: [],
                    embeds: [],
                    ephemeral: true,
                  });
                } else {
                  await btnInt.update({
                    content: "Vente annulée.",
                    components: [],
                    embeds: [],
                    ephemeral: true,
                  });
                }
              });

              confirmationCollector.on("end", async (collected) => {
                if (collected.size === 0) {
                  await i.update({
                    content: "Temps écoulé, vente annulée.",
                    components: [],
                    embeds: [],
                    ephemeral: true,
                  });
                }
              });
            });

            collector.on("end", async (collected) => {
              if (collected.size === 0) {
                await interaction.followUp({
                  content: "Temps écoulé, vente annulée.",
                  components: [],
                  embeds: [],
                  ephemeral: true,
                });
              }
            });
          case "marchand":
            const userInfo = await dbManager.getStats(interaction.user.id);
            if (!userInfo.guildId) {
              return interaction.reply({
                content:
                  "Vous devez rejoindre une guilde pour accéder au Marchand.",
                ephemeral: true,
              });
            }
            const userMarchandId = await dbManager.getGuildById(
              userInfo.guildId
            );
            if (!userMarchandId[0].marchand) {
              return interaction.reply({
                content: "Le Marchand n'est pas disponible dans votre guilde.",
                ephemeral: true,
              });
            }
            const marchandId = userMarchandId[0].marchand;

            const embedMarchand = new EmbedBuilder()
              .setAuthor({
                name:
                  "Puissance : " +
                  power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle("Boutique - Vente")
              .setColor(colors)
              .setThumbnail(
                "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
              )
              .setDescription(
                "Choisissez un objet à vendre au marchand dans la liste ci-dessous"
              )
              .setFooter({
                text: `Demandé(e) par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              });

            const rowMarchand = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("sell_select")
                .setPlaceholder("Choisissez un objet à vendre")
                .setMaxValues(1)
                .addOptions(
                  ...filteredMaterials.map((material) => ({
                    emoji: emo[material.nom] || `❔`,
                    label: `${material.nom} => lvl: ${material.level}`,
                    description: `Prix: ${Math.floor(
                      params.boutique.vente.prix.materiaux[material.rarete] *
                        material.level *
                        1.2
                    )}`,
                    value: `${material.mid}_${material.materiauId}_${material.level}`,
                  }))
                )
            );

            const message = await interaction.reply({
              embeds: [embedMarchand],
              components: [rowMarchand],
            });
            const filterMarchand = (i) =>
              i.customId === "sell_select" && i.user.id === interaction.user.id;
            const collectorMarchand =
              interaction.channel.createMessageComponentCollector({
                filterMarchand,
                time: 60000,
              });

            collectorMarchand.on("collect", async (i) => {
              collectorMarchand.stop();

              const [idUnique, idMateriau, level] = i.values[0].split("_");
              const [selectedMaterial] = await dbManager.getDataMateriauById(
                idMateriau
              );

              const confirmationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("confirm")
                  .setLabel("Valider")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId("cancel")
                  .setLabel("Refuser")
                  .setStyle(ButtonStyle.Danger)
              );

              await i.update({
                content: `Êtes-vous sûr de vendre **${emoji(
                  emo[selectedMaterial.nom]
                )} ${selectedMaterial.nom}** pour ${Math.floor(
                  params.boutique.vente.prix.materiaux[
                    selectedMaterial.rarete
                  ] *
                    level *
                    1.2
                )} ${emoji(emo.power)} ?`,
                components: [confirmationRow],
                embeds: [],
                ephemeral: true,
              });

              const confirmFilterMarchand = (btnInt) =>
                btnInt.user.id === interaction.user.id &&
                (btnInt.customId === "confirm" || btnInt.customId === "cancel");

              const confirmationCollectorMarchand =
                interaction.channel.createMessageComponentCollector({
                  confirmFilterMarchand,
                  time: 30000,
                });

              confirmationCollectorMarchand.on("collect", async (btnInt) => {
                confirmationCollectorMarchand.stop();

                if (btnInt.customId === "confirm") {
                  const prix = Math.floor(
                    params.boutique.vente.prix.materiaux[
                      selectedMaterial.rarete
                    ] *
                      level *
                      1.2
                  );
                  const merchantRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId("accept_sale")
                      .setLabel("Accepter l'offre")
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId("decline_sale")
                      .setLabel("Refuser l'offre")
                      .setStyle(ButtonStyle.Danger)
                  );
                  // Envoyer un nouvel embed au marchand avec les détails de l'objet vendu
                  const merchantEmbed = new EmbedBuilder()
                    .setAuthor({
                      name:
                        "Puissance : " +
                        power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
                      iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                      }),
                    })
                    .setTitle("Offre de vente")
                    .setColor(colors)
                    .setThumbnail(
                      "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
                    )
                    .setDescription(
                      `**${interaction.user.tag}** souhaite vendre **${emoji(
                        emo[selectedMaterial.nom]
                      )} ${selectedMaterial.nom}** pour **${prix}** ${emoji(
                        emo.power
                      )}.`
                    )
                    .setFooter({
                      text: `Demandé(e) par ${interaction.user.tag}`,
                      iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                      }),
                    });
                  await btnInt.update({
                    content: `<@${marchandId}>`,
                    embeds: [merchantEmbed],
                    components: [merchantRow],
                  });

                  const newFilter = (interaction) =>
                    interaction.user.id === marchandId;

                  const collectorSell = message.createMessageComponentCollector(
                    {
                      newFilter,
                      time: 60000,
                    }
                  );

                  collectorSell.on("collect", async (interaction) => {
                    if (interaction.customId === "accept_sale") {
                      await dbManager.updateMateriauxOwner(
                        marchandId,
                        idUnique
                      );
                      await dbManager.updatePower(userId, prix);
                      await dbManager.updatePower(marchandId, -prix);
                      return interaction.update({
                        content: `La vente de **${emoji(
                          emo[selectedMaterial.nom]
                        )} ${selectedMaterial.nom} - [lvl: **${
                          selectedMaterial.lvl
                        }**] a été effectuée avec succès pour **${prix}** ${emoji(
                          emo.power
                        )}. à <@${marchandId}>`,
                        components: [],
                        embeds: [],
                      });
                    } else {
                      return interaction.update({
                        content: "Vente refusé.",
                        components: [],
                        embeds: [],
                      });
                    }
                  });
                } else {
                  await btnInt.update({
                    content: "Vente annulée.",
                    components: [],
                    embeds: [],
                    ephemeral: true,
                  });
                }
              });
            });
          default:
            return interaction.reply({
              content: "Commande slash invalide.",
              ephemeral: true,
            });
        }
      case "upgrade":
        const upgradeOption = interaction.options.getString("quoi");

        switch (upgradeOption) {
          case "materiau":
            async function componentMaterial() {
              const ownedMaterials = await dbManager.getMateriauByUserId(
                userId
              );

              let componentMaterial = [];

              if (ownedMaterials.length > 0) {
                const options = await Promise.all(
                  ownedMaterials.map(async (material) => {
                    const emoji = emo[material.nom];

                    const priceUpgrade = await dbManager.calculateUpgradePrice(
                      material,
                      material,
                      userId
                    );

                    const label = (material.level = 5
                      ? `${material.nom} (lvl: ${material.level}) Up : Max`
                      : `${material.nom} (lvl: ${material.level}) Up: ${priceUpgrade} Fragments`);

                    const value = material.mid.toString();

                    return new StringSelectMenuOptionBuilder()
                      .setEmoji(emoji)
                      .setLabel(label)
                      .setValue(value);
                  })
                );

                // Ajoute les options résolues au sélecteur
                const selectMenu = new StringSelectMenuBuilder()
                  .setCustomId("material_select")
                  .setPlaceholder("Sélectionner un matériau à améliorer")
                  .setMaxValues(1)
                  .addOptions(options);

                // Crée une ligne d'action et ajoute le sélecteur
                const actionRow = new ActionRowBuilder().addComponents(
                  selectMenu
                );
                componentMaterial.push(actionRow);
              }

              return componentMaterial;
            }
            const upgradeEmbed = new EmbedBuilder()
              .setAuthor({
                name:
                  "Puissance : " +
                  power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle("Amélioration de matériaux")
              .setColor(colors)
              .setDescription(
                `- **Facteurs :**\n\n> Nombre de matériaux possédés\n> Niveaux des matériaux\n> Types des matériaux\n> Raretés des matériaux\n\n*Améliorer un matériau apportera une amélioration des bonus du matériau.*\n\n> *--> Sélectionnez un matériau à améliorer*`
              )
              .setThumbnail(
                "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
              )
              .setFooter({
                text: `Demandé(e) par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              });

            // Envoie l'embed d'amélioration avec les matériaux disponibles
            await interaction.reply({
              embeds: [upgradeEmbed],
              components: await componentMaterial(),
              ephemeral: true,
              fetchReply: true,
            });

            // Gestionnaire des sélections de matériaux
            const collectorUp =
              interaction.channel.createMessageComponentCollector({
                filter: (it) =>
                  it.user.id === userId && it.customId === "material_select", // Filtre les interactions pour le bon utilisateur et la bonne sélection
                time: 72000,
              });

            collectorUp.on("collect", async (it) => {
              const selectedMaterials = it.values;
              const selectedMaterialId = selectedMaterials[0];

              if (it.customId === "material_select") {
                const stats = await player.getStats(userId); // Récupère les statistiques du joueur
                const fragment = stats.fragment;
                const materialData = await dbManager.getIdMateriauByIdUnique(
                  selectedMaterialId //muID
                ); // dans materiaux User
                const material = await dbManager.getDataMateriauById(
                  materialData[0].materiauId
                );
                if (materialData[0].level === 5) {
                  return it.reply({
                    content: "Matériau déjà au niveau maximum.",
                    ephemeral: true,
                  });
                }

                // Calcule le prix d'amélioration du matériau sélectionné
                const priceUpgrade = await dbManager.calculateUpgradePrice(
                  material[0],
                  materialData[0],
                  userId
                );

                const ErrorEmbed = new EmbedBuilder();
                ErrorEmbed.setTitle("Erreur");
                ErrorEmbed.setColor(color.error);

                const newLevel = materialData[0].level + 1;

                if (newLevel > params.maxLevel) {
                  ErrorEmbed.setDescription(
                    `Le niveau maximal pour ${emoji(emo[material[0].nom])} **${
                      material[0].nom
                    }** est atteint. max : **(${
                      params.maxLevel
                    })**\n\n**Sélectionnez un matériau à améliorer**`
                  );
                  return it.update({
                    embeds: [ErrorEmbed],
                    components: await componentMaterial(ownedMaterials),
                  });
                }

                if (fragment < priceUpgrade) {
                  ErrorEmbed.setDescription(
                    `Vous n'avez pas assez de Fragments pour améliorer ${emoji(
                      emo[material[0].nom]
                    )} **${
                      material[0].nom
                    }**.\n(Prix: **${priceUpgrade}**) ${emoji(
                      emo.power
                    )}\n**Vous avez :** ${power} ${emoji(emo.power)}`
                  );
                  return it.update({
                    embeds: [ErrorEmbed],
                    components: await componentMaterial(ownedMaterials),
                  });
                }

                const upgrade = await dbManager.updateMaterialLevel(
                  userId,
                  selectedMaterialId
                );

                if (upgrade) {
                  const UpgradeEmbed = new EmbedBuilder();
                  UpgradeEmbed.setTitle("Amélioration de matériaux");
                  UpgradeEmbed.setColor(colors);
                  UpgradeEmbed.setDescription(
                    `Le matériau ${emoji(emo[material[0].nom])} **${
                      material[0].nom
                    }** a été amélioré au niveau **${newLevel}**.\n*Sélectionnez le matériau à améliorer*`
                  );

                  await dbManager.updatePower(userId, -priceUpgrade);
                  return it.update({
                    embeds: [UpgradeEmbed],
                    components: await componentMaterial(ownedMaterials),
                  });
                } else {
                  return it.reply({
                    content: "Erreur lors de l'amélioration du matériau.",
                    ephemeral: true,
                  });
                }
              }
            });

            collectorUp.on("end", (collected, reason) => {
              if (reason === "time") {
                interaction.followUp({
                  content: "La sélection est terminée car le délai a expiré.",
                  ephemeral: true,
                });
              }
            });
            break;

          case "forge":
            async function createForgeEmbed(user, forgeLvl) {
              const bonus = await dbManager.getBonus("forge");
              const powerUpdate = await dbManager.getPower(userId);
              const formattedPower = powerUpdate.toLocaleString("fr-FR", {
                useGrouping: true,
              });
              let priceUpgrade;
              if (forgeLvl >= 1 && forgeLvl <= 9) {
                priceUpgrade = forgeLvl * 2500;
              } else if (forgeLvl >= 10 && forgeLvl <= 21) {
                priceUpgrade = (forgeLvl - 9) * 5500 + 9 * 2500;
              } else if (forgeLvl >= 22 && forgeLvl <= 25) {
                priceUpgrade = (forgeLvl - 21) * 8500 + 12 * 5500 + 9 * 2500;
              }
              let bonus1 = bonus.bonus1 * forgeLvl;
              let bonus2 = forgeLvl >= 10 ? bonus.bonus2 * (forgeLvl - 7) : 0;
              let bonus3 = forgeLvl >= 22 ? bonus.bonus3 * (forgeLvl - 17) : 0;
              if (forgeLvl === 25) {
                bonus3 = Math.round(bonus3 * 1.8);
                bonus1 = Math.round(bonus1 * 1.2);
                bonus2 = Math.round(bonus2 * 1.5);
              }
              const priceUpgradeText =
                forgeLvl === 25 ? "Max" : `${priceUpgrade} ${emoji("power")}`;

              return new EmbedBuilder()
                .setAuthor({
                  name: `Puissance : ${formattedPower}`,
                  iconURL: user.displayAvatarURL({ dynamic: true }),
                })
                .setTitle("Forge 🔨")
                .setColor(colors)
                .setImage(
                  "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2Fd4d4a858-714f-4169-80c8-db72f5668623%2Fimage.png?table=block&id=bfe5b700-6789-46e9-a890-cb80c3f5295f&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
                )
                .setDescription(
                  "La forge vous permet d'améliorer vos matériaux, d'en fabriquer et de les vendre."
                )
                .addFields(
                  {
                    name: "Niveau de la Forge",
                    value: `**${forgeLvl}/25**`,
                    inline: true,
                  },
                  {
                    name: "Prix d'Amélioration",
                    value: `**${priceUpgradeText}**`,
                    inline: true,
                  },
                  {
                    name: "Bonus Actuels",
                    value:
                      `- **Bonus1 :** (Réduction du prix en boutique) **${bonus1}%**\n` +
                      (forgeLvl >= 10
                        ? `- **Bonus2 :** (Temps de fabrication des matériaux réduit) **${bonus2}%**\n`
                        : "") +
                      (forgeLvl >= 22
                        ? `- **Bonus3 :** (Augmente la chance de trouver des matériaux rares ou autres avantages) **${bonus3}%**`
                        : ""),
                    inline: false,
                  }
                )
                .setFooter({
                  text: `Demande de ${user.tag}`,
                  iconURL: user.displayAvatarURL({ dynamic: true }),
                });
            }

            const forgeLvl = await dbManager.getForgeLvl(userId);
            // Création de l'embed initial
            const forgeEmbed = await createForgeEmbed(
              interaction.user,
              forgeLvl[0].lvl
            );

            // Ajout du bouton pour l'amélioration de la forge
            const actionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("upgradeForge")
                .setLabel("Améliorer la Forge")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(forgeLvl[0].lvl === 25)
            );

            // Envoi du message
            await interaction.reply({
              embeds: [forgeEmbed],
              components: [actionRow],
            });

            client.on("interactionCreate", async (interaction) => {
              if (!interaction.isButton()) return;

              const { customId } = interaction;

              if (customId === "upgradeForge") {
                console.log("Upgrade Forge");
                const userId = interaction.user.id;

                const stats = await dbManager.getStats(userId); // Pour les fragments
                const forge = await dbManager.getForgeLvl(userId);
                const forgeLvl = forge[0].lvl;

                // Calcul du prix d'amélioration
                let priceUpgrade;
                if (forgeLvl >= 1 && forgeLvl <= 9) {
                  priceUpgrade = forgeLvl * 2500;
                } else if (forgeLvl >= 10 && forgeLvl <= 21) {
                  priceUpgrade = (forgeLvl - 9) * 5500 + 9 * 2500;
                } else if (forgeLvl >= 22 && forgeLvl <= 25) {
                  priceUpgrade = (forgeLvl - 21) * 8500 + 12 * 5500 + 9 * 2500;
                }

                // Vérification des fragments
                if (stats.fragments < priceUpgrade) {
                  await interaction.reply({
                    content: `Vous n'avez pas assez de fragments (${
                      stats.fragments
                    } ${emoji(
                      emo.power
                    )}) pour améliorer la forge ${priceUpgrade} ${emoji(
                      emo.power
                    )}.`,
                    ephemeral: true,
                  });
                  return;
                }

                // Mise à jour du niveau de la forge
                const newForgeLvl = forgeLvl + 1;
                if (newForgeLvl > 25) {
                  await interaction.reply({
                    content: "La forge est déjà au niveau maximum.",
                    ephemeral: true,
                  });
                  return;
                }

                await dbManager.updateForge(userId);
                await dbManager.updatePower(userId, -priceUpgrade);

                // Création de l'embed mis à jour
                const updatedForgeEmbed = await createForgeEmbed(
                  interaction.user,
                  newForgeLvl
                );

                // Création d'un nouvel action row avec le bouton
                const newActionRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("upgradeForge")
                    .setLabel("Améliorer la Forge")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(forgeLvl[0].lvl === 25)
                );

                // Réponse à l'interaction
                await interaction.update({
                  embeds: [updatedForgeEmbed],
                  components: [newActionRow],
                });
              }
            });
        }
      case "setmateriaux":
        const materials = await player.getMaterialsByIdEtat0(userId);
        const userIdMaterials = await player.getMaterialsById(userId);
        const userBoss = await dbManager.getBossByUser(userId); // récup level (neccessaire) et les id des matèriaux set (0 si aucun)
        if (materials.length === 0 && userIdMaterials.length === 0) {
          return interaction.reply("Aucun matériau disponible.");
        }

        async function component() {
          const etat0Materials = await player.getMaterialsByIdEtat0(userId);
          const userIdMaterials = await player.getMaterialsById(userId);
          let components = [];

          if (etat0Materials.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_select")
              .setPlaceholder("SetMateriaux")
              .setMaxValues(1)
              .addOptions(
                (await player.getMaterialsStringSelect(userId, 0, true))
                  .split("\n")
                  .map((material) => {
                    const [emo, nom, lvl, id] = material.split("_");
                    return new StringSelectMenuOptionBuilder()
                      .setEmoji(emo)
                      .setLabel(`${nom} (lvl: ${lvl})`)
                      .setValue(id);
                  })
              );
            const row = new ActionRowBuilder().addComponents(selectMenu);
            components.push(row);
          }
          if (userIdMaterials.length > 0) {
            const unselectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_unselect")
              .setPlaceholder("UnsetMateriaux")
              .setMaxValues(1)
              .addOptions(
                (await player.getMaterialsStringSelect(userId, 1, true))
                  .split("\n")
                  .map((material) => {
                    const [emo, nom, lvl, id] = material.split("_");
                    return new StringSelectMenuOptionBuilder()
                      .setEmoji(emo)
                      .setLabel(`${nom} (lvl: ${lvl}`)
                      .setValue(id);
                  })
              );
            const row2 = new ActionRowBuilder().addComponents(unselectMenu);

            components.push(row2);
          }

          return components;
        }

        async function stringBoss() {
          const userBoss = await dbManager.getBossByUser(userId); // récup level (neccessaire) et les id des matèriaux set (0 si aucun)
          const bossInfo = await bossManager.getBossInfo(userBoss[0].bossId);

          let materiauxString = "";
          for (const materiau of materiauxArray) {
            materiauxString += `- ${emoji(emo[materiau.nom])} \`${
              materiau.nom
            }\`\ (lvl: ${materiau.lvl}) \n> **Rareté:** ${
              materiau.rarete
            },\n> **Type:** ${materiau.type}\n> **Bonus:** 💚 ${
              materiau.bonusSante
            }% - ⚔️ ${materiau.bonusAttaque}% - 🛡️ ${materiau.bonusDefense}%\n`;
          }
          if (materiauxString === "") {
            materiauxString = "Aucun matériau";
          }
          return materiauxString;
        }
        const embedSetMateriaux = new EmbedBuilder()
          .setTitle("Gestion des Matériaux")
          .setColor(colors)
          .setDescription(
            `**Sélectionnez un matériau à activer ou désactiver pour le combat.**\n\n**Note :**\n> Vous pouvez activer jusqu'à 4 matériaux pour le combat.\n> Les matériaux actifs augmentent vos statistiques de combat.\n> Les matériaux inactifs ne fournissent aucun bonus.\n\n__**Matériaux Actuellement Actifs :**__ \n\n${await stringMat()}`
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await interaction.reply({
          embeds: [embedSetMateriaux],
          components: await component(),
          ephemeral: true,
          fetchReply: true,
        });
        const collectorSet =
          interaction.channel.createMessageComponentCollector({
            filter: (i) =>
              i.user.id === userId &&
              (i.customId === "material_select" ||
                i.customId === "material_unselect"),
            max: 4,
            time: 72000,
          });
        collectorSet.on("collect", async (i) => {
          const selectedMaterials = i.values;
          const selectedMaterialId = selectedMaterials[0];

          const embedS = new EmbedBuilder();
          embedS.setTitle("Succès");
          embedS.setColor(colors);
          embedS.setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

          const embedSError = new EmbedBuilder();
          embedSError.setTitle("Erreur");
          embedSError.setColor(color.error);
          embedSError.setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

          if (i.customId === "material_select") {
            await dbManager.updateMaterialState(
              userId,
              selectedMaterialId,
              "1"
            );
            const materialsInUse = await player.getMaterialsById(userId);

            if (materialsInUse.length > 4) {
              await dbManager.updateMaterialState(
                userId,
                selectedMaterialId,
                "0"
              );
              embedSError.setDescription(
                "Nombre maximal de matériaux atteint! Veuillez réduire vos sélections."
              );

              await i.update({
                embeds: [embedSError],
                components: [],
              });
              return;
            } else {
              embedS.setDescription(
                `Matériaux sélectionnés ajouté à votre inventaire de bataille!\n__**Matériaux Actuellement Actifs :**__ \n${await stringMat()}`
              );
              await i.update({
                embeds: [embedS],
                components: await component(),
              });
            }
          } else if (i.customId === "material_unselect") {
            const selectedMaterials = i.values;
            const selectedMaterialId = selectedMaterials[0];
            await dbManager.updateMaterialState(
              userId,
              selectedMaterialId,
              "0"
            );
            embedS.setDescription(
              `Matériaux sélectionnés retiré de votre inventaire de bataille!\n__**Matériaux Actuellement Actifs :**__ \n${await stringMat()}`
            );
            await i.update({
              embeds: [embedS],
              components: await component(),
            });
          } else {
            await interaction.followUp({
              content: "La selection est terminée",
              ephemeral: true,
            });
          }
        });
        collectorSet.on("end", (collected, reason) => {
          if (reason === "time") {
            interaction.followUp({
              content: "La sélection est terminée car le délai a expiré.",
              ephemeral: true,
            });
          }
        });

      case "activatepotion":
        const userPotions = await dbManager.getAllPotionDataForUserByEtat0(
          userId
        );
        const embedPotion = new EmbedBuilder();
        embedPotion.setTitle("Potions - Activation");
        embedPotion.setColor(colors);
        embedPotion.setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
        if (userPotions.length === 0) {
          embedPotion.setDescription("Aucune potion disponible.");
          return interaction.reply({
            embeds: [embedPotion],
            ephemeral: true,
          });
        }
        const potionMenu = new StringSelectMenuBuilder()
          .setCustomId("potion_select")
          .setPlaceholder("Potion")
          .setMaxValues(1)
          .addOptions(
            userPotions.map((potion) => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(potion.potionName)
                .setValue(potion.idPotion.toString());
            })
          );
        const row = new ActionRowBuilder().addComponents(potionMenu);
        embedPotion.setDescription(
          "Les potions offrent des bonus temporaires.\n\nChoisissez une potion à activer pour le combat.\n\n**Potions disponibles :**"
        );

        await interaction.reply({
          embeds: [embedPotion],
          components: [row],
          ephemeral: true,
        });

        const collectorPotion =
          interaction.channel.createMessageComponentCollector({
            filter: (i) =>
              i.user.id === userId && i.customId === "potion_select",
            time: 60000,
          });

        collectorPotion.on("collect", async (i) => {
          const selectedPotion = i.values[0];
          const potion = await dbManager.getPotionDataById(selectedPotion);
          if (!potion) {
            return i.update({
              content: "Potion non trouvée.",
              emdeds: [],
              components: [],
            });
          }
          const powerBoost = potion[0].powerBoost;
          await dbManager.updatePower(userId, powerBoost);
          await dbManager.updatePotionState(potion[0].idPotion, "1");
          const endTimestamp = Math.floor(
            Date.now() / 1000 + potion[0].duration
          );
          const embedPotionActivated = new EmbedBuilder()
            .setTitle("Potions - Activation")
            .setColor(colors)
            .setDescription(
              `La potion **${potion[0].potionName}** a été activée avec succès.\nFin d'activation : <t:${endTimestamp}:R>`
            )
            .setFooter({
              text: `Demandé(e) par ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

          await i.update({
            embeds: [embedPotionActivated],
            components: [],
          });

          setTimeout(async () => {
            try {
              await dbManager.deletePotionById(potion[0].idPotion);
            } catch (error) {
              console.error(
                `Erreur lors de la suppression de la potion ${potion[0].potionName}:`,
                error
              );
            }
          }, potion[0].duration * 1000);
        });
        collectorPotion.on("end", (collected, reason) => {
          if (reason === "time") {
            interaction.followUp({ content: "La sélection est terminée" });
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

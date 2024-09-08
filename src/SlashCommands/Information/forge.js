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

module.exports = {
  name: "materiaux",
  description: "informations sur les Matériaux",
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
        if (userMaterials.length === 0) {
          const noMaterialsEmbed = new EmbedBuilder()
            .setTitle("Boutique - Vente")
            .setColor(color.error)
            .setDescription("Vous ne possédez aucun matériau à vendre.")
            .setFooter({
              text: `Demandé(e) par ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });
          return interaction.reply({ embeds: [noMaterialsEmbed] });
        }
        switch (sellOption) {
          case "boutique":
            const embed = new EmbedBuilder()
              .setTitle("Boutique - Vente")
              .setColor(colors)
              .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
              .setDescription(
                "Choisissez un objet à vendre dans la liste ci-dessous"
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
                    label: `${material.nom} => lvl: ${material.lvl}`,
                    description: `Prix: ${Math.floor(
                      params.boutique.vente.prix.materiaux[material.rarete] *
                        material.lvl *
                        0.6
                    )}`,
                    value: `${material.mid}_${material.IdMateriau}_${material.lvl}`,
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
                    0.6
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
                      0.6
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
              .setTitle("Boutique - Vente")
              .setColor(colors)
              .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
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
                  ...userMaterials.map((material) => ({
                    emoji: emo[material.nom] || `❔`,
                    label: `${material.nom} => lvl: ${material.lvl}`,
                    description: `Prix: ${Math.floor(
                      params.boutique.vente.prix.materiaux[material.rarete] *
                        material.lvl *
                        0.6
                    )}`,
                    value: `${material.mid}_${material.IdMateriau}_${material.lvl}`,
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
                    0.6
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
                      0.6
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
                    .setTitle("Offre de vente")
                    .setColor(colors)
                    .setThumbnail(
                      client.user.displayAvatarURL({ dynamic: true })
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
        const rarityMap = {
          Commun: params.updatePrice.commun,
          Rare: params.updatePrice.rare,
          "Très Rare": params.updatePrice.tresRare,
          Épique: params.updatePrice.epic,
          Legendaire: params.updatePrice.legendaire,
        };

        const typeMultiplierMap = {
          feu: params.updatePrice.feu,
          eau: params.updatePrice.eau,
          terre: params.updatePrice.terre,
          vent: params.updatePrice.vent,
        };
        const ownedMaterials = await dbManager.getMateriauByUserId(userId);
        if (ownedMaterials.length === 0) {
          return interaction.reply("Aucun matériau disponible.");
        }
        async function componentMaterial() {
          const ownedMaterials2 = await dbManager.getMateriauByUserId(userId);
          let componentMaterial = [];
          if (ownedMaterials.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_select")
              .setPlaceholder("Upgrade")
              .setMaxValues(1)
              .addOptions(
                ownedMaterials2.map((material) => {
                  const emoji = emo[material.nom];
                  const baseRarity = rarityMap[material.rarete] || 1;
                  const typeMultiplier = typeMultiplierMap[material.type] || 1;
                  const rarity = baseRarity * typeMultiplier;
                  const calculLevelPrice = Math.round(
                    params.updatePrice.levels *
                      (material.lvl + 1) *
                      (ownedMaterials2.length * 0.57) *
                      rarity *
                      params.updatePrice.multiplicateur
                  );

                  const label =
                    material.lvl > 4
                      ? `${material.nom} (lvl: ${material.lvl}) Up : Max`
                      : `${material.nom} (lvl: ${material.lvl}) Up: ${calculLevelPrice} Fragments`;
                  const value = material.mid.toString();

                  return new StringSelectMenuOptionBuilder()
                    .setEmoji(emoji)
                    .setLabel(label)
                    .setValue(value);
                })
              );
            const actionRow = new ActionRowBuilder().addComponents(selectMenu);
            componentMaterial.push(actionRow);
          }
          return componentMaterial;
        }
        const upgradeEmbed = new EmbedBuilder()
          .setTitle("Amélioration de matériaux")
          .setColor(colors)
          .setDescription(
            `- **Facteurs :**\n\n> Nombre de matériaux possédés\n> Niveaux des matériaux\n> Types des matériaux\n> Raretés des matériaux\n\n*Améliorer un matériau apportera une amélioration des bonus du materiaux.*\n\n> *--> Sélectionnez un matériau à améliorer*`
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await interaction.reply({
          embeds: [upgradeEmbed],
          components: await componentMaterial(),
          ephemeral: true,
          fetchReply: true,
        });
        const collectorUp = interaction.channel.createMessageComponentCollector(
          {
            filter: (it) =>
              it.user.id === userId && it.customId === "material_select",
            time: 72000,
          }
        );
        collectorUp.on("collect", async (it) => {
          const selectedMaterials = it.values;
          const selectedMaterialId = selectedMaterials[0];

          if (it.customId === "material_select") {
            const stats = await player.getStats(userId);
            const power = stats.power;
            const [material] = await dbManager.getMateriauById(
              selectedMaterials
            );

            if (!material) {
              return it.reply({
                content: "Matériau non trouvé.",
                ephemeral: true,
              });
            }
            const baseRarity = rarityMap[material.rarete] || 1;
            const typeMultiplier = typeMultiplierMap[material.type] || 1;
            const rarity = baseRarity * typeMultiplier;
            const upgradePrice = Math.round(
              params.updatePrice.levels * material.lvl +
                1 *
                  (ownedMaterials.length * 0.57) *
                  rarity *
                  params.updatePrice.multiplicateur
            );
            const ErrorEmbed = new EmbedBuilder();
            ErrorEmbed.setTitle("Erreur");
            ErrorEmbed.setColor(color.error);
            const newLevel = material.lvl + 1;
            if (newLevel > params.maxLevel) {
              ErrorEmbed.setDescription(
                `Le niveau maximal pour ${emoji(emo[material.nom])} **${
                  material.nom
                }** est atteint. max : **(${
                  params.maxLevel
                })**\n\n**Sélectionnez un matériau à améliorer**`
              );
              return it.update({
                embeds: [ErrorEmbed],
                components: await componentMaterial(),
              });
            }
            if (power < upgradePrice) {
              ErrorEmbed.setDescription(
                `Vous n'avez pas assez de Fragments pour améliorer ${emoji(
                  emo[material.nom]
                )} **${material.nom}**.\n(Prix:** ${upgradePrice})** ${emoji(
                  emo.power
                )}\n**Vous avez :** ${power} ${emoji(emo.power)}`
              );
              return it.update({
                embeds: [ErrorEmbed],
                components: await componentMaterial(),
              });
            }

            const upgrade = await dbManager.updateMaterialLevel(
              userId,
              selectedMaterialId,
              newLevel
            );

            if (upgrade) {
              const UpgradeEmbed = new EmbedBuilder();
              UpgradeEmbed.setTitle("Amélioration de matériaux");
              UpgradeEmbed.setColor(colors);
              UpgradeEmbed.setDescription(
                `Le matériau ${emoji(emo[material.nom])} **${
                  material.nom
                }** a été amélioré au niveau **${newLevel}**.\n**Sélectionnez le matériau à améliorer**`
              );

              await dbManager.updatePower(userId, -upgradePrice);
              return it.update({
                embeds: [UpgradeEmbed],
                components: await componentMaterial(),
              });
            } else {
              return it.reply({
                content: "Erreur lors de l'amélioration du matériau.",
                ephemeral: true,
              });
            }
          }
          collectorUp.on("end", (collected, reason) => {
            if (reason === "time") {
              interaction.followUp({
                content: "La sélection est terminée car le délai a expiré.",
                ephemeral: true,
              });
            }
          });
        });

      case "setmateriaux":
        const materials = await player.getMaterialsByIdEtat0(userId);
        const userIdMaterials = await player.getMaterialsById(userId);
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

        async function stringMat() {
          const materiauxArray = await player.getMaterialsStringMessage(userId);

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

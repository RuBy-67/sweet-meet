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
const player = new Player();

module.exports = {
  name: "materiaux",
  description: "informations sur les Matériaux",
  options: [
    {
      type: 1,
      name: "sell",
      description: "Vendre un objet dans la boutique",
    },
    {
      type: 1,
      name: "upgrade",
      description: "Ameliorer un matériau",
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
        const userMaterials = await dbManager.getMateriauByUserId(
          interaction.user.id
        );
        const colors = await dbManager.getColor(interaction.user.id);
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
        const embed = new EmbedBuilder()
          .setTitle("Boutique - Vente")
          .setColor(colors)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setDescription("Choisissez un objet à vendre:")
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("sell_select")
            .setPlaceholder("Choisissez un objet à vendre")
            .addOptions(
              ...userMaterials.map((material) => ({
                emoji: emo[material.nom] || `❔`,
                label: `${material.nom} => lvl: ${material.lvl}`,
                description: `Prix: ${Math.floor(
                  param.boutique.vente.prix.materiaux[material.rarete] *
                    material.lvl *
                    0.6
                )}`,
                value: `${material.mid}_${material.IdMateriau}_${material.lvl}`,
              }))
            )
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = (i) =>
          i.customId === "sell_select" && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
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
              param.boutique.vente.prix.materiaux[selectedMaterial.rarete] *
                level *
                0.6
            )} ${emoji(emo.power)} ?`,
            components: [confirmationRow],
            embeds: [],
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
                param.boutique.vente.prix.materiaux[selectedMaterial.rarete] *
                  level *
                  0.6
              );
              await dbManager.removeMaterialFromUser(idUnique);
              await dbManager.updatePower(i.user.id, -prix);
              await i.update({
                content: `La vente de **${
                  selectedMaterial.nom
                }** a été effectuée avec succès pour ${prix} ${emoji(
                  emo.power
                )}.`,
                components: [],
                embeds: [],
              });
            } else {
              await btnInt.update({
                content: "Vente annulée.",
                components: [],
                embeds: [],
              });
            }
          });

          confirmationCollector.on("end", async (collected) => {
            if (collected.size === 0) {
              await i.update({
                content: "Temps écoulé, vente annulée.",
                components: [],
                embeds: [],
              });
            }
          });
        });

        collector.on("end", async (collected) => {
          if (collected.size === 0) {
            await interaction.editReply({
              content: "Temps écoulé, vente annulée.",
              components: [],
              embeds: [],
            });
          }
        });
      case "upgrade":
        const rarityMap = {
          Commun: params.updatePrice.commun,
          Rare: params.updatePrice.rare,
          "Très Rare": params.updatePrice.tresRare,
          Épique: params.updatePrice.epique,
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
          let components = [];
          if (ownedMaterials.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_select")
              .setPlaceholder("Upgrade")
              .setMinValues(1)
              .addOptions(
                ownedMaterials2.map((material) => {
                  const emoji = emo[material.nom];
                  const baseRarity = rarityMap[material.rarete] || 1;
                  const typeMultiplier = typeMultiplierMap[material.type] || 1;
                  const rarity = baseRarity * typeMultiplier;
                  const calculLevelPrice = Math.round(
                    params.updatePrice.levels *
                      material.lvl *
                      ownedMaterials2.length *
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
            components.push(actionRow);
          }
          return components;
        }

        await interaction.reply({
          content: `**Comment le prix est calculé ? :**\n
🔹 **Facteurs :**\n> Nombre de matériaux possédés\n> Niveaux des matériaux\n> Types des matériaux\n> Raretés des matériaux\n\n*Améliorer un matériau apportera une amélioration des bonus du materiaux.*\n\n**Sélectionnez un matériau à améliorer**`,
          components: await componentMaterial(),
        });
        const collectorUp = interaction.channel.createMessageComponentCollector(
          {
            filter: (i) =>
              i.user.id === userId && i.customId === "material_select",
            time: 72000,
          }
        );
        collectorUp.on("collect", async (i) => {
          const selectedMaterials = i.values;
          const selectedMaterialId = selectedMaterials[0];

          if (i.customId === "material_select") {
            const stats = await player.getStats(userId);
            const power = stats.power;
            const [material] = await dbManager.getMateriauById(
              selectedMaterials
            );

            if (!material) {
              return i.reply("Matériau non trouvé.");
            }
            const baseRarity = rarityMap[material.rarete] || 1;
            const typeMultiplier = typeMultiplierMap[material.type] || 1;
            const rarity = baseRarity * typeMultiplier;
            const upgradePrice = Math.round(
              params.updatePrice.levels *
                material.lvl *
                ownedMaterials.length *
                rarity *
                params.updatePrice.multiplicateur
            );

            if (power < upgradePrice) {
              return i.update({
                content: `Vous n'avez pas assez de Fragments pour améliorer **${material.nom}**.\n(Prix:** ${upgradePrice})**\n**Vous avez :** ${power} Fragments de Protection**\n\n**Sélectionnez un matériau à améliorer**`,
                components: await componentMaterial(),
              });
            }

            const newLevel = material.lvl + 1;
            if (newLevel > params.maxLevel) {
              return i.update({
                content: `Le niveau maximal pour **${material.nom}** est atteint. max : **(${params.maxLevel})**\n\n**Sélectionnez un matériau à améliorer**`,
                components: await componentMaterial(),
              });
            }
            const upgrade = await dbManager.updateMaterialLevel(
              userId,
              selectedMaterialId,
              newLevel
            );
            if (upgrade) {
              await dbManager.setPowerById(userId, -upgradePrice);
              return i.update({
                content: `Le matériau **${material.nom}** a été amélioré au niveau **${newLevel}**.\n**Sélectionnez le matériau à améliorer**`,
                components: await componentMaterial(),
              });
            } else {
              return i.reply("Échec de la mise à jour du matériau.");
            }
          }
          collectorUp.on("end", (collected, reason) => {
            if (reason === "time") {
              interaction.followUp(
                "La sélection est terminée car le délai a expiré."
              );
            }
          });
        });

      case "setmateriaux":
        const materialsUsed = await player.getMaterialsById(userId);
        const materials = await player.getMaterialsByIdEtat0(userId);
        if (materials.length === 0 && materialsUsed.length === 0) {
          return interaction.reply("Aucun matériau disponible.");
        }
        if (materialsUsed.length > 4) {
          return interaction.reply(
            "Vous Avez déjà 4 matériaux actifs, veuillez en désactiver un pour en activer un autre."
          );
        }

        async function component() {
          const etat0Materials = await player.getMaterialsByIdEtat0(userId);
          const userIdMaterials = await player.getMaterialsById(userId);
          let components = [];

          if (etat0Materials.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_select")
              .setPlaceholder("SetMateriaux")
              .setMinValues(1)
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
            const maxSelectOptions = Math.min(
              await (
                await player.getMaterialsByIdEtat0(userId)
              ).length,
              4
            );
            selectMenu.setMaxValues(maxSelectOptions);
            const row = new ActionRowBuilder().addComponents(selectMenu);
            components.push(row);
          }
          if (userIdMaterials.length > 0) {
            const unselectMenu = new StringSelectMenuBuilder()
              .setCustomId("material_unselect")
              .setPlaceholder("UnsetMateriaux")
              .setMinValues(1)
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

            const maxOptions = Math.min(
              await (
                await player.getMaterialsById(userId)
              ).length,
              4
            );
            unselectMenu.setMaxValues(maxOptions);
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

        await interaction.reply({
          content: `Matériaux Actuellement Actifs : \n${await stringMat()}`,
          components: await component(),
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
              await i.update({
                content:
                  "Nombre maximal de matériaux atteint! Veuillez réduire vos sélections.",
                components: [],
              });
              return;
            } else {
              await i.update({
                content: `Matériaux sélectionnés ajouté à votre inventaire de bataille!\nMatériaux Actuellement Actifs : \n${await stringMat()}`,
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
            await i.update({
              content: `Matériaux sélectionnés retiré de votre inventaire de bataille!\nMatériaux Actuellement Actifs : \n${await stringMat()}`,
              components: await component(),
            });
          } else {
            await interaction.followUp("La sélection est terminée");
          }
        });
        collectorSet.on("end", (collected, reason) => {
          if (reason === "time") {
            interaction.followUp(
              "La sélection est terminée car le délai a expiré."
            );
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

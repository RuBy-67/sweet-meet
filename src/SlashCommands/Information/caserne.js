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
      name: "upgrade", ///ok
      description: "Ameliorer la caserne",
    },
    {
      type: 1,
      name: "setmateriaux",
      description: "Équiper des matériau pour le combat à vos boss",
    },
    {
      type: 1,
      name: "default",
      description: "Armée par défaut",
    },
    {
      type: 1,
      name: "troops",
      description: "Gérer vos troupe (Améliorer)",
    },
    {
      type: 1,
      name: "détails",
      description: "Détail de votre caserne",
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
      case "upgrade":
        async function createCaserneEmbed(user, caserneLvl) {
          const bonus = await dbManager.getBonus("caserne");
          const powerUpdate = await dbManager.getPower(userId);
          const formattedPower = powerUpdate.toLocaleString("fr-FR", {
            useGrouping: true,
          });
          let priceUpgrade;
          if (caserneLvl >= 1 && caserneLvl <= 9) {
            priceUpgrade = caserneLvl * 2250;
          } else if (caserneLvl >= 10 && caserneLvl <= 21) {
            priceUpgrade = (caserneLvl - 9) * 4700 + 9 * 2250;
          } else if (caserneLvl >= 22 && caserneLvl <= 25) {
            priceUpgrade = (caserneLvl - 21) * 6500 + 12 * 4700 + 9 * 2250;
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
            caserneLvl === 25 ? "Max" : `${priceUpgrade} ${emoji("power")}`;

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
                value: `**${caserneLvl}/25**`,
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

        const caserneLvl = await dbManager.getCaserneLvl(userId);
        // Création de l'embed initial
        const caserneEmbed = await createCaserneEmbed(
          interaction.user,
          caserneLvl[0].lvl
        );

        // Ajout du bouton pour l'amélioration de la caserne
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("upgradeCaserne")
            .setLabel("Améliorer la Caserne")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(caserneLvl[0].lvl === 25)
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
                .setDisabled(caserneLvl[0].lvl === 25)
            );

            // Réponse à l'interaction
            await interaction.update({
              embeds: [updatedCaserneEmbed],
              components: [newActionRow],
            });
          }
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

      case "default":

      case "troops":

      case "détails":

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

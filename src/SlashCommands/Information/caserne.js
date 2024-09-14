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

      case "default":
      //! set un max de 4 armées par défaut par user

      case "troops":
      //! géré ses troupe (améliorer)

      case "détails":
      //! niveau , détails de sa carner et de ses troupes, + (bonus)

      case "train":
      //! train des troupes (avec un temps de train)

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

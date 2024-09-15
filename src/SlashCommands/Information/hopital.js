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
  name: "hopital",
  description: "hôpital, soigner de vos troupes, gérer votre hôpital",
  options: [
    {
      type: 1,
      name: "soigner",
      description: "soigner vos troupe tomber au combat",
    },
    {
      type: 1,
      name: "info", /// ok
      description: "info de votre hôpital",
    },
    {
      type: 1,
      name: "détails", /// ok
      description: "Détail de votre hôpital",
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

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "info":
        async function createHospitalEmbed(user, hopitalLvl) {
          const bonus = await dbManager.getBonus("hopital");
          const powerUpdate = await dbManager.getPower(userId);
          const formattedPower = powerUpdate.toLocaleString("fr-FR", {
            useGrouping: true,
          });
          let priceUpgrade;
          if (hopitalLvl >= 1 && hopitalLvl <= 9) {
            priceUpgrade = hopitalLvl * 2750;
          } else if (hopitalLvl >= 10 && hopitalLvl <= 21) {
            priceUpgrade = (hopitalLvl - 9) * 6000 + 9 * 2750;
          } else if (hopitalLvl >= 22 && hopitalLvl <= 25) {
            priceUpgrade = (hopitalLvl - 21) * 9000 + 12 * 6000 + 9 * 2750;
          }
          let bonus1 = bonus.bonus1 * hopitalLvl;
          let bonus2 = hopitalLvl >= 10 ? bonus.bonus2 * (hopitalLvl - 6) : 0;
          let bonus3 = hopitalLvl >= 22 ? bonus.bonus3 * (hopitalLvl - 15) : 0;
          if (hopitalLvl === 25) {
            bonus3 = Math.round(bonus3 * 1.4);
            bonus1 = Math.round(bonus1 * 2.5);
            bonus2 = Math.round(bonus2 * 1.7);
          }
          const priceUpgradeText =
            hopitalLvl === 25 ? "Max" : `${priceUpgrade} ${emoji("power")}`;

          return new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Hôpital 💉")
            .setColor(colors)
            .setImage(
              "https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F97b6b18f-ba1a-43e5-a3c9-7316119eee5a%2F9797bbcb-6ad7-43f8-b0b2-7ca661253a88%2Fimage.png?table=block&id=2630b6c7-00bc-4b8e-9762-ba0a90f9acbc&spaceId=97b6b18f-ba1a-43e5-a3c9-7316119eee5a&width=2000&userId=ae43cc5c-1a62-480c-8f4f-04874570864d&cache=v2"
            )
            .setDescription(
              "l’hôpital permet de soigner vos troupes tombées au combat. Plus le niveau de l’hôpital est élevé, plus le temps de soin est réduit."
            )
            .addFields(
              {
                name: "Niveau de l'Hôpital",
                value: `**${hopitalLvl}/25**\n- Puissance hôpital : **${
                  params.batiment.basePower.hopital * hopitalLvl
                }**`,
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
                  `- **Bonus1 :** (Augmentation capacité Hôpital) **${bonus1}%**\n` +
                  (hopitalLvl >= 10
                    ? `- **Bonus2 :** (Réduction du temps de soins) **${bonus2}%**\n`
                    : "") +
                  (hopitalLvl >= 22
                    ? `- **Bonus3 :** (Réduction prix de soins) **${bonus3}%**`
                    : ""),
                inline: false,
              }
            )
            .setFooter({
              text: `Demande de ${user.tag}`,
              iconURL: user.displayAvatarURL({ dynamic: true }),
            });
        }

        const hopitalLvl = await dbManager.getHospitalLvl(userId);
        // Création de l'embed initial
        const hopitalEmbed = await createHospitalEmbed(
          interaction.user,
          hopitalLvl[0].lvl
        );

        // Ajout du bouton pour l'amélioration de la hopital
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("upgradeHopital")
            .setLabel("Améliorer l’hôpital")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(hopitalLvl[0].lvl === 25)
        );

        // Envoi du message
        await interaction.reply({
          embeds: [hopitalEmbed],
          components: [actionRow],
        });

        client.on("interactionCreate", async (interaction) => {
          if (!interaction.isButton()) return;

          const { customId } = interaction;

          if (customId === "upgradeHopital") {
            const userId = interaction.user.id;

            const stats = await dbManager.getStats(userId); // Pour les fragments
            const hopital = await dbManager.getHospitalLvl(userId);
            const hopitalLvl = hopital[0].lvl;

            // Calcul du prix d'amélioration
            let priceUpgrade;
            if (hopitalLvl >= 1 && hopitalLvl <= 9) {
              priceUpgrade = hopitalLvl * 2500;
            } else if (hopitalLvl >= 10 && hopitalLvl <= 21) {
              priceUpgrade = (hopitalLvl - 9) * 5500 + 9 * 2500;
            } else if (hopitalLvl >= 22 && hopitalLvl <= 25) {
              priceUpgrade = (hopitalLvl - 21) * 8500 + 12 * 5500 + 9 * 2500;
            }

            // Vérification des fragments
            if (stats.fragments < priceUpgrade) {
              await interaction.reply({
                content: `Vous n'avez pas assez de fragments (${
                  stats.fragments
                } ${emoji(
                  emo.power
                )}) pour améliorer votre Hôpital ${priceUpgrade} ${emoji(
                  emo.power
                )}.`,
                ephemeral: true,
              });
              return;
            }

            // Mise à jour du niveau de la hopitale
            const newHopitalLvl = hopitalLvl + 1;
            if (newHopitalLvl > 25) {
              await interaction.reply({
                content: "L'Hôpital est déjà au niveau maximum.",
                ephemeral: true,
              });
              return;
            }

            await dbManager.updateHospital(userId);
            await dbManager.updatePower(userId, -priceUpgrade);

            // Création de l'embed mis à jour
            const updatedHopitalEmbed = await createHospitalEmbed(
              interaction.user,
              hopitalLvl
            );

            // Création d'un nouvel action row avec le bouton
            const newActionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("upgradeHopital")
                .setLabel("Améliorer l'hôpital")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(hopitalLvl[0].lvl === 25)
            );

            // Réponse à l'interaction
            await interaction.update({
              embeds: [updatedHopitalEmbed],
              components: [newActionRow],
            });
          }
        });

      case "soigner":

      case "détails":

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

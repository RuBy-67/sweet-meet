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
const { description, name, options } = require("./guild");
const {
  getMaterialsById,
  getMateriaux,
} = require("../../class/sqlQueriesPlayer");
const player = new Player();

module.exports = {
  name: "alchimiste",
  description: "🚨 Réservé au marchand / Alchimiste",
  options: [
    {
      type: 1,
      name: "sell",
      description:
        "Vendre une Potion Fabriqué aux membre de sa guilde 🚨 Réservé au marchand d'une guilde",
      options: [
        {
          type: 4,
          name: "idpotion",
          description: "id de la potion à vendre",
          required: true,
        },
        {
          type: 6,
          name: "membre",
          description: "Membre de la guilde",
          required: true,
        },
        {
          type: 4,
          name: "montant",
          description: "Montant en Fragment de la vente",
          required: true,
        },
      ],
    },
    {
      type: 1,
      name: "stock",
      description: "Afficher son Stock de potion",
    },
    {
      type: 1,
      name: "fabrique",
      description:
        "Fabrique des potions à partir des matériaux possédé (Alchimiste)",
      options: [
        {
          type: 3 /* String */,
          name: "nom",
          description: "Nom de la potion",
          required: true,
        },
        {
          type: 3 /* String */,
          name: "choix",
          description: "Choix Materiaux",
          choices: [
            {
              name: `Cristal d'eau`,
              value: "1",
            },
            {
              name: `Perle des marées`,
              value: "2",
            },
            {
              name: `Essence de l'océan`,
              value: "3",
            },
            {
              name: `Roche magique`,
              value: "4",
            },
            {
              name: `Cœur de montagne`,
              value: "5",
            },
            {
              name: `Poussière de terre`,
              value: "6",
            },
            {
              name: `Flamme éternelle`,
              value: "7",
            },
            {
              name: `Cendre mystique`,
              value: "8",
            },
            {
              name: `Larme de phénix`,
              value: "9",
            },
            {
              name: `Plume de vent`,
              value: "10",
            },
            {
              name: `Souffle de tempête`,
              value: "11",
            },
            {
              name: `Voile de brise`,
              value: "12",
            },
          ],
          required: true,
        },
        {
          type: 3,
          name: "choix2",
          description: "Choix Materiaux",
          choices: [
            {
              name: `Cristal d'eau`,
              value: "1",
            },
            {
              name: `Perle des marées`,
              value: "2",
            },
            {
              name: `Essence de l'océan`,
              value: "3",
            },
            {
              name: `Roche magique`,
              value: "4",
            },
            {
              name: `Cœur de montagne`,
              value: "5",
            },
            {
              name: `Poussière de terre`,
              value: "6",
            },
            {
              name: `Flamme éternelle`,
              value: "7",
            },
            {
              name: `Cendre mystique`,
              value: "8",
            },
            {
              name: `Larme de phénix`,
              value: "9",
            },
            {
              name: `Plume de vent`,
              value: "10",
            },
            {
              name: `Souffle de tempête`,
              value: "11",
            },
            {
              name: `Voile de brise`,
              value: "12",
            },
          ],
          required: false,
        },
        {
          type: 3,
          name: "choix3",
          description: "Choix Materiaux",
          choices: [
            {
              name: `Cristal d'eau`,
              value: "1",
            },
            {
              name: `Perle des marées`,
              value: "2",
            },
            {
              name: `Essence de l'océan`,
              value: "3",
            },
            {
              name: `Roche magique`,
              value: "4",
            },
            {
              name: `Cœur de montagne`,
              value: "5",
            },
            {
              name: `Poussière de terre`,
              value: "6",
            },
            {
              name: `Flamme éternelle`,
              value: "7",
            },
            {
              name: `Cendre mystique`,
              value: "8",
            },
            {
              name: `Larme de phénix`,
              value: "9",
            },
            {
              name: `Plume de vent`,
              value: "10",
            },
            {
              name: `Souffle de tempête`,
              value: "11",
            },
            {
              name: `Voile de brise`,
              value: "12",
            },
          ],
          required: false,
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
    const Embedcolors = await dbManager.getColor(interaction.user.id);

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userInfo = await dbManager.getStats(interaction.user.id);
    const guildInfo = await dbManager.getGuildInfo(userInfo.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const roleCondition = "1246944923526234113";
    if (!member.roles.cache.has(roleCondition)) {
      const embedError = new EmbedBuilder()
        .setTitle("🚨 Réservé au Alchimiste")
        .setColor(color.error)
        .setDescription(
          `> Vous n'avez pas le rôle requis pour cette commande.\n- **Rôle Requis :** <@&${roleCondition}>`
        );
      return interaction.reply({ embeds: [embedError], ephemeral: true });
    }

    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "sell":
        if (guildInfo.marchand != interaction.user.id) {
          const embedError = new EmbedBuilder()
            .setTitle("🚨 Réservé au marchand d'une guilde")
            .setColor(color.error)
            .setDescription(`> Vous n'êtes pas le marchand de votre guilde.`);
          return interaction.reply({ embeds: [embedError], ephemeral: true });
        }
        const potionId = interaction.options.getInteger("idpotion");
        const targetUser = interaction.options.getUser("membre");
        const amount = interaction.options.getInteger("montant");
        const userPotions = await dbManager.getAllPotionDataForUser(
          interaction.user.id
        );
        const potion = userPotions.find((p) => p.idPotion === potionId);
        if (!potion) {
          return interaction.reply({
            content: "Vous ne possédez pas cette potion.",
            ephemeral: true,
          });
        }
        // verifier si le membre et le marchand sont dans la même guilde
        const targetUserInfo = await dbManager.getStats(targetUser.id);
        const userInfo = await dbManager.getStats(interaction.user.id);
        const userId = interaction.user.id;
        if (targetUserInfo.guildId !== userInfo.guildId) {
          return interaction.reply({
            content: "Le membre n'est pas dans votre guilde.",
            ephemeral: true,
          });
        }
        const sellEmbed = new EmbedBuilder()
          .setTitle("Confirmation de Vente de Potion")
          .setColor(Embedcolors) // Choisissez une couleur appropriée
          .setDescription(
            `**Potion à vendre :** ${
              potion.potionName
            }\n**Détails :**\n- Attaque Boost : **+${
              potion.attaqueBoost
            }** ⚔️\n- Défense Boost : **+${
              potion.defenseBoost
            }** 🛡️\n- Santé Boost : **+${potion.santeBoost}**💚\n- Type : **${
              potion.type
            }**\n- Power Boost : **+${potion.powerBoost}** ${emoji(
              emo.power
            )}\n- Durée : **${
              potion.duration
            } s**\n**Prix :** ${amount} ${emoji(emo.power)}`
          )
          .setFooter({
            text: "Cliquez sur un bouton pour accepter ou refuser la vente.",
          });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("accept_sale")
            .setLabel("Accepter")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("decline_sale")
            .setLabel("Refuser")
            .setStyle(ButtonStyle.Danger)
        );

        const message = await interaction.reply({
          content: `**${targetUser}**, vous avez une offre de vente de potion !`,
          embeds: [sellEmbed],
          components: [row],
        });

        const filter = (interaction) => interaction.user.id === targetUser.id;
        const collector = message.createMessageComponentCollector({
          filter,
          time: 60000,
        });
        collector.on("collect", async (interaction) => {
          if (interaction.customId === "accept_sale") {
            //profiter pour verifier que le targetUser a bien les fragments
            if (targetUserInfo.power < amount) {
              return interaction.message.edit({
                content: `Vous n'avez pas assez de fragments. ->Vente annulée.\n${
                  targetUserInfo.power
                } / ${amount} ${emoji(emo.power)}`,
              });
            }

            await dbManager.updatePower(userId, amount);
            await dbManager.updatePower(targetUser.id, -amount);
            //update owner de la potion
            await dbManager.updatePotionOwner(targetUser.id, potionId);
            await interaction.message.edit({
              content: "La vente a été acceptée !",
            });
          } else if (interaction.customId === "decline_sale") {
            await interaction.message.edit({
              content: "La vente a été refusée.",
            });
          }

          await interaction.message.edit({ components: [] });
        });
      case "stock":
        const potions = await dbManager.getAllPotionDataForUser(
          interaction.user.id
        );
        if (potions.length === 0) {
          return interaction.reply({
            content: "Vous n'avez aucune potion en stock.",
            ephemeral: true,
          });
        }
        const embed = new EmbedBuilder()
          .setTitle("Votre stock de potions ⚗️")
          .setColor(Embedcolors);

        potions.forEach((potion) => {
          const potionDetails = `
  >>> __Type :__ ${potion.type}
  __Boost :__ \n**+ ${potion.attaqueBoost}** ⚔️\n**+ ${
            potion.defenseBoost
          }** 🛡️\n **+ ${potion.santeBoost}** 💚\n**+ ${
            potion.powerBoost
          }** ${emoji(emo.power)}
    __Durée :__ **${potion.duration} s** ${emoji(
            emo.horloge
          )}\n__**----------------**__
    `;
          embed.addFields({
            name: `- ${potion.potionName} - ID: ${potion.idPotion}`,
            value: potionDetails,
            inline: true,
          });
        });

        return interaction.reply({ embeds: [embed] });
      case "fabrique":
        // Récupérer les choix de matériaux depuis l'interaction
        const potionName = interaction.options.getString("nom");
        const choices = [
          interaction.options.getString("choix"),
          interaction.options.getString("choix2"),
          interaction.options.getString("choix3"),
        ];

        const maxLength = 20;
        if (potionName.length > maxLength) {
          return interaction.reply({
            content: `Le nom de la potion ne peut pas dépasser ${maxLength} caractères.`,
            ephemeral: true,
          });
        }

        // Filtrer les choix non nuls
        const filteredChoices = choices.filter((choice) => choice !== null);
        console.log("Filtered Choices:", filteredChoices);

        const possède = await dbManager.getMateriauByUserId(
          interaction.user.id
        );
        const possèdeIds = possède.map((material) =>
          parseInt(material.IdMateriau, 10)
        );

        // Vérifier que l'utilisateur possède tous les matériaux nécessaires
        const allMaterialsPresent = filteredChoices.every((choice) =>
          possèdeIds.includes(parseInt(choice, 10))
        );
        console.log("All Materials Present:", allMaterialsPresent);

        if (!allMaterialsPresent) {
          const embedFabrique = new EmbedBuilder()
            .setTitle("🧪 Fabrique de potion")
            .setColor(Embedcolors)
            .setDescription(
              `> Vous n'avez pas les matériaux nécessaires pour fabriquer cette potion.`
            );
          return interaction.reply({
            embeds: [embedFabrique],
            ephemeral: true,
          });
        }

        // Vérifier que tous les matériaux sont de niveau 5 ou plus
        const allMaterialsLevelFiveOrAbove = filteredChoices.every((choice) => {
          const material = possède.find(
            (material) => material.IdMateriau === parseInt(choice, 10)
          );
          return material && material.lvl >= 5;
        });

        if (!allMaterialsLevelFiveOrAbove) {
          const embedFabrique = new EmbedBuilder()
            .setTitle("🧪 Fabrique de potion")
            .setColor(Embedcolors)
            .setDescription(
              `> Les matériaux sélectionnés doivent être au moins de **niveau 5** pour fabriquer des potions.`
            );
          return interaction.reply({
            embeds: [embedFabrique],
            ephemeral: true,
          });
        }

        // Compter les occurrences de chaque matériau dans les choix
        const choiceCounts = filteredChoices.reduce((acc, choice) => {
          acc[choice] = (acc[choice] || 0) + 1;
          return acc;
        }, {});

        console.log("Choice Counts:", choiceCounts);

        // Liste pour stocker les matériaux à supprimer
        const materialsToRemove = [];

        // Trouver et stocker les matériaux à supprimer + calculer les statistiques de la potion
        let attaqueBoost = 0;
        let defenseBoost = 0;
        let santeBoost = 0;
        let powerBoost = 0;
        for (const [choice, count] of Object.entries(choiceCounts)) {
          const idMateriau = parseInt(choice, 10);
          const midMaterials = await dbManager.getMIDMateriauxByIdLVL5(
            idMateriau,
            interaction.user.id
          );
          const [data] = await dbManager.getDataMateriauById(idMateriau);
          attaqueBoost += data.attaqueBoost * 2.12;
          defenseBoost += data.defenseBoost * 3.12;
          santeBoost += data.santeBoost * 6.12;

          if (midMaterials.length > 0) {
            // On prend uniquement autant de mid que nécessaire
            for (let i = 0; i < count && i < midMaterials.length; i++) {
              materialsToRemove.push(midMaterials[i].id);
            }
          }
        }

        // Supprimer les matériaux
        for (const mid of materialsToRemove) {
          await dbManager.removeMaterialFromUser(mid);
          console.log(`Removed Material with mid ${mid}`);
        }
        // Sélectionner uniquement les matériaux spécifiés par l'utilisateur
        const selectedMaterials = possède.filter((material) =>
          filteredChoices.includes(material.IdMateriau.toString())
        );

        powerBoost = (attaqueBoost + defenseBoost + santeBoost) * 61;

        const coefficient = 1.5; // Coefficient de puissance
        attaqueBoost = Math.round(attaqueBoost * coefficient);
        defenseBoost = Math.round(defenseBoost * coefficient);
        santeBoost = Math.round(santeBoost * coefficient);
        powerBoost = Math.round(powerBoost * coefficient);
        // Déterminer le type de la potion
        const typeCounts = {};
        selectedMaterials.forEach((material) => {
          if (material.type in typeCounts) {
            typeCounts[material.type]++;
          } else {
            typeCounts[material.type] = 1;
          }
        });

        const potionType = Object.keys(typeCounts).reduce((a, b) =>
          typeCounts[a] > typeCounts[b] ? a : b
        );

        // Déterminer la durée de la potion
        const baseDuration = {
          Commun: 1500,
          Rare: 3000,
          TrèsRare: 3500,
          Épique: 5000,
          Légendaire: 6000,
        };
        const rarityHierarchy = {
          Commun: 1,
          Rare: 2,
          TrèsRare: 3,
          Épique: 4,
          Légendaire: 5,
        };

        const highestRarity = selectedMaterials.reduce((highest, material) => {
          return rarityHierarchy[material.rarete] > rarityHierarchy[highest]
            ? material.rarete
            : highest;
        }, "Commun");
        const duration = baseDuration[highestRarity];

        // Création de l'embed final pour montrer les détails de la potion
        const embedPotion = new EmbedBuilder()
          .setTitle(`🧪 Potion : ${potionName}`)
          .setColor(Embedcolors)
          .setDescription(
            `- Type de Potion: **${potionType}**\n` +
              `- Boost d'attaque: **+${attaqueBoost}⚔️**\n` +
              `- Boost de défense: **+${defenseBoost}🛡️**\n` +
              `- Boost de santé: **+${santeBoost}💚**\n` +
              `- Boost de puissance: **+${powerBoost}** ${emoji(emo.power)}\n` +
              `- Durée d'efficacité: **${duration} secondes**\n> ***Vous pouvez vendre vos potions à vos membres de guilde, si vous êtes marchand***`
          );

        await dbManager.insertPotionData(
          interaction.user.id,
          potionName,
          attaqueBoost,
          defenseBoost,
          santeBoost,
          potionType,
          powerBoost,
          duration
        );

        return interaction.reply({
          embeds: [embedPotion],
          ephemeral: true,
        });

      default:
        return interaction.reply({
          content: "Commande Invalide",
          ephemeral: true,
        });
    }
  },
};

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
const Boss = require("../../class/bossManager");
const { name } = require("../guild/guild");
const bosses = new Boss();
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();

module.exports = {
  name: "campagne",
  description: "🚨 Empereur, reine et ministre de la guilde",
  options: [
    {
      type: 1,
      name: "solo",
      description: "campagne solo",
      options: [
        {
          type: 3,
          name: "choix",
          description: "A venir",
          choices: [
            {
              name: `income`,
              value: "2",
            },
            {
              name: `income`,
              value: "1",
            },
          ],
          required: true,
        },
      ],
    },
    {
      type: 1,
      name: "entrainement",
      description: "campagne d'entrainement",
      options: [
        {
          type: 3,
          name: "difficulté",
          description: "difficulté des Bosses",
          choices: [
            {
              name: `noob`,
              value: "0",
            },
            {
              name: `Facile`,
              value: "1",
            },
            {
              name: `Moyen`,
              value: "2",
            },
            {
              name: `Difficile`,

              value: "3",
            },
            {
              name: `Légendaire`,
              value: "4",
            },
          ],
          required: true,
        },
        {
          type: 3,
          name: "boss",
          description: "Qui voulez-vous affronter ?",
          choices: [
            { name: `Malakar`, value: "1" },
            { name: `Zarathos`, value: "2" },
            { name: `Xerath`, value: "3" },
            { name: `Lyrathia `, value: "4" },
            { name: `Thalgrimm `, value: "5" },
            { name: `Vorgoth`, value: "6" },
            { name: `Morvath`, value: "7" },
            { name: `Nexar`, value: "8" },
            { name: `Korgath`, value: "9" },
            { name: `Seraphina`, value: "10" },
            { name: `Draugr`, value: "11" },
          ],
          required: true,
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
    const Embedcolors = await dbManager.getColor(interaction.user.id);

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "entrainement":
        const difficulty = interaction.options.getString("difficulté");
        const bossId = interaction.options.getString("boss");

        // Récupérer les informations du boss
        const bossInfo = await bosses.getInfoBossById(bossId);

        // Définir les ajustements en fonction de la difficulté
        const difficultyAdjustments = {
          0: {
            factor: 3,
            rewardMultiplierVictory: 0.4,
            carteBoss: 1,
            rewardMultiplierDefeat: 0.01,
            label: "Noob 🍼",
          },
          1: {
            factor: 9,
            rewardMultiplierVictory: 1,
            carteBoss: 2,
            rewardMultiplierDefeat: 0.3,
            label: "Facile 👼",
          },
          2: {
            factor: 15,
            rewardMultiplierVictory: 1.8,
            carteBoss: 4,
            rewardMultiplierDefeat: 0.8,
            label: "Moyen 🧒",
          },
          3: {
            factor: 24,
            rewardMultiplierVictory: 2.5,
            rewardMultiplierDefeat: 1,
            carteBoss: 8,
            label: "Difficile 💪",
          },
          4: {
            factor: 38,
            rewardMultiplierVictory: 3,
            rewardMultiplierDefeat: 2,
            carteBoss: 10,
            label: "Légendaire 👑",
          },
        };

        const {
          factor,
          rewardMultiplierVictory,
          rewardMultiplierDefeat,
          label: difficultyString,
        } = difficultyAdjustments[difficulty] || {};

        // Calculer les statistiques ajustées
        const attaque = Math.round(bossInfo.attaqueBoost * factor);
        const defense = Math.round(bossInfo.defenseBoost * factor);
        const sante = Math.round(bossInfo.santeBoost * factor);
        const troupe = Math.round(bossInfo.capacity * factor);
        const recompenseV = Math.round(7000 * rewardMultiplierVictory);
        const recompenseD = Math.round(7000 * rewardMultiplierDefeat);
        const cooldownDurationTrain =
          (params.cooldownEntrainement * (difficulty + 1) + 750) * 1000;
        const cooldownDurationBoss = 86400 * 1000; // 24h en secondes
        const commandNameBoss = `entrainement_${bossInfo.nom}`;
        const commandNameTrain = `entrainement`;
        const getDiscordTimestamp = (secondsRemaining) => {
          const timestamp = Math.floor(
            (Date.now() + secondsRemaining * 1000) / 1000
          );
          return `<t:${timestamp}:R>`;
        };

        const cooldownInfosBoss = await cooldown.isOnCooldown(
          interaction.user.id,
          commandNameBoss,
          cooldownDurationBoss
        );

        const cooldownInfosTrain = await cooldown.isOnCooldown(
          interaction.user.id,
          commandNameTrain,
          cooldownDurationTrain
        );
        let stringCooldown = "";
        const nomBoss = bossInfo.nom.split(",")[0].trim();
        if (cooldownInfosBoss.remainingTime > 0) {
          const bossTimestamp = getDiscordTimestamp(
            cooldownInfosBoss.remainingTime
          );
          stringCooldown += `**${nomBoss} : ** 💤\n- Fin ${bossTimestamp}\n`;
        } else {
          stringCooldown += `> **${nomBoss} : **  ✅\n`;
        }

        if (cooldownInfosTrain.remainingTime > 0) {
          const trainTimestamp = getDiscordTimestamp(
            cooldownInfosTrain.remainingTime
          );
          stringCooldown += `**${interaction.user.username} : ** 💤\n- Fin ${trainTimestamp}\n`;
        } else {
          stringCooldown += `> **${interaction.user.username} : ** ✅\n`;
        }
        // Créer l'embed pour le duel
        const embed = new EmbedBuilder()
          .setTitle(`Entraînement avec ${bossInfo.nom}`)
          .setThumbnail(bossInfo.image)
          .setDescription(
            `${bossInfo.lore}\n\n${stringCooldown}\n***Carte du boss 🃏***`
          )
          .addFields(
            { name: "Nom du Boss", value: bossInfo.nom, inline: true },
            {
              name: "Difficulté",
              value: `**${difficultyString}**`,
              inline: true,
            },
            { name: " ", value: ` ` },
            {
              name: "➕ Habilités",
              value: `- *${bossInfo.habilite1}*\n- *${bossInfo.habilite2}*`,
            },
            {
              name: "➖ Faiblesse",
              value: `- *${bossInfo.faiblesse1}*\n- *${bossInfo.faiblesse2}*`,
            },
            {
              name: "Statistiques",
              value: `⚔️__Attaque:__ *${attaque}*\n🛡️__Défense:__ *${defense}*\n💚__Santé:__ *${sante}*`,
              inline: true,
            },
            {
              name: "Récompense",
              value: `Victoire: ${recompenseV} ${emoji(
                emo.power
              )} \nDéfaite: -${recompenseD} ${emoji(emo.power)}`,
              inline: true,
            }
          )
          .setColor(Embedcolors)
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        const isAnyCooldownActive =
          cooldownInfosBoss.remainingTime > 0 ||
          cooldownInfosTrain.remainingTime > 0;

        const verify = isAnyCooldownActive;

        // Créer les boutons d'action
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`start_duel_${interaction.id}`)
            .setLabel("Lancer le duel")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(verify),
          new ButtonBuilder()
            .setCustomId(`cancel_duel_${interaction.id}`)
            .setLabel("Annuler le duel")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(verify)
        );

        // Répondre avec l'embed et les boutons
        await interaction.reply({
          embeds: [embed],
          components: [actionRow],
          fetchReply: true,
        });

        // Fonction pour gérer le collector
        const handleCollector = async () => {
          // Détacher les anciens écouteurs s'ils existent
          if (client.collectors && client.collectors[interaction.id]) {
            client.collectors[interaction.id].stop();
          }

          const filter = (i) =>
            i.customId.startsWith(`start_duel_${interaction.id}`) ||
            i.customId.startsWith(`cancel_duel_${interaction.id}`);
          const collector = interaction.channel.createMessageComponentCollector(
            {
              filter,
              time: 60000,
            }
          );

          // Stocker le collector avec l'ID d'interaction pour éviter les conflits
          if (!client.collectors) {
            client.collectors = {};
          }
          client.collectors[interaction.id] = collector;

          collector.on("collect", async (i) => {
            // Vérifier que l'utilisateur qui interagit est bien celui qui a lancé l'interaction
            if (i.user.id !== interaction.user.id) {
              return i.reply({
                content: "Vous ne pouvez pas interagir avec ce message.",
                ephemeral: true,
              });
            }

            if (i.customId === `start_duel_${interaction.id}`) {
              const powerCosts = [
                { minAttack: 960, cost: 400, validDifficulties: [0, 1, 2] },
                { minAttack: 560, cost: 200, validDifficulties: [0, 1] },
                { minAttack: 200, cost: 100, validDifficulties: [0] },
              ];
              const stats = await player.getStatsById(interaction.user.id);

              const powerCost = powerCosts.find(
                (cost) =>
                  stats.attaque >= cost.minAttack && // Vérifie si l'attaque de l'utilisateur est suffisante
                  cost.validDifficulties.includes(difficulty)
              );
              if (powerCost) {
                await dbManager.updatePower(i.user.id, -powerCost.cost);
                return i.update({
                  content: `> Vous avez pas honte de vous en prendre au plus faible 😱 ?\n **-${
                    powerCost.cost
                  }** ${emoji(emo.power)}`,
                  embeds: [],
                  components: [],
                });
              }

              //mettre en place les nouveaux cooldowns
              await cooldown.setCooldown(
                i.user.id,
                commandNameBoss,
                cooldownDurationBoss
              );
              await cooldown.setCooldown(
                i.user.id,
                commandNameTrain,
                cooldownDurationTrain
              );

              // Logique pour lancer le duel
              const startEmbed = new EmbedBuilder()
                .setTitle("Duel Commencé")
                .setDescription(
                  `Vous avez commencé un duel contre **${bossInfo.nom}**!`
                )
                .setImage(bossInfo.image)
                .setColor(Embedcolors);

              await i.update({ embeds: [startEmbed], components: [] });
              await bosses.startDuel(
                interaction.user.id,
                bossInfo,
                difficulty,
                i,
                recompenseD,
                recompenseV,
                Embedcolors,
                client,
                factor
              );
            } else if (i.customId === `cancel_duel_${interaction.id}`) {
              // Logique pour annuler le duel
              const cancelEmbed = new EmbedBuilder()
                .setTitle("Duel Annulé")
                .setDescription(
                  `Le duel contre **${bossInfo.nom}** a été annulé.`
                )
                .setColor(color.error);

              await i.update({ embeds: [cancelEmbed], components: [] });
            }
          });
          collector.on("end", () => {
            actionRow.components.forEach((component) =>
              component.setDisabled(true)
            );
            interaction.editReply({ components: [actionRow] });
          });
        };

        // Appeler la fonction pour gérer le collector
        handleCollector();

      case "solo":
        return interaction.reply({
          content: "Commande à venir",
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

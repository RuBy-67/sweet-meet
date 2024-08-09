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
            factor: 0.1,
            rewardMultiplierVictory: 0.04,
            rewardMultiplierDefeat: 0.03,
            label: "Noob 🍼",
          },
          1: {
            factor: 0.3,
            rewardMultiplierVictory: 0.25,
            rewardMultiplierDefeat: 0.1,
            label: "Facile 👼",
          },
          2: {
            factor: 0.75,
            rewardMultiplierVictory: 0.75,
            rewardMultiplierDefeat: 0.5,
            label: "Moyen 🧒",
          },
          3: {
            factor: 1.88,
            rewardMultiplierVictory: 1.25,
            rewardMultiplierDefeat: 1,
            label: "Difficile 💪",
          },
          4: {
            factor: 2.88,
            rewardMultiplierVictory: 2,
            rewardMultiplierDefeat: 1.25,
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
        const attaque = Math.round(bossInfo.attaque * factor);
        const defense = Math.round(bossInfo.defense * factor);
        const sante = Math.round(bossInfo.sante * factor);
        const recompenseV = Math.round(8000 * rewardMultiplierVictory);
        const recompenseD = Math.round(8000 * rewardMultiplierDefeat);
        const cooldownDurationTrain =
          (params.cooldownEntrainement * difficulty + 350) * 1000;
        const cooldownDurationDifficulty = 3600 * 1000; // 1 heure en secondes
        const cooldownDurationBoss = 172800 * 1000; // 2 jours en secondes

        const commandNameDifficulty = `entrainement_${difficulty}`;
        const commandNameBoss = `entrainement_${bossInfo.nom}_${difficulty}`;
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
        const cooldownInfosDifficulty = await cooldown.isOnCooldown(
          interaction.user.id,
          commandNameDifficulty,
          cooldownDurationDifficulty
        );
        const cooldownInfosTrain = await cooldown.isOnCooldown(
          interaction.user.id,
          commandNameTrain,
          cooldownDurationTrain
        );
        let stringCooldown = "";
        if (cooldownInfosBoss.remainingTime > 0) {
          const bossTimestamp = getDiscordTimestamp(
            cooldownInfosBoss.remainingTime
          );
          stringCooldown += `Boss: ❌ En cooldown, ${bossTimestamp}\n`;
        } else {
          stringCooldown += `Boss: ✅\n`;
        }

        if (cooldownInfosDifficulty.remainingTime > 0) {
          const difficultyTimestamp = getDiscordTimestamp(
            cooldownInfosDifficulty.remainingTime
          );
          stringCooldown += `Difficulté: ❌ En cooldown, ${difficultyTimestamp}\n`;
        } else {
          stringCooldown += `Difficulté: ✅\n`;
        }

        if (cooldownInfosTrain.remainingTime > 0) {
          const trainTimestamp = getDiscordTimestamp(
            cooldownInfosTrain.remainingTime
          );
          stringCooldown += `Entraînement: ❌ En cooldown, ${trainTimestamp}\n`;
        } else {
          stringCooldown += `Entraînement: ✅\n`;
        }
        // Créer l'embed pour le duel
        const embed = new EmbedBuilder()
          .setTitle(`Entraînement avec ${bossInfo.nom}`)
          .setThumbnail(bossInfo.image)
          .setDescription(
            `*${bossInfo.lore}*\n\n${stringCooldown}\n***Carte du boss 🃏***`
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

        // Créer les boutons d'action
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`start_duel_${interaction.id}`)
            .setLabel("Lancer le duel")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(
              cooldownInfosBoss || cooldownInfosDifficulty || cooldownInfosTrain
            ),
          new ButtonBuilder()
            .setCustomId(`cancel_duel_${interaction.id}`)
            .setLabel("Annuler le duel")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(
              cooldownInfosBoss || cooldownInfosDifficulty || cooldownInfosTrain
            )
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

          // Créer un nouveau collector pour gérer les interactions des boutons
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
              const stats = await player.getStatsById(interaction.user.id);

              if (
                stats.attaque >= 100 &&
                (difficulty == 0 || difficulty == 1)
              ) {
                await dbManager.updatePower(i.user.id, -100);
                return i.update({
                  content: `> Vous avez pas honte de vous en prendre au plus faible ?\n **-100** ${emoji(
                    emo.power
                  )}`,
                  embeds: [],
                  components: [],
                });
              } else if (
                stats.attaque >= 560 &&
                (difficulty == 0 || difficulty == 1 || difficulty == 2)
              ) {
                await dbManager.updatePower(i.user.id, -200);
                return i.update({
                  content: `> Vous avez pas honte de vous en prendre au plus faible ?\n **-200** ${emoji(
                    emo.power
                  )}`,
                  embeds: [],
                  components: [],
                });
              }

              //reverification des cooldowns

              if (cooldownInfosBoss.remainingTime > 0) {
                const remainingTime =
                  cooldownInfosBoss.remainingTime.toFixed(1);
                const timestamp = Math.floor(
                  (Date.now() + remainingTime * 1000) / 1000
                );
                await i.reply({
                  content: `Vous êtes en cooldown pour le boss **${bossInfo.nom}** en difficulté **${difficultyString}**, laissez un temps de repos 💤 au boss.\n\n> Veuillez réessayer <t:${timestamp}:R>`,
                  ephemeral: true,
                });
                return;
              }

              // Vérifiez ensuite le cooldown spécifique à la difficulté

              if (cooldownInfosDifficulty.remainingTime > 0) {
                const remainingTime =
                  cooldownInfosDifficulty.remainingTime.toFixed(1);
                const timestamp = Math.floor(
                  (Date.now() + remainingTime * 1000) / 1000
                );
                await i.reply({
                  content: `Vous êtes en cooldown pour la difficulté: **${difficultyString}**\n> Veuillez réessayer <t:${timestamp}:R>`,
                  ephemeral: true,
                });
                return;
              }

              // Vérifiez enfin le cooldown général de l'entraînement

              if (cooldownInfosTrain.remainingTime > 0) {
                const remainingTime =
                  cooldownInfosTrain.remainingTime.toFixed(1);
                const timestamp = Math.floor(
                  (Date.now() + remainingTime * 1000) / 1000
                );
                await i.reply({
                  content: `Vous êtes en cooldown pour la commande d’entraînement, laissez un temps de repos 💤 à votre personnage\n\n> Veuillez réessayer <t:${timestamp}:R>`,
                  ephemeral: true,
                });
                return;
              }

              // Si aucun cooldown n'est actif, configurez les nouveaux cooldowns
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
              await cooldown.setCooldown(
                i.user.id,
                commandNameDifficulty,
                cooldownDurationDifficulty
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
                client
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

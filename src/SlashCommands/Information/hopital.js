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
      description: "soigner vos troupe tombées au combat",
    },
    {
      type: 1,
      name: "info", /// ok
      description: "info sur votre hôpital",
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
              "https://media.discordapp.net/attachments/1246893100790448198/1285311936971407461/image.png?ex=66e9cf85&is=66e87e05&hm=97bdd05db43e1f019dd1d5b5da6c02fbb66fcd41e0b4ebf8df087176a1262fa4&=&format=webp&quality=lossless&width=608&height=608"
            )
            .setDescription(
              "l’hôpital permet de soigner vos troupes tombées au combat. Plus le niveau de l’hôpital est élevé, plus le temps de soin est réduit.\n- Les troupes dans l’hôpital ne compte pas dans votre puissance totale."
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
        const [troopToHeal] = await dbManager.getTroopToHeal(userId); // contient lvl de l'osto
        const [troopHealing] = await dbManager.getTroopHealing(userId); //troupe en cours de soins contient tsmp de fin de soin
        const troopsToHeal = Object.entries(troopToHeal)
          .filter(
            ([key, value]) =>
              value > 0 &&
              key !== "id" &&
              key !== "discordId" &&
              key !== "lvl" &&
              key !== "troopEndTime"
          )
          .map(([key, value]) => {
            // Extraire le type de troupe et le niveau
            const match = key.match(
              /(archer|chevalier|infanterie|machine)Lvl(\d+)/
            );
            if (match) {
              return {
                type: match[1], // 'archer', 'chevalier', etc.
                level: match[2], // '1', '2', etc.
                count: value, // Le nombre de troupes
              };
            }
          })
          .filter(Boolean);

        let troopsInHeal = [];

        if (troopHealing) {
          troopsInHeal = Object.entries(troopHealing)
            .filter(
              ([key, value]) =>
                value > 0 &&
                key !== "id" &&
                key !== "discordId" &&
                key !== "lvl" &&
                key !== "troopEndTime"
            )
            .map(([key, value]) => {
              // Extraire le type de troupe et le niveau
              const match = key.match(
                /(archer|chevalier|infanterie|machine)Lvl(\d+)/
              );
              if (match) {
                return {
                  type: match[1], // 'archer', 'chevalier', etc.
                  level: match[2], // '1', '2', etc.
                  count: value, // Le nombre de troupes
                };
              }
            })
            .filter(Boolean);
        }
        console.log(troopsInHeal); // ok

        const currentCapacity = troopsToHeal.reduce((total, troop) => {
          return total + troop.count; // Additionne le nombre de troupes de chaque type et niveau
        }, 0);
        const currentTroopInHeal = troopsInHeal.reduce((total, troop) => {
          return total + troop.count; // Additionne le nombre de troupes de chaque type et niveau
        }, 0);

        //détail  hopital
        const hopitalL = await dbManager.getHospitalLvl(userId);
        const hopital = hopitalL[0].lvl;
        const bonus = await dbManager.getBonus("hopital");
        const powerUpdate = await dbManager.getPower(userId);
        const formattedPower = powerUpdate.toLocaleString("fr-FR", {
          useGrouping: true,
        });

        let bonus1 = bonus.bonus1 * hopital;
        let bonus2 = hopital >= 10 ? bonus.bonus2 * (hopital - 6) : 0;
        let bonus3 = hopital >= 22 ? bonus.bonus3 * (hopital - 15) : 0;
        if (hopital === 25) {
          bonus3 = Math.round(bonus3 * 1.4);
          bonus1 = Math.round(bonus1 * 2.5);
          bonus2 = Math.round(bonus2 * 1.7);
        }
        const HopitalCapacity =
          params.batiment.hopital.baseCapacity * hopital * 1 +
          bonus1 * 100 -
          100;
        function getEmoji(troopType, level) {
          const emojiName = `${troopType}${level}`;
          return emoji(emo[emojiName]) || "❔";
        }
        function capitalize(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }
        function formatTime(seconds) {
          if (seconds >= 86400) {
            // Plus de 24 heures
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${days} jour${
              days > 1 ? "s" : ""
            } ${hours} h ${minutes} min `;
          } else if (seconds >= 3600) {
            // Plus de 1 heure
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours} h ${minutes} min ${secs} s`;
          } else if (seconds >= 120) {
            // Plus de 2 minutes
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes} min ${secs} s`;
          } else {
            // Moins de 2 minutes
            return `${seconds} s`;
          }
        }
        if (troopsToHeal.length === 0 && troopsInHeal.length > 0) {
          const troopsToHealString = troopsToHeal
            .map(
              (troop) =>
                `- ${capitalize(troop.type)} niveau ${troop.level} : **${
                  troop.count
                }** ${getEmoji(troop.type, troop.level)}`
            )
            .join("\n");

          const troopsInHealString = troopsInHeal
            .map(
              (troop) =>
                `- ${capitalize(troop.type)} niveau ${troop.level} : **${
                  troop.count
                }** ${getEmoji(troop.type, troop.level)}`
            )
            .join("\n");

          const hEmbedOccupped = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Hôpital")
            .setDescription(
              `Capacité de l'hopital : **${currentCapacity}**/${HopitalCapacity}\n`
            )
            .addFields(
              {
                name: "Troupes à soigner",
                value: `Aucune troupe à soigner`,
              },
              {
                name: "Troupes en cours de soins",
                value: `Il y a actuellement **${currentTroopInHeal}** troupe(s) en cours de soins\n__Détails:__ \n${troopsInHealString}\nFin <t:${troopHealing.troopEndTime}:R>`,
              }
            )
            .setColor(colors)
            .setThumbnail(
              "https://media.discordapp.net/attachments/1246893100790448198/1285311936971407461/image.png?ex=66e9cf85&is=66e87e05&hm=97bdd05db43e1f019dd1d5b5da6c02fbb66fcd41e0b4ebf8df087176a1262fa4&=&format=webp&quality=lossless&width=608&height=608"
            );
          return interaction.reply({
            embeds: [hEmbedOccupped],
            ephemeral: true,
          });
        } else if (troopsToHeal.length > 0 && troopsInHeal.length === 0) {
          let chevalier = true;
          let archer = true;
          let infanterie = true;
          let machine = true;
          const troopsToHealString = troopsToHeal
            .map((troop) => {
              // Calcul du prix et du temps de soins
              const baseHealingTime = 8 * Math.pow(2, troop.level - 1); // Temps de soin en secondes (8s * 2^level)
              const reducedHealingTime = Math.round(
                baseHealingTime * (1 - bonus2 / 100)
              ); // Réduction du temps de soin
              const baseHealingCost = 8 * Math.pow(2, troop.level - 1); // Prix de soin en fragments
              const reducedHealingCost = Math.round(
                baseHealingCost * (1 - bonus3 / 100)
              ); // Réduction du coût de soin
              if (troop.type === "chevalier") {
                chevalier = false;
              }
              if (troop.type === "archer") {
                archer = false;
              }
              if (troop.type === "infanterie") {
                infanterie = false;
              }
              if (troop.type === "machine") {
                machine = false;
              }
              return `- ${capitalize(troop.type)} niveau ${troop.level} : **${
                troop.count
              }** ${getEmoji(troop.type, troop.level)}\nPrix: ${
                reducedHealingCost * troop.count
              } ${emoji(emo.power)} \nTemps: ${formatTime(
                reducedHealingTime * troop.count
              )}`;
            })
            .join("\n");

          const hEmbedAvailable = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Hôpital")
            .setDescription(
              `Capacité de l'hopital : **${currentCapacity}**/${HopitalCapacity}`
            )
            .addFields({
              name: "Troupes à soigner",
              value: `${troopsToHealString}`,
            })
            .setColor(colors)
            .setThumbnail(
              "https://media.discordapp.net/attachments/1246893100790448198/1285311936971407461/image.png?ex=66e9cf85&is=66e87e05&hm=97bdd05db43e1f019dd1d5b5da6c02fbb66fcd41e0b4ebf8df087176a1262fa4&=&format=webp&quality=lossless&width=608&height=608"
            );

          // Création des boutons pour soigner par pourcentage (25%, 50%, 100%)
          const actionRowHealPercentage = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("heal_100")
              .setLabel("Tout Soigner")
              .setStyle(ButtonStyle.Primary)
          );

          // Création des boutons pour soigner par type de troupe (archer, chevalier, machine, infanterie)
          const actionRowHealByType = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("heal_archer")
              .setLabel("Soigner Archers")
              .setDisabled(archer)
              .setEmoji(emo.archer5)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("heal_chevalier")
              .setLabel("Soigner Chevaliers")
              .setDisabled(chevalier)
              .setEmoji(emo.chevalier5)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("heal_infanterie")
              .setLabel("Soigner Infanterie")
              .setDisabled(infanterie)
              .setEmoji(emo.infanterie5)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("heal_machine")
              .setLabel("Soigner Machines")
              .setDisabled(machine)
              .setEmoji(emo.machine5)
              .setStyle(ButtonStyle.Secondary)
          );

          // Création des listeners pour les boutons
          const filter = (i) =>
            i.customId.startsWith("heal") && i.user.id === interaction.user.id;

          const collector = interaction.channel.createMessageComponentCollector(
            {
              filter,
              time: 60000, // 60 secondes de collecte
            }
          );

          collector.on("collect", async (i) => {
            console.log(i.customId);
            let healPercentage = 0;
            let healType = null;
            if (i.customId === "heal_100") healPercentage = 1;
            else if (i.customId.startsWith("heal_")) {
              healPercentage = 1; // Soigner 100% pour les types de troupes spécifiques
              healType = i.customId.split("_")[1]; // Type de troupe à soigner
            }

            // Calcul des troupes à soigner en fonction du pourcentage ou du type sélectionné
            const troopsToHealByType = healType
              ? troopsToHeal.filter((troop) => troop.type === healType)
              : troopsToHeal;

            const totalTroopsToHeal = Math.round(
              troopsToHealByType.reduce((acc, troop) => acc + troop.count, 0) *
                healPercentage
            );

            // Si tout est correct, soigner les troupes
            let totalHealingCost = 0;
            let totalHealingTime = 0;

            troopsToHealByType.forEach((troop) => {
              const baseHealingCost = 8 * Math.pow(2, troop.level - 1);
              const reducedHealingCost = Math.round(
                baseHealingCost * (1 - bonus3 / 100)
              );
              totalHealingCost +=
                reducedHealingCost * Math.round(troop.count * healPercentage);

              const baseHealingTime = 8 * Math.pow(2, troop.level - 1);
              const reducedHealingTime = Math.round(
                baseHealingTime * (1 - bonus2 / 100)
              );
              totalHealingTime +=
                reducedHealingTime * Math.round(troop.count * healPercentage);
            });

            // Déduire les fragments nécessaires du joueur
            const userFragments = await dbManager.getStats(userId);
            if (userFragments.fragment < totalHealingCost) {
              return i.reply({
                content: `Vous n'avez pas assez de fragments pour soigner les troupes. Coût total : **${totalHealingCost}** ${emoji(
                  emo.power
                )}.`,
                ephemeral: true,
              });
            }

            // Mise à jour de la base de données (début des soins, déduction des fragments, etc.)
            await dbManager.startTroopHealing(
              userId,
              totalHealingTime,
              healType
            );
            // await dbManager.updatePower(userId, -totalHealingCost);

            // Confirmation
            return i.update({
              content: `Soins en cours pour ${totalTroopsToHeal} troupes.\nTemps estimé : **${formatTime(
                totalHealingTime
              )}**.\nPrix total : **${totalHealingCost}** ${emoji(emo.power)}`,
              embeds: [],
              components: [],
              ephemeral: true,
            });
          });

          collector.on("end", (collected) => {
            if (collected.size === 0) {
              return interaction.editReply({
                content:
                  "Temps écoulé, aucune action de soins n'a été sélectionnée.",
                components: [],
              });
            }
          });

          // Maintenant, on peut envoyer l'embed et les boutons
          return interaction.reply({
            embeds: [hEmbedAvailable],
            components: [actionRowHealPercentage, actionRowHealByType],
            ephemeral: true,
          });
        } else if (troopsToHeal.length > 0 && troopsInHeal.length > 0) {
          const troopsToHealString = troopsToHeal
            .map(
              (troop) =>
                `- ${capitalize(troop.type)} niveau ${troop.level} : **${
                  troop.count
                }** ${getEmoji(troop.type, troop.level)}`
            )
            .join("\n");

          const troopsInHealString = troopsInHeal
            .map(
              (troop) =>
                `- ${capitalize(troop.type)} niveau ${troop.level} : **${
                  troop.count
                }** ${getEmoji(troop.type, troop.level)}`
            )
            .join("\n");

          const hEmbedOccupped = new EmbedBuilder()
            .setAuthor({
              name: `Puissance : ${formattedPower}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle("Hôpital")
            .setDescription(
              `Capacité de l'hopital : **${currentCapacity}**/${HopitalCapacity}\n`
            )
            .addFields(
              {
                name: "Troupes à soigner",
                value: `${troopsToHealString}`,
              },
              {
                name: "Troupes en cours de soins",
                value: `Il y a actuellement **${currentTroopInHeal}** troupe(s) en cours de soins\nFin <t:${troopHealing.troopEndTime}:R>\nDétails: \n${troopsInHealString}`,
              }
            )
            .setColor(colors)
            .setThumbnail(
              "https://media.discordapp.net/attachments/1246893100790448198/1285311936971407461/image.png?ex=66e9cf85&is=66e87e05&hm=97bdd05db43e1f019dd1d5b5da6c02fbb66fcd41e0b4ebf8df087176a1262fa4&=&format=webp&quality=lossless&width=608&height=608"
            );
          return interaction.reply({
            embeds: [hEmbedOccupped],
            ephemeral: true,
          });
        } else {
          const embed = new EmbedBuilder()
            .setTitle("Hôpital")
            .setDescription("Aucune troupe à soigner.")
            .setColor(colors)
            .setThumbnail(
              "https://media.discordapp.net/attachments/1246893100790448198/1285311936971407461/image.png?ex=66e9cf85&is=66e87e05&hm=97bdd05db43e1f019dd1d5b5da6c02fbb66fcd41e0b4ebf8df087176a1262fa4&=&format=webp&quality=lossless&width=608&height=608"
            );
          return interaction.reply({
            content: "Erreurs de cas",
            ephemeral: true,
          });
        }

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

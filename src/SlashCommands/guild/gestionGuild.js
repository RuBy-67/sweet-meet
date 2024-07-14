const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const params = require("../../jsons/param.json");
const color = require("../../jsons/color.json");
const guild = require("./guild");

module.exports = {
  name: "gestionguild",
  description: "🚨 Empreur, reine et ministre de la guilde",
  options: [
    {
      type: 1, 
      name: "update",
      description: "Mettre à jour les informations de la guilde",
      options: [
        {
          type: 3, 
          name: "choix",
          description:
            "Que voulez-vous mettre à jour ? (description, tag, bannière, statutInvit)",
          choices: [
            {
              name: `Name [coût: ${params.changeGuildName}]`,
              value: "nom",
            },
            {
              name: `Description [coût: ${params.changeGuildDescription}]`,
              value: "description",
            },
            {
              name: `Bannière [coût: ${params.changeGuildBanner}]`,
              value: "banniere",
            },
            {
              name: `StatutInvit [coût: ${params.changeGuildStatut}]`,
              value: "statutinvit",
            },
          ],
          required: true,
        },
        {
          type: 3,
          name: "valeur",
          description: "valeur",
          required: false,
        },
        {
          type: 3, 
          name: "statutinvit",
          description: "mettre à jour le statut d'invitation de la guilde",
          choices: [
            {
              name: "🟡 Sur invitation",
              value: "1",
            },
            {
              name: "🔴 Fermé",
              value: "2",
            },
            {
              name: "🟢 Ouvert",
              value: "3",
            },
          ],
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "upgrade",
      description: "Améliorer la guilde (level)",
    },
    {
      type: 2,
      name: "membre",
      description: "gérer les membres de la guilde",
      options: [
        {
          type: 1,
          name: "kick",
          description: "Exclure un membre de la guilde",
        },
        {
          type: 1,
          name: "promote",
          description: "Promouvoir un membre de la guilde",
        },
        {
          type: 1,
          name: "demote",
          description: "Rétrograder un membre de la guilde",
        },
        {
          type: 1,
          name: "invite",
          description: "Inviter un joueur dans la guilde",
          options: [
            {
              type: 6, // 6 corresponds à USER
              name: "membre",
              description: "Membre à inviter",
              required: false,
            },
          ],
        },
        {
          type: 1,
          name: "accept",
          description: "Accepter une demande dans la guilde",
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
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    let guildId = await dbManager.getStats(interaction.user.id);
    const guildInfo = await dbManager.getGuildInfo(guildId.guildId);
    guildId = guildId.guildId;
    const verif = await dbManager.isGuildAdmin(interaction.user.id, guildId);
    if (!verif) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 Erreur 🚨")
        .setColor(color.error)
        .setDescription(
          `> Vous n'êtes pas autorisé à utiliser cette commande.`
        );
      return interaction.reply({ embeds: [embed] });
    }
    console.log("vérification guildId" + guildId);
    switch (subCommand) {
      case "update":
        const choix = interaction.options.getString("choix");
        const valeur = interaction.options.getString("valeur");
        const statutInvit = interaction.options.getString("statutinvit");

        switch (choix) {
          case "nom":
            // Mettre à jour le nom de la guilde avec 'valeur'
            if (!valeur) {
              return interaction.reply({
                content:
                  "Veuillez fournir une valeur pour mettre à jour le nom de la guilde.",
                ephemeral: true,
              });
            }
            if (valeur.length > 20) {
              return interaction.reply({
                content:
                  "Le nom de la guilde ne peut pas dépasser 20 caractères.",
                ephemeral: true,
              });
            }
            if (guildInfo.banque < params.changeGuildName) {
              return interaction.reply({
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [${
                  params.changeGuildName
                } ${emoji(emo.power)}]`,
              });
            }
            let tag = guildName.substring(0, 3).toUpperCase();
            let suffix = 1;
            let uniqueTag = tag;
            while (await dbManager.getGuildByTag(uniqueTag)) {
              uniqueTag = tag + suffix;
              suffix++;
            }

            // Exemple : Mettre à jour le nom de la guilde dans la base de données
            await dbManager.updateGuildName(guildId, valeur, uniqueTag);
            await dbManager.addGuildBank(guildId, -params.changeGuildName);
            await interaction.reply({
              content: `Nom de la guilde mis à jour avec succès à : ${valeur}\nNouveau tag : ${uniqueTag}`,
            });
            break;

          case "description":
            // Mettre à jour la description de la guilde avec 'valeur'
            if (!valeur) {
              return interaction.reply({
                content:
                  "Veuillez fournir une valeur pour mettre à jour la description de la guilde.",
                ephemeral: true,
              });
            }
            if (guildInfo.banque < params.changeGuildDescription) {
              return interaction.reply({
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [${
                  params.changeGuildDescription
                } ${emoji(emo.power)}]`,
              });
            }
            // Mettre à jour la description de la guilde dans la base de données
            await dbManager.updateGuildDescription(guildId, valeur);
            await dbManager.addGuildBank(
              guildId,
              -params.changeGuildDescription
            );
            await interaction.reply({
              content: `Description de la guilde mise à jour avec succès :\n\n> ***${valeur}***`,
            });
            break;

          case "banniere":
            // Mettre à jour la bannière de la guilde avec 'valeur'
            if (!valeur) {
              return interaction.reply({
                content:
                  "Veuillez fournir une valeur pour mettre à jour la bannière de la guilde.",
                ephemeral: true,
              });
            }
            if (!/^#[0-9A-F]{6}$/i.test(valeur)) {
              return interaction.reply({
                content:
                  "Le code couleur de la guilde doit être spécifié en format hexadécimal (par exemple, #ff5733)",
                ephemeral: true,
              });
            }
            if (guildInfo.banque < params.changeGuildBanner) {
              return interaction.reply({
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [${
                  params.changeGuildBanner
                } ${emoji(emo.power)}]`,
              });
            }
            // Exemple : Mettre à jour la bannière de la guilde dans la base de données
            await dbManager.updateGuildBanner(guildId, valeur);
            await dbManager.addGuildBank(guildId, -params.changeGuildBanner);
            const embedBanniere = new MessageEmbed()
              .setDescription(
                `Bannière de la guilde mise à jour avec succès à : ${valeur}`
              )
              .setColor(valeur); // Définir la couleur ici

            await interaction.reply({ embeds: [embedBanniere] });
            break;
          case "statutinvit":
            // Mettre à jour le statut d'invitation de la guilde avec 'statutInvit'
            if (!statutInvit) {
              return interaction.reply({
                content:
                  "Veuillez choisir un statut d'invitation pour mettre à jour la guilde.",
                ephemeral: true,
              });
            }
            if (guildInfo.banque < params.changeGuildStatut) {
              return interaction.reply({
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [${
                  params.changeGuildStatut
                } ${emoji(emo.power)}]`,
              });
            }
            // Exemple : Mettre à jour le statut d'invitation de la guilde dans la base de données
            await dbManager.updateGuildInvitationStatus(
              guildId,
              parseInt(statutInvit)
            );
            await dbManager.addGuildBank(guildId, params.changeGuildStatut);
            let newStatutInvit = "Inconnu";
            if (statutInvit === 1) {
              newStatutInvit = "🟡 Sur invitation";
            } else if (statutInvit === 2) {
              newStatutInvit = "🔴 Fermé";
            } else if (statutInvit === 3) {
              newStatutInvit = "🟢 Ouvert";
            }
            await interaction.reply({
              content: `Statut d'invitation de la guilde mis à jour avec succès à : ${newStatutInvit}`,
            });
            break;

          default:
            return interaction.reply({
              content: "Option invalide.",
              ephemeral: true,
            });
        }

        break;
      case "upgrade":
        // Vérifier si la guilde a atteint le niveau maximal
        if (guildInfo.level >= params.guildlvlMax) {
          return interaction.reply({
            content: "La guilde a déjà atteint le niveau maximal.",
            ephemeral: true,
          });
        }

        // Vérifier si la guilde a assez d'XP pour l'amélioration
        const requiredXP = parseInt(params.xp[guildInfo.level]);
        if (guildInfo.xp < requiredXP) {
          return interaction.reply({
            content: `La guilde n'a pas assez d'XP pour passer au niveau suivant. Il lui faut au moins ${requiredXP} ${emoji(
              emo.xp
            )}.`,
            ephemeral: true,
          });
        }

        // Vérifier si la guilde a assez de fragments pour l'amélioration
        const upgradePrice = params.upgradePrice[guildInfo.level];
        if (guildInfo.banque < upgradePrice) {
          return interaction.reply({
            content: `La guilde n'a pas assez de fragments dans la banque pour effectuer cette amélioration. Il lui faut au moins ${upgradePrice} ${emoji(
              emo.power
            )}.`,
            ephemeral: true,
          });
        }

        // Mettre à jour le niveau de la guilde et déduire les ressources nécessaires
        const newGuildLevel = guildInfo.level + 1;
        const bonusBanque = newGuildLevel * 10000;
        const bonusMembre = newGuildLevel * 2000;
        const colors = guildInfo.banniere;
        await dbManager.updateGuildLevel(guildId, newGuildLevel);
        await dbManager.addGuildBank(guildId, -upgradePrice);
        await dbManager.addGuildBank(guildId, bonusBanque);
        await dbManager.addGuildMemberPower(guildId, bonusMembre);

        // Répondre avec un message de succès
        const embed = new EmbedBuilder()
          .setTitle(`Mise à jour de la Guilde : ${guildInfo.nom}`)
          .setColor(colors)
          .setDescription(
            `La guilde a été améliorée avec succès au niveau ${newGuildLevel}.`
          )
          .addFields(
            {
              name: `Membre supplémentaire`,
              value: `+ ${
                params.member[newGuildLevel] - params.member[guildInfo.level]
              } ${emoji(emo.member)}`,
            },
            {
              name: `Ministre Suplèmentaire`,
              value: `${params.maxMinistre[newGuildLevel]} *(+1)* ${emoji(
                emo.ministre
              )}`,
            },
            {
              name: `Fragments ajoutés (banque --> Bonus)`,
              value: `${bonusBanque} ${emoji(emo.power)}`,
            },
            {
              name: `Fragments ajoutés (membre --> Bonus)`,
              value: `${bonusMembre} ${emoji(emo.power)}`,
            }
          );

        // Répondre avec l'embed créé
        return interaction.reply({ embeds: [embed] });

      case "membre":
        const subSubCommand = interaction.options.getSubcommand();

        switch (subSubCommand) {
          case "kick":
            // Logique pour la sous-commande "kick"
            break;

          case "promote":
            // Logique pour la sous-commande "promote"
            break;

          case "demote":
            // Logique pour la sous-commande "demote"
            break;

          case "invite":
            const userId = interaction.options.getUser("Membre").id;
            // Logique pour inviter un membre
            break;

          case "accept":
            // Logique pour accepter une demande dans la guilde
            break;

          default:
            await interaction.reply({
              content: "Sous-commande invalide pour la commande 'membre'.",
              ephemeral: true,
            });
            break;
        }
        break;

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
        break;
    }
  },
};

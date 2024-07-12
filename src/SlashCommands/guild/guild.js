const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const color = require("../../jsons/color.json");
const params = require("../../jsons/param.json");

module.exports = {
  name: "guild",
  description: "Gérer les guildes",
  options: [
    {
      type: 1, // 1 corresponds to a subcommand
      name: "info",
      description: "Obtenir les infos d'une guilde",
      options: [
        {
          type: 3, // 3 corresponds to a STRING
          name: "tag",
          description: "Tag de la guilde (facultatif)",
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "join",
      description: "Rejoindre une guilde",
      options: [
        {
          type: 3, // 3 corresponds to a STRING
          name: "tag",
          description: "tag de la guilde (facultatif)",
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "leave",
      description: "Quitter sa guilde actuelle",
    },
    {
      type: 1,
      name: "give",
      description: "Donner à sa guilde",
      options: [
        {
          type: 4, // 4 corresponds to an INTEGER
          name: "amount",
          description: "Montant à donner",
          required: true,
        },
      ],
    },
  ],
  run: async (client, interaction, args) => {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
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

    switch (subcommand) {
      case "info":
        const guildName = interaction.options.getString("tag");
        let guildInfo;

        if (guildName) {
          // Recherche de la guilde par son nom
          guildInfo = await dbManager.getGuildByName(guildName);

          if (!guildInfo) {
            interaction.reply({
              content:
                "Aucune guilde trouvée avec ce tag (c'est les 3 première lettre).",
              ephemeral: true,
            });
          }
        } else {
          // Récupération de la guilde de l'utilisateur
          const guildMember = await dbManager.getStats(userId);
          if (guildMember.guildId === null) {
            return interaction.reply({
              content: "Vous n'appartenez à aucune guilde.",
              ephemeral: true,
            });
          } else {
            guildInfo = await dbManager.getGuildInfo(guildMember.guildId);
          }
        }
        const getMembers = await dbManager.getGuildMembers(guildInfo.id);
        const totalPower = getMembers.reduce(
          (acc, member) => acc + member.power,
          0
        );
        const reine = await dbManager.getGuildUserByRole(guildInfo.id, 1);
        let reineInfo = "";
        if (reine.length > 0) {
          reineInfo = `<@${reine.id}>`;
        } else {
          reineInfo = "Aucune reine";
        }
        const ministres = await dbManager.getGuildUserByRole(guildInfo.id, 2);
        let ministresInfo = "";
        if (ministres.length > 0) {
          const ministresWithEmoji = ministres.map((ministre) => {
            return `- ${emoji(emo.ministre)} <@${ministre.id}>\n`;
          });
          ministresInfo = ministresWithEmoji.join(", ");
          if (ministres.length > 1) {
            ministresInfo += "s";
          }
        } else {
          ministresInfo = "Aucun ministre";
        }

        let statutInvit = "Inconnu";
        if (guildInfo.statutInvit === 1) {
          statutInvit = "🟡 Sur invitation";
        } else if (guildInfo.statutInvit === 2) {
          statutInvit = "🔴 Fermé";
        } else if (guildInfo.statutInvit === 3) {
          statutInvit = "🟢 Ouvert";
        }

        let emoLevel = emoji(emo.level12);
        if (guildInfo.level === 3 || guildInfo.level === 4) {
          emoLevel = emoji(emo.level34);
        } else if (guildInfo.level === 5) {
          emoLevel = emoji(emo.level5);
        }
        const xpString =
          guildInfo.xp.toString() + "/" + parseInt(params.xp[guildInfo.level]);
        const colors = guildInfo.bannière;
        const embedInfo = new EmbedBuilder()
          .setTitle(`Infos de la guilde ${guildInfo.nom}`)
          .setColor(colors)
          .setDescription("***" + guildInfo.description + "***")
          .addFields(
            {
              name: `tag de guilde`,
              value: `${guildInfo.tag}`,
            },
            {
              name: `${emoji(emo.King)} Empreur`,
              value: `<@${guildInfo.empreur}>`,
              inline: true,
            },
            {
              name: `${emoji(emo.reine)} Reine`,
              value: reineInfo,
              inline: true,
            },
            {
              name: "Ministre",
              value: ministresInfo,
              inline: true,
            },
            {
              name: `${emoji(emo.xp)} XP`,
              value: xpString,
              inline: true,
            },
            {
              name: emoLevel + " Niveau",
              value: guildInfo.level.toString(),
              inline: true,
            },
            {
              name: "Banque",
              value:
                guildInfo.banque
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
                " " +
                emoji(emo.power),
              inline: true,
            },
            {
              name: "Statut",
              value: statutInvit,
              inline: true,
            },
            {
              name: "👤 Membre",
              value:
                getMembers.length + "/" + params.maxJoueurLvl[guildInfo.level],
              inline: true,
            },
            {
              name: "Richesse",
              value:
                (totalPower + guildInfo.banque)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
                " " +
                emoji(emo.power),
              inline: true,
            }
          );

        return interaction.reply({ embeds: [embedInfo] });

      case "join":
        try {
          if (!tag) {
            // User did not provide a tag
            const invitations = await dbManager.getUserInvitation(userId);
            if (invitations.length === 0) {
              return interaction.reply({
                content: "Vous n'avez aucune invitation en attente.",
                ephemeral: true,
              });
            } else if (invitations.length === 1) {
              // Automatically join the guild with the single invitation
              const guildId = invitations[0].guildId;
              await dbManager.joinGuild(userId, guildId);
              return interaction.reply(
                `Vous avez rejoint la guilde avec le tag ${invitations[0].tag}.`
              );
            } else {
              // Multiple invitations, show an embed with the list of guilds
              const embed = new EmbedBuilder()
                .setTitle("Invitations en attente")
                .setDescription(
                  "Vous avez plusieurs invitations en attente. Veuillez choisir une guilde en utilisant la commande `/guild join` avec le tag de la guilde."
                )
                .setColor(color.pink);

              for (const invitation of invitations) {
                const guildInfo = await dbManager.getGuildInfo(
                  invitation.guildId
                );
                embed.addFields({
                  name: "Guilde : " + guildInfo.nom,
                  value: "**" + guildInfo.tag + "**",
                });
              }

              return interaction.reply({ embeds: [embed] });
            }
          } else {
            // User provided a tag
            const guild = await dbManager.getGuildByTag(tag);
            if (!guild) {
              return interaction.reply("Guilde non trouvée avec ce tag.");
            }

            switch (guild.type) {
              case 3:
                await dbManager.joinGuild(userId, guild.id);
                return interaction.reply(
                  `Vous avez rejoint la guilde ${guild.nom}.`
                );
              case 2:
                return interaction.reply(
                  "La guilde est fermée et ne peut pas être rejointe."
                );
              case 1:
                const existingInvitation =
                  await dbManager.getUserInvitationByGuild(userId, guild.id);
                if (existingInvitation) {
                  await dbManager.joinGuild(userId, guild.id);
                  return interaction.reply(
                    `Vous avez rejoint la guilde ${guild.nom}.`
                  );
                } else {
                  await dbManager.createInvitation(userId, guild.id, 1);
                  return interaction.reply(
                    `Votre demande pour rejoindre la guilde ${guild.nom} a été envoyée.`
                  );
                }
              default:
                return interaction.reply("Type de guilde inconnu.");
            }
          }
        } catch (error) {
          console.error(error);
          return interaction.reply(
            "Une erreur s'est produite lors de la tentative de rejoindre la guilde."
          );
        }

      case "leave":
        try {
          const resultLeave = await dbManager.leaveGuild(userId);
          return interaction.reply({ content: resultLeave });
        } catch (error) {
          console.error(error);
          return interaction.reply({
            content: error,
            ephemeral: true,
          });
        }
      case "give":
        try {
          const amount = args.find((arg) => arg.name === "amount")?.value;
          // Vérifier si l'utilisateur est membre d'une guilde
          const userStats = await dbManager.getStats(userId);
          if (!userStats.guildId) {
            return interaction.reply(
              "Vous devez être membre d'une guilde pour utiliser cette commande."
            );
          }

          // Rembourser 5% du don à l'utilisateur
          const refund = amount * 0.05;
          const roundedRefund = refund <= 1 ? 0 : Math.floor(refund);
          await dbManager.updatePower(userId, -amount);
          await dbManager.updatePower(userId, roundedRefund);

          // Ajouter le montant à la banque de la guilde
          await dbManager.addGuildBank(userStats.guildId, amount);

          return interaction.reply(
            `Vous avez donné ${amount} ${emoji(
              emo.power
            )} à votre guilde et reçu un remboursement de ${roundedRefund}  ${emoji(
              emo.power
            )}.`
          );
        } catch (error) {
          console.error(error);
          return interaction.reply(
            "Une erreur s'est produite lors de la tentative de donner à votre guilde."
          );
        }

      default:
        return interaction.reply({
          content: "Commande non reconnue.",
          ephemeral: true,
        });
    }
  },
};

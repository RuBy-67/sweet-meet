const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
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
          options: [
            {
              type: 6, // 6 corresponds à USER
              name: "membre",
              description: "Membre à promouvoir",
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: "demote",
          description: "Rétrograder un membre de la guilde",
          options: [
            {
              type: 6, // 6 corresponds à USER
              name: "membre",
              description: "Membre à Retrograder",
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: "setmarchand",
          description: "Promouvoir un membre au rôle de marchand",
          options: [
            {
              type: 6, // 6 corresponds à USER
              name: "membre",
              description: "Membre à promouvoir",
              required: true,
            },
          ],
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
              required: true,
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
    guildId = guildId.guildId;
    const guildInfo = await dbManager.getGuildInfo(guildId);

    const verif = await dbManager.isGuildAdmin(interaction.user.id, guildId);
    if (!verif) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 Erreur 🚨")
        .setColor(color.error)
        .setDescription(
          `> Vous n'êtes pas autorisé à utiliser cette commande, vous devez être Empreur, Reine ou Ministre de guild`
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
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [**${
                  guildInfo.banque
                } / ${params.changeGuildName} ${emoji(emo.power)}**]`,
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
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [**${
                  guildInfo.banque
                } / ${params.changeGuildDescription} ${emoji(emo.power)}**]`,
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
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [**${
                  guildInfo.banque
                } / ${params.changeGuildBanner} ${emoji(emo.power)}**]`,
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
                content: `La guilde n'a pas assez de fragments pour effectuer cette action. [**${
                  guildInfo.banque
                } / ${params.changeGuildStatut} ${emoji(emo.power)}**]`,
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
            )}.\n\n
            **${guildInfo.xp} / ${requiredXP}** ${emoji(emo.xp)}`,
            ephemeral: true,
          });
        }

        // Vérifier si la guilde a assez de fragments pour l'amélioration
        const upgradePrice = params.upgradePrice[guildInfo.level];
        if (guildInfo.banque < upgradePrice) {
          return interaction.reply({
            content: `La guilde n'a pas assez de fragments dans la banque pour effectuer cette amélioration. Il lui faut au moins ${upgradePrice} ${emoji(
              emo.power
            )}.\n\n**${guildInfo.banque} / ${upgradePrice}** ${emoji(
              emo.power
            )}`,
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
            const members = dbManager.getGuildMembers(guildId);
            const nonAdminMembers = [];
            for (const member of members) {
              const isAdmin = await dbManager.isGuildAdmin(member.id, guildId);
              if (!isAdmin) {
                const userClass = await dbManager.getUserClass(
                  member.id,
                  guildId
                );
                const user = await client.users.fetch(member.id);
                const emoji = emoji(emo[`class${userClass.idClass}`]) || "❔";
                nonAdminMembers.push({
                  id: member.id,
                  username: user.username,
                  emoji: emoji,
                });
              }
            }
            const memberOptions = nonAdminMembers.map((member) => {
              return {
                emoji: member.emoji,
                label: member.username,
                value: member.id,
              };
            });

            // Si aucun membre n'est éligible pour être exclu
            if (memberOptions.length === 0) {
              return interaction.reply({
                content: "Aucun membre à exclure.",
                ephemeral: true,
              });
            }
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select-kick-member")
                .setPlaceholder("Choisir un membre à exclure")
                .addOptions(memberOptions)
            );

            await interaction.reply({
              content: "Sélectionnez le membre à exclure:",
              components: [row],
              ephemeral: true,
            });

            client.on("interactionCreate", async (interaction) => {
              if (!interaction.isSelectMenu()) return;

              // Vérifier si c'est le menu déroulant pour exclure un membre
              if (interaction.customId !== "select-kick-member") return;

              const memberId = interaction.values[0]; // Récupérer l'ID du membre à exclure
              const isAdmin = await dbManager.isGuildAdmin(memberId, guildId);

              if (isAdmin) {
                await interaction.update({
                  content:
                    "Impossible de kick un membre important de la guilde [EMPREUR, REINE, MINISTRE]",
                  components: [],
                  ephemeral: true,
                });
              } else {
                await dbManager.leaveGuild(memberId); // Exécuter l'action pour exclure le membre
                await interaction.update({
                  content: `Le membre <@${memberId}> a été exclu de la guilde avec succès.`,
                  components: [],
                });
              }
            });

            break;

          case "promote":
            const userIdToPromote = interaction.options.getUser("membre");
            if (!userIdToPromote) {
              return interaction.reply({
                content: "vous devez spécifier un membre à Promouvoire.",
                ephemeral: true,
              });
            }
            if (guildInfo.banque < params.promote.Ministre + 10000) {
              return interaction.reply({
                content: `La banque de Guilde doit au minimum posseder **${
                  params.promote.Ministre + 10000
                }** ${emoji(
                  emo.power
                )}, pour pouvoir promouvoir un membre\n- __Banque Actuelle :__${
                  guildInfo.banque
                } / ${params.promote.Ministre + 10000} ${emoji(emo.power)} `,
                ephemeral: true,
              });
            }

            // verifier si l'utilisateurs à promouvoir, fait partie de la guilde, ou s'il n'est pas déjà admin de la guilde
            const memberToPromote = await dbManager.getStats(
              userIdToPromote.id
            );

            const getMemberClassToPromote = await dbManager.getUserClass(
              memberToPromote,
              guildId
            );
            if (memberToPromote.guildId == guildId) {
              const guildInfo = await dbManager.getGuildInfo(guildId);
              const ministre = await dbManager.getGuildUserByRole(guildId, 2);
              const maxMinistre = params.maxMinistre[guildInfo.level];
              const getClassFromUser = await dbManager.getUserClass(
                interaction.user.id,
                guildId
              );
              let newClassId = getMemberClassToPromote - 1;
              if (
                guildInfo.empreur == interaction.user.id ||
                getClassFromUser == 1
              ) {
                if (newClassId == 1) {
                  const ClassName = dbManager.getClassName(newClassId);
                  return interaction.reply({
                    content: `Un membre ne peut être (${ClassName} ${emoji(
                      emo[`class${newClassId}`]
                    )}), que par le Mariage`,
                    ephemeral: true,
                  });
                } else if (newClassId == 2 && ministre.length == maxMinistre) {
                  return interaction.reply({
                    content: `Nombre Max de Ministre atteint : ${maxMinistre}`,
                  });
                } else {
                  await dbManager.promoteDemoteMember(
                    userId,
                    guildId,
                    newClassId
                  );
                  const ClassName = dbManager.getClassName(newClassId);
                  await dbManager.addGuildBank(
                    guildId,
                    -params.promote[ClassName]
                  );
                  return interaction.reply({
                    content: `Le membre à été promu au rang de ${ClassName}  ${emoji(
                      emo[
                        `class${newClassId}\n\nCoût : **${
                          params.promote[ClassName]
                        }** ${emoji(emo.power)}`
                      ]
                    )}`,
                    ephemeral: true,
                  });
                }
              } else {
                if (getMemberClassToPromote == 3) {
                  return interaction.reply({
                    content: `seul un empreur ou une reine peux promouvoir un nouveau ministre`,
                  });
                } else {
                  await dbManager.promoteDemoteMember(
                    userId,
                    guildId,
                    newClassId
                  );
                  const ClassName = dbManager.getClassName(newClassId);
                  await dbManager.addGuildBank(
                    guildId,
                    -params.promote[ClassName]
                  );
                  return interaction.reply({
                    content: `Le membre à été promus au rang de ${ClassName}  ${emoji(
                      emo[
                        `class${newClassId}\n\nCoût : **${
                          params.promote[ClassName]
                        }** ${emoji(emo.power)}`
                      ]
                    )}`,
                    ephemeral: true,
                  });
                }
              }
            } else {
              return interaction.reply({
                content: "L'utilisateur n'est pas membre de votre guilde.",
                ephemeral: true,
              });
            }

          case "demote":
            const userIdToDemote = interaction.options.getUser("membre");
            if (!userIdToDemote) {
              return interaction.reply({
                content: "vous devez spécifier un membre à Retrograder.",
                ephemeral: true,
              });
            }

            // verifier si l'utilisateurs à retrograder, fait partie de la guilde, ou s'il n'est pas déjà admin de la guilde
            const memberToDemote = await dbManager.getStats(userIdToDemote.id);
            const getMemberClassToDemote = await dbManager.getUserClass(
              memberToDemote,
              guildId
            );
            if (memberToDemote.guildId == guildId) {
              const guildInfo = await dbManager.getGuildInfo(guildId);
              const getClassFromUser = await dbManager.getUserClass(
                interaction.user.id,
                guildId
              );
              let newClassId = getMemberClassToDemote + 1;
              if (
                guildInfo.empreur == interaction.user.id ||
                getClassFromUser == 1
              ) {
                if (newClassId > 6) {
                  const ClassName = dbManager.getClassName(newClassId);
                  return interaction.reply({
                    content: `Le membre est déjà au banc de la société (${ClassName} ${emoji(
                      emo[`class${newClassId}`]
                    )})`,
                    ephemeral: true,
                  });
                } else {
                  await dbManager.promoteDemoteMember(
                    userId,
                    guildId,
                    newClassId
                  );
                  const ClassName = dbManager.getClassName(newClassId);
                  return interaction.reply({
                    content: `Le membre à été rétrograder au rang de ${ClassName}  ${emoji(
                      emo[`class${newClassId}`]
                    )}`,
                    ephemeral: true,
                  });
                }
              } else {
                if (getMemberClassToDemote == 2) {
                  return interaction.reply({
                    content: `seul un empreur ou une reine peux retrograder un ministre`,
                  });
                }
                if (newClassId > 6) {
                  const ClassName = dbManager.getClassName(newClassId);
                  return interaction.reply({
                    content: `Le membre est déjà au banc de la société (${ClassName} ${emoji(
                      emo[`class${newClassId}`]
                    )})`,
                    ephemeral: true,
                  });
                } else {
                  await dbManager.promoteDemoteMember(
                    userId,
                    guildId,
                    newClassId
                  );
                  const ClassName = dbManager.getClassName(newClassId);
                  return interaction.reply({
                    content: `Le membre à été rétrograder au rang de ${ClassName}  ${emoji(
                      emo[`class${newClassId}`]
                    )}`,
                    ephemeral: true,
                  });
                }
              }
            } else {
              return interaction.reply({
                content: "L'utilisateur n'est pas membre de votre guilde.",
                ephemeral: true,
              });
            }

          case "invite":
            const userIdToInvite = interaction.options.getUser("membre");
            if (!userIdToInvite) {
              return interaction.reply({
                content: `vous devez spécifier un membre à inviter`,
                ephemeral: true,
              });
            }
            /// check si l'user est dans une guild
            const userToInvite = await dbManager.getStats(userIdToInvite);
            if ((userToInvite.guildId = !null)) {
              /// check si l'user à déjà proposé une invitation si oui faire rejoindre le joueurs
              const invitation = await dbManager.getUserInvitationByGuild(
                userIdToInvite,
                guildId,
                1
              );
              if (invitation.length > 0) {
                await dbManager.joinGuild(userIdToInvite.id, guildId);
                return interaction.reply({
                  content: `L'user étant déjà en attente pour rejoindre la guilde le joueurs à automatiquement rejoin la guilde\n\n- Le joueur <@${userIdToInvite.id}> fait maintenant parti de la guilde [${guildInfo.tag}] - ${guildInfo.nom}`,
                  ephemeral: true,
                });
              } else {
                await dbManager.createInvitation(guildId, userIdToInvite.id, 2);
                await interaction.reply({
                  content: `L'utilisateur ${userIdToInvite.username} a été invité dans la guilde ${guildInfo.nom}.`,
                  ephemeral: true,
                });
              }
            } else {
              return interaction.reply({
                content: `L'user est déjà dans une guild, impossible de l'inviter`,
                ephemeral: true,
              });
            }

            break;

          case "accept":
            const invitations = await dbManager.getGuildInvitations(guildId);
            if (invitations.length === 0) {
              return interaction.reply({
                content: "Aucune demande de rejoindre la guilde.",
                ephemeral: true,
              });
            } else {
              const memberOptions = await Promise.all(
                invitations.map(async (invitation) => {
                  const user = await client.users.fetch(invitation.userId);
                  const stats = await player.getStatsById(invitation.userId);
                  return {
                    label: user.username,
                    value: user.id,
                    power: stats.power,
                    sante: stats.sante,
                    defense: stats.defense,
                    attaque: stats.attaque,
                  };
                })
              );
              let description =
                "Sélectionnez les membres à accepter ou refuser:\n";
              memberOptions.forEach((member) => {
                description += `**${member.label}**, ***STATS***: **${
                  member.power
                } ${emoji(emo.power)}**, **${member.sante}💚**, **${
                  member.defense
                }🛡️**, **${member.attaque}⚔️**\n\n`;
              });
              const embed = new EmbedBuilder()
                .setTitle("Demandes de rejoindre la guilde")
                .setDescription(description);

              const acceptMenu = new StringSelectMenuBuilder()
                .setCustomId("select-accept-member")
                .setPlaceholder("Choisir un membre à accepter")
                .addOptions(memberOptions);

              // Créer le select menu pour refuser
              const rejectMenu = new StringSelectMenuBuilder()
                .setCustomId("select-reject-member")
                .setPlaceholder("Choisir un membre à refuser")
                .addOptions(memberOptions);
              const acceptRow = new ActionRowBuilder().addComponents(
                acceptMenu
              );
              const rejectRow = new ActionRowBuilder().addComponents(
                rejectMenu
              );

              await interaction.reply({
                embeds: [embed],
                components: [acceptRow, rejectRow],
                ephemeral: true,
              });
              client.on("interactionCreate", async (menuInteraction) => {
                if (!menuInteraction.isStringSelectMenu()) return;

                const selectedMemberId = menuInteraction.values[0];
                if (menuInteraction.customId === "select-accept-member") {
                  // Accepter le membre
                  await dbManager.joinGuild(selectedMemberId, guildId);
                  await menuInteraction.update({
                    content: `Le membre <@${selectedMemberId}> a été accepté dans la guilde. [${guildInfo.tag}]`,
                    components: [],
                  });
                } else if (
                  menuInteraction.customId === "select-reject-member"
                ) {
                  // Refuser le membre
                  await dbManager.deleteInvitation(
                    selectedMemberId,
                    guildId,
                    1
                  );
                  await menuInteraction.update({
                    content: `La demande du membre <@${selectedMemberId}> a été refusée.`,
                    components: [],
                  });
                }
              });
            }

          case "setmarchand":
            const userIdTo = interaction.options.getUser("membre").id;
            if (interaction.user.id !== guildInfo.empreur) {
              return interaction.reply({
                content: "Seul l'empereur peut promouvoir un marchand.",
                ephemeral: true,
              });
            }
            // Vérifier si le membre à promouvoir possède le rôle requis
            const member = await interaction.guild.members.fetch(
              userIdToPromote
            );
            const requiredRoleId = "1246944923526234113";
            const requiredRole =
              interaction.guild.roles.cache.get(requiredRoleId);
            if (!member.roles.cache.has(requiredRole)) {
              return interaction.reply({
                content: `Le membre à promouvoir doit posséder le rôle requis. **@${requiredRole.name}**.`,
                ephemeral: true,
              });
            }
            // Vérifier si un marchand est déjà en place
            const currentMarchand = await dbManager.getCurrentMarchand(guildId);
            if (currentMarchand) {
              const confirmationMessage = await interaction.reply({
                content:
                  "Un marchand est déjà en place. Souhaitez-vous le remplacer ?",
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId("replace-marchand-yes")
                      .setLabel("✅ Oui")
                      .setStyle("PRIMARY"),
                    new ButtonBuilder()
                      .setCustomId("replace-marchand-no")
                      .setLabel("❌ Non")
                      .setStyle("SECONDARY")
                  ),
                ],
                ephemeral: true,
                fetchReply: true,
              });
              // Attendre la réponse de l'utilisateur
              const filter = (i) =>
                i.customId === "replace-marchand-yes" ||
                i.customId === "replace-marchand-no";
              const response = await confirmationMessage.awaitMessageComponent({
                filter,
                time: 60000,
              });

              if (response.customId === "replace-marchand-no") {
                return response.update({
                  content: "Le marchand actuel n'a pas été remplacé.",
                  components: [],
                });
              } else {
                // Supprimer le marchand actuel
                await dbManager.updateMarchand(null, guildId);
              }
            }
            // Vérifier que la guilde a assez de fragments
            const cost = params.promote.Marchand;
            if (guildInfo.banque < cost) {
              return interaction.reply({
                content: `La guilde n'a pas assez de fragments pour promouvoir un marchand.\n **${
                  guildInfo.banque
                } / ${cost}** ${emoji(emo.power)}`,
                ephemeral: true,
              });
            }
            await dbManager.updateMarchand(userIdToPromote, guildId);
            await dbManager.addGuildBank(guildId, -cost);
            return interaction.reply({
              content: `Le membre <@${userIdToPromote}> a été promu au rang de marchand de guild, pour la guilde [${guildInfo.tag}]`,
            });

          // doit posséder le role = 1246944923526234113 --> sinon erreur
          // est mis avec la fonction dbManager.updateMarchand(userId, guildId)--> déjà mis en place
          // seule l'empreur peut effectuer cette action (guildInfo.empreur)
          // Max 1 marchand si j'ai 1 marchand déjà en place dans la guild je met :
          // Un Marchand est déjà en place souhaiter vous le remplacer (oui / non)
          // SI oui Update
          // SI non pas d'update
          // le prix est définie par params.promote.Marchand je dois donc si le marchand est affecté update la banque en conséquence (et verifier que la guilde à asser de fragment guildInfo.banque) --> si non message

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

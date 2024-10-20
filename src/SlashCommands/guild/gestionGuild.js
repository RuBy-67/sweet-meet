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
const { description } = require("./guild");
const player = new Player();

module.exports = {
  name: "gestionguild",
  description: "🚨 Empereur, reine et ministre de la guilde",
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
              name: `Name [coût : ${params.changeGuildName}]`,
              value: "nom",
            },
            {
              name: `Description [coût : ${params.changeGuildDescription}]`,

              value: "description",
            },
            {
              name: `Bannière [coût : ${params.changeGuildBanner}]`,

              value: "banniere",
            },
            {
              name: `StatutInvit [coût : ${params.changeGuildStatut}]`,
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
      type: 1,
      name: "help",
      description: "Commande d'aide de gestion de guilde",
    },
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
    const Embedcolors = await dbManager.getColor(interaction.user.id);

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    let guildId = await dbManager.getStats(interaction.user.id);
    guildId = guildId.guildId;

    if (!guildId) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 Erreur 🚨")
        .setColor(color.error)
        .setDescription(
          `> Vous n'êtes pas dans une guilde, veuillez rejoindre une guilde pour utiliser cette commande.`
        );
      return interaction.reply({ embeds: [embed] });
    }

    const verif = await dbManager.isGuildAdmin(interaction.user.id, guildId);
    if (!verif) {
      const embed = new EmbedBuilder()
        .setTitle("🚨 Erreur 🚨")
        .setColor(color.error)
        .setDescription(
          `> Vous n'êtes pas autorisé à utiliser cette commande, vous devez être Empereur, Reine ou Ministre de guild`
        );
      return interaction.reply({ embeds: [embed] });
    }
    const guildInfo = await dbManager.getGuildInfo(guildId);
    const getMembers = await dbManager.getGuildMembers(guildInfo.id);

    switch (subCommand) {
      case "help":
        const helpEmbed = new EmbedBuilder()
          .setTitle("📚 Aide de gestion de guilde")
          .setColor(Embedcolors)
          .setDescription("Commandes de gestion de guilde, pour les admins")
          .addFields({
            name: `${emoji(emo.ministre)} Commandes pour les Admins de Guildes`,
            value: [
              "- **/gestionguild upgrade** - Améliorer la guilde (level)",
              "- **/gestionguild update [Nom, Description, Bannière, StatutInvit]** - Mettre à jour les informations de la guilde",
              "- **/gestionguild kick** - Exclure un membre de la guilde",
              "- **/gestionguild promote** - Promouvoir un membre de la guilde",
              "- **/gestionguild demote** - Rétrograder un membre de la guilde",
              "- **/gestionguild setmarchand** - Promouvoir un membre au rôle de marchand",
              "- **/gestionguild invite** - Inviter un joueur dans la guilde",
              "- **/gestionguild accept** - Accepter une invitation dans la guilde",
            ].join("\n"),
          });
        return interaction.reply({ embeds: [helpEmbed] });
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
                ephemeral: true,
              });
            }

            let tag = valeur.substring(0, 3).toUpperCase();
            let suffix = 1;
            let uniqueTag = tag;
            const maxAttempts = 8; // Limite maximale d'itérations
            let attempts = 0;
            while ((await dbManager.getGuildByTag(uniqueTag).length) > 0) {
              if (attempts >= maxAttempts) {
                throw new Error(
                  "Impossible de générer un tag de guilde unique après plusieurs tentatives."
                );
              }
              uniqueTag = tag + suffix;
              suffix++;
              attempts++;
            }

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
            if (guildInfo.level < 2) {
              return interaction.reply({
                content:
                  "La guilde doit au moin être niveau 2, pour changer la bannière de la guilde.",
                ephemeral: true,
              });
            }
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
            let newStatutInvit = "";
            if (statutInvit == 1) {
              newStatutInvit = "🟡 Sur invitation";
            } else if (statutInvit == 2) {
              newStatutInvit = "🔴 Fermée";
            } else if (statutInvit == 3) {
              newStatutInvit = "🟢 Ouverte";
            }
            await interaction.reply({
              content: `Statut d'invitation de la guilde mis à jour avec succès à : ${newStatutInvit}`,
              ephemeral: true,
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
        const totalFlags = Object.values(params.maxFlag)
          .slice(0, newGuildLevel)
          .reduce((a, b) => a + b, 0);

        await dbManager.updateGuildLevel(guildId, newGuildLevel);
        await dbManager.addGuildBank(guildId, -upgradePrice);
        await dbManager.addGuildBank(guildId, bonusBanque);
        await dbManager.addGuildMemberPower(guildId, bonusMembre);

        // Répondre avec un message de succès
        const embed = new EmbedBuilder()
          .setTitle(`Mise à jour de la Guilde : ${guildInfo.nom}`)
          .setColor(Embedcolors)
          .setDescription(
            `La guilde a été améliorée avec succès au niveau ${newGuildLevel}.`
          )
          .addFields(
            {
              name: `Membre supplémentaire`,
              value: `+ ${
                params.maxJoueurLvl[newGuildLevel] -
                params.maxJoueurLvl[guildInfo.level]
              } 👤`,
              inline: true,
            },
            {
              name: `Ministre Suplèmentaire`,
              value: `${params.maxMinistre[newGuildLevel]} *(+1)* ${emoji(
                emo.ministre
              )}`,
              inline: true,
            },
            {
              name: `Marchand Supplémentaire`,
              value:
                newGuildLevel >= 3
                  ? `${params.maxMarchand[newGuildLevel]} Marchand ${emoji(
                      emo.marchand
                    )} Marchand`
                  : `*Marchand disponible à partir du niveau 3*`,
              inline: true,
            },
            {
              name: "Total des Flags",
              value: `Total des flags : ${totalFlags} *(+ ${params.maxFlag[newGuildLevel]}) 🏳️* \n**Saison à venir.**`,
              inline: true,
            },
            {
              name: `Fragments ajoutés`,
              value: `Bonus Banque: ${bonusBanque} ${emoji(
                emo.power
              )}\nBonus Membre: ${bonusMembre} ${emoji(emo.power)}`,
              inline: true,
            }
          );
        if (newGuildLevel === 2) {
          embed.addFields({
            name: "Modification de la Bannière",
            value: `La Modification, de la bannière de guilde est disponible.`,
            inline: true,
          });
        }

        // Répondre avec l'embed créé
        return interaction.reply({ embeds: [embed] });

      case "kick":
        const members = await dbManager.getGuildMembers(guildId);

        const nonAdminMembers = [];
        for (const member of members) {
          const isAdmin = await dbManager.isGuildAdmin(
            member.discordId,
            guildId
          );
          if (!isAdmin) {
            const [userClass] = await dbManager.getUserClass(
              member.discordId,
              guildId
            );

            const emojiName = emo[`class${userClass.idClasse}`] || "❔";
            const user = await client.users.fetch(member.discordId);

            nonAdminMembers.push({
              id: member.discordId,
              username: user.username,
              emoji: emojiName,
            });
          }
        }

        // Mapper les membres pour les options de menu déroulant
        const memberOptions = nonAdminMembers.map((member) => ({
          label: member.username,
          value: member.id,
          emoji: member.emoji,
        }));

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

        // Optimisation de l'écouteur d'événements
        const handleInteraction = async (interaction) => {
          if (!interaction.isStringSelectMenu()) return;

          // Vérifier si c'est le menu déroulant pour exclure un membre
          if (interaction.customId !== "select-kick-member") return;

          const memberId = interaction.values[0]; // Récupérer l'ID du membre à exclure
          const isAdmin = await dbManager.isGuildAdmin(memberId, guildId);

          if (isAdmin) {
            await interaction.update({
              content:
                "Impossible de kick un membre important de la guilde [EMPEREUR, REINE, MINISTRE]",
              components: [],
              ephemeral: true,
            });
          } else {
            await dbManager.leaveGuild(memberId); // Exécuter l'action pour exclure le membre
            await interaction.update({
              content: `Le membre <@${memberId}> a été exclu de la guilde avec succès.`,
              components: [],
              ephemeral: true,
            });
          }
        };

        // Détacher les anciens écouteurs s'ils existent
        client.off("interactionCreate", handleInteraction);

        // Attacher le nouvel écouteur
        client.on("interactionCreate", handleInteraction);
      case "promote":
        const userIdToPromote = interaction.options.getUser("membre");
        const replyErrorPromote = (content) =>
          interaction.reply({
            content,
            ephemeral: true,
          });

        if (!userIdToPromote) {
          return replyErrorPromote(
            "Vous devez spécifier un membre à promouvoir."
          );
        }

        if (userIdToPromote.id === interaction.user.id) {
          return replyErrorPromote(
            "Vous ne pouvez pas vous promouvoir vous-même."
          );
        }

        const requiredBank = params.promote.Ministre + 10000;
        if (guildInfo.banque < requiredBank) {
          return replyErrorPromote(
            `La banque de guilde doit au minimum posséder **${requiredBank}** ${emoji(
              emo.power
            )}, pour pouvoir promouvoir un membre\n- __Banque actuelle :__ ${
              guildInfo.banque
            } / ${requiredBank} ${emoji(emo.power)}`
          );
        }
        const memberToPromote = await dbManager.getStats(userIdToPromote.id);
        if (memberToPromote.guildId !== guildId) {
          return replyErrorPromote(
            "L'utilisateur n'est pas membre de votre guilde."
          );
        }

        const member = await interaction.guild.members.fetch(
          userIdToPromote.id
        );
        const getMemberClassToPromote = await dbManager.getUserClass(
          userIdToPromote.id,
          guildId
        );

        const newClassId = getMemberClassToPromote[0].idClasse - 1;
        const ministre = await dbManager.getGuildUserByRole(guildId, 2);
        const maxMinistre = params.maxMinistre[guildInfo.level];
        const getClassFromUser = await dbManager.getUserClass(
          interaction.user.id,
          guildId
        );

        const roleConditions = {
          2: [
            "1246944911580991549",
            "1246944923526234113",
            "1246944929675087914",
          ],
          3: [
            "1216037978913378389",
            "1246944911580991549",
            "1246944923526234113",
            "1246944929675087914",
          ],
          4: [
            "1216037978913378388",
            "1216037978913378389",
            "1246944911580991549",
            "1246944923526234113",
            "1246944929675087914",
            "1247280292213948446", //1246780871776665665 //test //1247280292213948446 //prod
          ],
        };

        const checkRequiredRoles = (roles) =>
          roles.every((roleId) => !member.roles.cache.has(roleId));

        if (
          roleConditions[newClassId] &&
          checkRequiredRoles(roleConditions[newClassId])
        ) {
          const requiredRoles = roleConditions[newClassId]
            .map((roleId) => `- <@&${roleId}>`)
            .join("\n");
          const className = await dbManager.getClassName(newClassId);
          const embed = new EmbedBuilder()
            .setTitle("Promotion échouée")
            .setDescription(
              `Le membre ne peut être promu au rang de **${
                className[0].Nom
              }** ${emoji(
                emo[`class${newClassId}`]
              )}, car il ne possède pas au moins un des rôles requis.`
            )
            .addFields({ name: "Rôles requis", value: `${requiredRoles}` })
            .setColor(Embedcolors);

          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (
          guildInfo.empreur === interaction.user.id ||
          getClassFromUser === 1
        ) {
          if (newClassId === 1) {
            const className = await dbManager.getClassName(newClassId);
            return replyErrorPromote(
              `Un membre ne peut être ${className[0].Nom} ${emoji(
                emo[`class${newClassId}`]
              )}, que par le mariage.`
            );
          }
          if (newClassId === 2 && ministre.length >= maxMinistre) {
            return replyErrorPromote(
              `Nombre maximum de ministres atteint : ${maxMinistre}.`
            );
          }
        } else if (getMemberClassToPromote === 3) {
          return replyErrorPromote(
            "Seul un empereur ou une reine peut promouvoir un nouveau ministre."
          );
        }
        await dbManager.promoteDemoteMember(
          userIdToPromote.id,
          guildId,
          newClassId
        );
        const classNameToPromote = await dbManager.getClassName(newClassId);

        await dbManager.addGuildBank(
          guildId,
          -params.promote[classNameToPromote[0].Nom]
        );

        return interaction.reply({
          content: `Le membre a été promu au rang de ${
            classNameToPromote[0].Nom
          } ${emoji(emo[`class${newClassId}`])}\n\nCoût : **${
            params.promote[classNameToPromote[0].Nom]
          }** ${emoji(emo.power)}`,
          ephemeral: true,
        });
      case "demote":
        const userIdToDemote = interaction.options.getUser("membre");

        // Fonction utilitaire pour envoyer une réponse d'erreur
        const replyErrorDemote = (content) =>
          interaction.reply({
            content,
            ephemeral: true,
          });

        if (!userIdToDemote) {
          return replyErrorDemote(
            "Vous devez spécifier un membre à rétrograder."
          );
        }

        const memberToDemote = await dbManager.getStats(userIdToDemote.id);
        if (memberToDemote.guildId !== guildId) {
          return replyErrorDemote(
            "L'utilisateur n'est pas membre de votre guilde."
          );
        }

        if (userIdToDemote.id === interaction.user.id) {
          return replyErrorDemote(
            "Vous ne pouvez pas vous rétrograder vous-même."
          );
        }

        const [currentClass] = await dbManager.getUserClass(
          userIdToDemote.id,
          guildId
        );
        const newClassIdToDemote = currentClass.idClasse + 1;

        const isUserEmperorOrQueen =
          userIdToDemote.id === guildInfo.empreur ||
          currentClass.idClasse === 1;
        if (isUserEmperorOrQueen) {
          return replyErrorDemote(
            "Une rétrogradation d'Empereur ou de Reine n'est pas autorisée."
          );
        }

        const isUserMinister = currentClass.idClasse === 2;
        if (isUserMinister) {
          return replyErrorDemote(
            "Seul un empereur ou une reine peut rétrograder un ministre."
          );
        }

        if (newClassIdToDemote > 6) {
          const [className] = await dbManager.getClassName(newClassIdToDemote);
          return replyErrorDemote(
            `Le membre est déjà au banc de la société (${className.Nom} ${emoji(
              emo[`class${newClassIdToDemote}`]
            )}).`
          );
        }

        await dbManager.promoteDemoteMember(
          userIdToDemote.id,
          guildId,
          newClassIdToDemote
        );
        const [className] = await dbManager.getClassName(newClassIdToDemote);

        return interaction.reply({
          content: `Le membre a été rétrogradé au rang de ${
            className.Nom
          } ${emoji(emo[`class${newClassIdToDemote}`])}.`,
          ephemeral: true,
        });

      case "invite":
        if (guildInfo.statutInvit == 2) {
          return interaction.reply({
            content: `La guilde est fermée, impossible d'inviter un membre.`,
            ephemeral: true,
          });
        }

        const maxGuildJoueur = params.maxJoueurLvl[guildInfo.level];

        if (getMembers.length >= maxGuildJoueur) {
          return interaction.reply({
            content: `Impossible d'inviter, La guilde a atteint le nombre maximum de joueurs : ${maxGuildJoueur}`,
            ephemeral: true,
          });
        }
        let userIdToInvite = interaction.options.getUser("membre");
        if (!userIdToInvite) {
          return interaction.reply({
            content: `vous devez spécifier un membre à inviter`,
            ephemeral: true,
          });
        }
        /// check si l'user est dans une guild
        const userToInvite = await dbManager.getStats(userIdToInvite.id);

        if (userToInvite.guildId == null) {
          /// check si l'user à déjà proposé une invitation si oui faire rejoindre le joueurs
          const invitation = await dbManager.getUserInvitationByGuild(
            userIdToInvite.id,
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
            await dbManager.createInvitation(userIdToInvite.id, guildId, 2);
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
        const maxJoueur = params.maxJoueurLvl[guildInfo.level];

        if (invitations.length === 0) {
          return interaction.reply({
            content: "Aucune demande de rejoindre la guilde.",
            ephemeral: true,
          });
        }

        if (getMembers.length >= maxJoueur) {
          return interaction.reply({
            content: `Il y a des demandes en attente, mais la guilde a atteint le nombre maximum de joueurs : ${maxJoueur}.`,
            ephemeral: true,
          });
        }

        const memberOptionsToAccept = await Promise.all(
          invitations.map(async (invitation) => {
            const user = await client.users.fetch(invitation.userId);
            const stats = await player.getStatsById(invitation.userId);
            return {
              label: user.username,
              value: user.id,
              description: `- __Stat:__ **${stats.power}**${emoji(
                emo.power
              )}, **${stats.sante}**💚, **${stats.defense}**🛡️, **${
                stats.attaque
              }**⚔️`,
            };
          })
        );

        const embedToAccept = new EmbedBuilder()
          .setColor(Embedcolors)
          .setTitle("Demandes de rejoindre la guilde")
          .setDescription(
            "Sélectionnez les membres à accepter ou refuser :\n\n" +
              memberOptionsToAccept
                .map((opt) => `**${opt.label}**\n${opt.description}\n`)
                .join("\n")
          );

        const createMenu = (customId, placeholder) =>
          new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(
              memberOptionsToAccept.map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))
            );
        const acceptRow = new ActionRowBuilder().addComponents(
          createMenu("select-accept-member", "Choisir un membre à accepter")
        );
        const rejectRow = new ActionRowBuilder().addComponents(
          createMenu("select-reject-member", "Choisir un membre à refuser")
        );

        await interaction.reply({
          embeds: [embedToAccept],
          components: [acceptRow, rejectRow],
          ephemeral: true,
        });

        const handleMenuInteraction = async (menuInteraction) => {
          if (!menuInteraction.isStringSelectMenu()) return;

          const selectedMemberId = menuInteraction.values[0];
          if (menuInteraction.customId === "select-accept-member") {
            // Accepter le membre
            await dbManager.joinGuild(selectedMemberId, guildId);
            await menuInteraction.update({
              content: `Le membre <@${selectedMemberId}> a été accepté dans la guilde [${guildInfo.tag}].`,
              components: [],
            });
          } else if (menuInteraction.customId === "select-reject-member") {
            // Refuser le membre
            await dbManager.deleteInvitationByUserAndGuildId(
              selectedMemberId,
              guildId,
              1
            );
            await menuInteraction.update({
              content: `La demande du membre <@${selectedMemberId}> a été refusée.`,
              components: [],
            });
          }
        };
        client.off("interactionCreate", handleMenuInteraction);
        client.on("interactionCreate", handleMenuInteraction);

      case "setmarchand":
        const userIdTo = interaction.options.getUser("membre");
        const replyErrorSetMarchand = (content) =>
          interaction.reply({
            content,
            ephemeral: true,
          });
        const replyUpdateSetMarchand = (content, components) =>
          interaction.update({
            content,
            components,
            ephemeral: true,
          });

        if (guildInfo.level < 3) {
          return replyErrorSetMarchand(
            "La guilde doit au moins être niveau 3 pour promouvoir un marchand."
          );
        }

        if (interaction.user.id !== guildInfo.empreur) {
          return replyErrorSetMarchand(
            "Seul l'empereur peut promouvoir un marchand."
          );
        }

        if (guildInfo.empreur === userIdTo.id) {
          return replyErrorSetMarchand(
            "Vous ne pouvez pas promouvoir l'Empereur au rang de marchand."
          );
        }

        const stat = await dbManager.getStats(userIdTo.id);
        if (stat.guildId !== guildId) {
          return replyErrorSetMarchand(
            "Le membre à promouvoir doit être membre de la guilde."
          );
        }

        const requiredRoleId = "1246944923526234113";
        const requiredRole = interaction.guild.roles.cache.get(requiredRoleId);
        const cost = params.promote.Marchand;

        const memberToSetMarchand = await interaction.guild.members.fetch(
          userIdTo.id
        );
        if (!memberToSetMarchand.roles.cache.has(requiredRoleId)) {
          return replyErrorSetMarchand(
            `Le membre à promouvoir doit posséder le rôle requis : **@${requiredRole.name}**.`
          );
        }

        if (guildInfo.banque < cost) {
          return replyErrorSetMarchand(
            `La guilde n'a pas assez de fragments pour promouvoir un marchand.\n **${
              guildInfo.banque
            } / ${cost}** ${emoji(emo.power)}`
          );
        }

        const currentMarchand = guildInfo.marchand;
        const handleConfirmation = async (menuInteraction) => {
          if (!menuInteraction.isButton()) return;

          if (menuInteraction.customId === "replace-marchand-no") {
            return replyUpdateSetMarchand(
              "Le marchand actuel n'a pas été remplacé.",
              []
            );
          } else if (menuInteraction.customId === "delete-marchand") {
            await dbManager.updateMarchand(null, guildId);
            return replyUpdateSetMarchand(
              "Le marchand actuel a été supprimé, pas de marchand en place.",
              []
            );
          } else if (menuInteraction.customId === "replace-marchand-yes") {
            await dbManager.updateMarchand(userIdTo.id, guildId);
            await dbManager.addGuildBank(guildId, -cost);
            return replyUpdateSetMarchand(
              `Le membre <@${userIdTo.id}> a été promu au rang de marchand de la guilde [${guildInfo.tag}]`,
              []
            );
          }
        };
        client.off("interactionCreate", handleConfirmation);
        client.on("interactionCreate", handleConfirmation);

        if (currentMarchand) {
          const confirmationMessage = await interaction.reply({
            content:
              "Un marchand est déjà en place. Souhaitez-vous le remplacer ?",
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("replace-marchand-yes")
                  .setLabel("✅ Oui")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId("replace-marchand-no")
                  .setLabel("❌ Non")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("delete-marchand")
                  .setLabel("❌ Supprimer Marchand Actuel")
                  .setStyle(ButtonStyle.Danger)
              ),
            ],
            ephemeral: true,
          });

          const filter = (i) =>
            [
              "replace-marchand-yes",
              "replace-marchand-no",
              "delete-marchand",
            ].includes(i.customId);
          const response = await confirmationMessage.awaitMessageComponent({
            filter,
            time: 60000,
          });

          handleConfirmation(response); // Appeler la fonction de gestion des confirmations
        } else {
          // Pas de marchand actuellement en place, promouvoir directement
          await dbManager.updateMarchand(userIdTo.id, guildId);
          await dbManager.addGuildBank(guildId, -cost);
          return replyUpdateSetMarchand(
            `Le membre <@${userIdTo.id}> a été promu au rang de marchand de la guilde [${guildInfo.tag}]`,
            []
          );
        }

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
        break;
    }
  },
};

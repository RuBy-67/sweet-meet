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
const info = require("../../jsons/info.json");
const player = new Player();

module.exports = {
  name: "infos",
  description: "Informations sur generale",
  options: [
    {
      type: 1,
      name: "profil",
      description: "profil d'un utilisateur",
      options: [
        {
          name: "membre",
          description: "Le membre dont vous voulez voir le profil",
          type: 6,
          required: false,
        },
      ],
    },
    {
      type: 1,
      name: "lore",
      description: "Information sur le lore de Valoria",
    },
    {
      type: 1,
      name: "bot",
      description: "info sur le bot",
    },
    {
      type: 1,
      name: "generale",
      description: "informations sur les Objets Roles et Badges disponible",
      options: [
        {
          name: "categorie",
          description: "Choisissez la catégorie d'objets à afficher",
          type: 3, // Type 3 pour une chaîne de caractères (string)
          required: true,
          choices: [
            {
              name: "Matériaux",
              value: "materiaux",
            },
            {
              name: "Rôles",
              value: "roles",
            },
            {
              name: "Badges",
              value: "badges",
            },
          ],
        },
      ],
    },
    {
      type: 1,
      name: "classement",
      description: "Affiche le classement des utilisateurs",
    },
    {
      type: 1,
      name: "guildes",
      description: "Affiche l'aide de guildes et des infos utiles",
    },
    {
      type: 1,
      name: "roleguildes",
      description: "Affiche les détails des rôles de guilde",
    },
    {
      type: 1,
      name: "entrainement",
      description: "Affiche les détails de la campagne d'entrainement",
    },
    {
      type: 1,
      name: "help",
      description: "Affiche les commandes supplémentaires",
    },
    {
      type: 1,
      name: "social",
      description: "Social link of my queen (devs)",
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

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "profil":
        const target =
          interaction.options.getMember("membre") || interaction.member;
        const targetUser = await client.users.fetch(target.user.id);
        const materiauResult = await dbManager.getMateriauByUserId(
          targetUser.id
        );

        let materiaux = "Aucun";
        if (materiauResult.length > 0) {
          const materiauxMap = new Map();
          materiauResult.forEach((materiau) => {
            const materiauKey = `${materiau.nom}-${materiau.lvl}`;
            if (!materiauxMap.has(materiauKey)) {
              materiauxMap.set(materiauKey, {
                nom: materiau.nom,
                lvl: materiau.lvl,
                quantite: 0,
              });
            }
            materiauxMap.get(materiauKey).quantite++;
          });

          materiaux = [...materiauxMap.values()]
            .map(
              (materiau) =>
                `${emoji(emo[materiau.nom])} \`${materiau.nom}\` *=>* lvl: ${
                  materiau.lvl
                }, **x${materiau.quantite}**`
            )
            .join(" \n");
        }

        //-------------------------------------//
        let materiauxDetails = [];
        if (materiauResult.length > 0) {
          const materiauxMap2 = new Map();
          materiauResult.forEach((materiau) => {
            const materiauKey = `${materiau.nom}-${materiau.rarete}-${materiau.type}-${materiau.defenseBoost}-${materiau.attaqueBoost}-${materiau.santeBoost}-${materiau.lore}`;
            if (!materiauxMap2.has(materiauKey)) {
              materiauxMap2.set(materiauKey, {
                nom: materiau.nom,
                rarete: materiau.rarete,
                type: materiau.type,
                defense: materiau.defenseBoost,
                attaque: materiau.attaqueBoost,
                sante: materiau.santeBoost,
                lore: materiau.lore,
                quantite: 0,
              });
            }
            materiauxMap2.get(materiauKey).quantite++;
          });

          materiauxDetails = [...materiauxMap2.values()].map((materiau) => {
            const materiauEmoji = emoji(emo[materiau.nom]);
            const description = `**Rareté:** ${materiau.rarete}\n**Type:** ${materiau.type}\n**Boost:** 💚 ${materiau.sante}% - ⚔️ ${materiau.attaque}% - 🛡️ ${materiau.defense}%\n> *${materiau.lore}*\n**Quantité:** ${materiau.quantite}\n__~~**----------------------------------**~~__`;

            return {
              name: `${materiauEmoji} ${materiau.nom}`,
              value: description,
            };
          });
        }

        const badgeResult = await dbManager.getBadge(targetUser.id);
        let badges = "Aucun";
        if (badgeResult.length > 0) {
          badges = badgeResult.map((badge) => emoji(badge.emojiId)).join(" ");
        }

        const marriageResult = await dbManager.getMarriage(targetUser.id);

        let marriageStatus;
        if (marriageResult.length === 0) {
          marriageStatus = "Célibataire";
        } else {
          let spouse;
          if (marriageResult[0].userId2 === targetUser.id) {
            spouse = await interaction.guild.members.fetch(
              marriageResult[0].userId
            );
          } else {
            spouse = await interaction.guild.members.fetch(
              marriageResult[0].userId2
            );
          }

          const mariage = marriageResult[0].date;
          const mariageTimestamp = Math.floor(mariage.getTime() / 1000);
          marriageStatus = `Marié(e) avec <@${spouse.user.id}> \n Depuis le: <t:${mariageTimestamp}:D>`;
        }

        const statsResult = await dbManager.getStats(targetUser.id);
        const win = statsResult.winCounter;
        const lose = statsResult.loseCounter;
        const power = statsResult.power;
        const rate = win / (win + lose) || 0;
        const stats = await player.getStatsById(targetUser.id);
        const roleInfo = await dbManager.getRoleByUserId(targetUser.id);
        let role = "Aucun";
        if (roleInfo.length > 0) {
          role = roleInfo.map((role1) => `<@&${role1.id}>`).join(" ");
        }
        let EmbedColor = colors;
        let guildTag = "";
        if (statsResult.guildId != null) {
          const [guildInfo] = await dbManager.getGuildById(statsResult.guildId);

          if (guildInfo.empreur === targetUser.id) {
            guildTag = `${emoji(emo.King)} Empereur de la guilde ${
              guildInfo.nom
            } **[${guildInfo.tag}]**`;
            EmbedColor = guildInfo.bannière;
          } else {
            const guildInfoClassId = await dbManager.getUserClass(
              targetUser.id,
              statsResult.guildId
            );

            const guildInfoClassName = await dbManager.getClassName(
              guildInfoClassId[0].idClasse
            );

            guildTag = `${emoji(emo[`class${guildInfoClassId[0].idClasse}`])} ${
              guildInfoClassName[0].Nom
            } de la guilde ${guildInfo.nom} **[${guildInfo.tag}]**`;
            EmbedColor = guildInfo.bannière;
          }
        } else {
          guildTag = "Aucune guilde associée";
        }
        const pages = [
          new EmbedBuilder()

            .setTitle(`Profil de ${targetUser.username}`)
            .setColor(EmbedColor)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
              {
                name: "Situation :",
                value: marriageStatus,
                inline: true,
              },
              {
                name: "Guilde :",
                value: guildTag,
              },
              {
                name: "Information :",
                value: `Fragments : ${power
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${emoji(
                  emo.power
                )}\nBadges : ${badges}\n `,
                inline: true,
              },
              {
                name: "Roles :",
                value: role || "Aucun",
                inline: true,
              },
              {
                name: "Matériaux :",
                value: materiaux || "Aucun",
                inline: false,
              },
              {
                name: "Performance",
                value: `🏆 Win : **${win}**\n❌ Lose : **${lose}**\n📊 Rate : **${(
                  rate * 100
                ).toFixed(2)}%**`,
                inline: false,
              },
              {
                name: "Statistique de combat",
                value: `💚 Santé : **${stats.sante}** \n🛡️ Défense : **${stats.defense}** \n⚔️ Attaque : **${stats.attaque}**`,
              }
            )
            .setFooter({
              text: `demandé(e) par ${interaction.user.tag} - Page 1/2`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            }),

          new EmbedBuilder()
            .setTitle("Mes Matériaux")
            .setColor(colors)
            .setDescription(
              "*Dans le royaume ancien de Valoria, la magie et les éléments se mélangent pour créer des matériaux d'une puissance incommensurable. Ces matériaux sont les reliques de l'harmonie entre les forces naturelles et la magie ancestrale, et leur possession confère à leurs détenteurs des capacités extraordinaires. On raconte que ces artefacts sont les vestiges d'une époque où les dieux eux-mêmes foulaient la terre de Valoria, infusant la nature de leur puissance divine.*\n\n***Le level (des materiaux) Influe sur les Boost***"
            )
            .addFields(materiauxDetails)
            .setFooter({
              text: `Demandé(e) par ${interaction.user.tag} - Page 2/2`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            }),
        ];
        const legendaryMaterials = await dbManager.getMateriauxByRarity(
          "Legendaire"
        );

        const legendaryMaterialsDescription = legendaryMaterials
          .map((mat) => `${emoji(emo[mat.nom])} : ${mat.nom}`)
          .join("\n");
        const hiddenPage = new EmbedBuilder()
          .setTitle("Secret Page")
          .setColor(colors)
          .setDescription(
            "Ho t'a trouvé la page secrète ! claim ton cadeau 🧧 c'est une chance sur 1000 de tomber sur cette page, et te permet de claim entre 5000 et 15000 Fragments de Protection !\nAinsi que d'obtenir un matériaux legendaire parmis la liste suivante !"
          )
          .addFields({
            name: "Matériaux Légendaires Disponibles",
            value: legendaryMaterialsDescription,
          })
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        let currentPage = 0;

        // Determine if the rare button should appear
        const showRareButton = Math.random() < 0.001; // 1 in 1000 chance

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
        );

        if (showRareButton) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("secret")
              .setLabel("🎁")
              .setStyle(ButtonStyle.Success)
          );
        }
        const message = await interaction.reply({
          embeds: [pages[currentPage]],
          components: [row],
          fetchReply: true,
        });

        const filter = (i) =>
          ["previous", "next", "secret", "claim"].includes(i.customId) &&
          i.user.id === interaction.user.id;

        const collector = message.createMessageComponentCollector({
          filter,
          time: 80000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "next") {
            currentPage = (currentPage + 1) % pages.length;
            await i.update({ embeds: [pages[currentPage]], components: [row] });
          } else if (i.customId === "previous") {
            currentPage = (currentPage - 1 + pages.length) % pages.length;
            await i.update({ embeds: [pages[currentPage]], components: [row] });
          } else if (i.customId === "secret") {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId("claim")
                .setLabel("🧧 Claim !!!!")
                .setStyle(ButtonStyle.Success)
            );
            await i.update({ embeds: [hiddenPage], components: [row] });
          } else if (i.customId === "claim") {
            const power = await dbManager.generateRandomPower();
            await dbManager.setPowerById(interaction.user.id, power);
            const randomMaterial =
              legendaryMaterials[
                Math.floor(Math.random() * legendaryMaterials.length)
              ];
            await dbManager.addMaterialToUser(
              interaction.user.id,
              randomMaterial.id
            );
            await i.update({
              content: `Claimed! You received ${power} ${emoji(
                emo.power
              )} and a legendary material: ${emoji(emo[randomMaterial.nom])} ${
                randomMaterial.nom
              }.`,
              embeds: [],
              components: [],
            });
          }
        });

        collector.on("end", () => {
          row.components.forEach((component) => component.setDisabled(true));
          message.edit({ components: [row] });
        });

      case "lore":
        const embed = new EmbedBuilder()
          .setTitle("InfoLore - Valoria")
          .setColor(colors)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setDescription("description")
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        return interaction.reply({ embeds: [embed] });
      case "bot":
        const botPing = Math.round(client.ws.ping);
        function emoji(id) {
          return (
            client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
            "Missing Emoji"
          );
        }
        const embedBot = new EmbedBuilder()
          .setTitle("Info Bot ")
          .setColor(colors)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setDescription(
            `
            **Nom**: ${info.nom}
            **Version**: ${info.version}
            **Créatrice**:  ${info.creatrice}
            **Hébergement**: ${info.hebergement}
            **Langage**: ${info.langage}
            **Framework**: ${info.framework}
            **Base de Données**: ${info.base_de_donnees}
            **URL Git**: [GitHub Repository](${info.url_git})\n**Ping du bot**: ${botPing} ms\n\n__~~**----------------------------------------**~~__
            `
          )
          .addFields(
            {
              name: "📚 V 1.5.0",
              value: `>>> - Ajout d'une campagne solo -> Entrainement\n- Ajout des Guilde (Empereur)\nRéduction de la FreeDayliBox\n- Ajout de l'utilité des role 🟢 \n- Marchand, chevalier, Noble au rapport\n- 👽 Correction de beug mineur\n__~~**----------------------------------------**~~__`,
            },
            {
              name: "📚 V 1.5.X -->",
              value: `>>> - Ajout de "combat de guilde" sur un royaume (territoire), permettant le farm de fragment et ressource pour mener à bien votre conquête de valoria, qui sera le nouveau prétendant au titre d'empereur suprême de valoria ?\n`,
            }
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        return interaction.reply({ embeds: [embedBot] });
      case "generale":
        const choice = interaction.options.getString("categorie");
        let result = null;
        let title = "";
        let description = "";
        let category = "";

        if (choice === "materiaux") {
          result = await dbManager.getMateriau();
          title = "Infos - Matériaux";
          description =
            "***Dans le royaume ancien de Valoria, la magie et les éléments se mélangent pour créer des matériaux d'une puissance incommensurable. Ces matériaux sont les reliques de l'harmonie entre les forces naturelles et la magie ancestrale, et leur possession confère à leurs détenteurs des capacités extraordinaires. On raconte que ces artefacts sont les vestiges d'une époque où les dieux eux-mêmes foulaient la terre de Valoria, infusant la nature de leur puissance divine.*** \n\n**Liste de tous les matériaux :**";
          category = "Matériaux";
        } else if (choice === "roles") {
          result = await dbManager.getRolesFromDB();
          title = "Infos - Roles";
          description =
            "***Dans le royaume de Valoria, chaque individu peut choisir un rôle spécifique qui détermine son chemin et ses capacités au sein de la société. Ces rôles ne sont pas simplement des titres, mais des vocations imprégnées de pouvoir et de responsabilité. Chaque rôle confère des compétences uniques et des statuts particuliers.***\n ⚠️ Compétence des badges NON implèmentés\nLes rôles de Valoria, ils sont achetables dans la boutique\n\n**Liste de tous les rôles :**";
          category = "Roles";
        } else if (choice === "badges") {
          result = await dbManager.getAllBadge();
          title = "Infos - Badges";
          description =
            "***Dans le royaume de Valoria, les badges sont bien plus que de simples insignes. Ils représentent des statuts, Portés fièrement par leurs détenteurs, chaque badge raconte une histoire et confère des privilèges uniques ou des responsabilités spécifiques.***\n ⚠️ Compétence des badges NON implèmentés\n\n**Liste de tous les badges de Valoria :**";
          category = "Badges";
        } else {
          interaction.reply({ content: "Choix invalide", ephemeral: true });
          return;
        }

        const embeds = [];
        let currentEmbed = new EmbedBuilder()
          .setTitle(title)
          .setColor(colors)
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(description);

        result.forEach((item, index) => {
          const description = `> *${item.lore}*\n__~~**----------------------------------**~~__`;
          currentEmbed.addFields({
            name: `${
              category === "Matériaux" || category === "Badges"
                ? emoji(emo[item.nom]) +
                  " " +
                  item.nom +
                  "\n**Rarete :**" +
                  item.rarete
                : category === "Rôles"
                ? `<@&${item.id}>`
                : item.nom
            }`,

            value: description,
          });

          if ((index + 1) % 3 === 0) {
            embeds.push(currentEmbed);
            currentEmbed = new EmbedBuilder()
              .setTitle(title)
              .setColor(colors)
              .setFooter({
                text: `Demandé(e) par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              });
          }
        });

        embeds.push(currentEmbed);
        // Determine if the rare button should appear
        const NewShowRareButton = Math.random() < 0.01; // 1 in 100 chance

        const NewRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
        );

        if (NewShowRareButton) {
          NewRow.addComponents(
            new ButtonBuilder()
              .setCustomId("secret")
              .setLabel("🎁")
              .setStyle(ButtonStyle.Success)
          );
        }
        let NewCurrentPage = 0;
        const NewMessage = await interaction.reply({
          embeds: [embeds[NewCurrentPage]],
          components: [NewRow],
          fetchReply: true,
          ephemeral: true,
        });

        const gfilter = (i) =>
          ["previous", "next", "secret", "claim"].includes(i.customId) &&
          i.user.id === interaction.user.id;

        const Gcollector = NewMessage.createMessageComponentCollector({
          gfilter,
          time: 80000,
        });
        Gcollector.on("collect", async (i) => {
          if (i.customId === "next") {
            NewCurrentPage = (NewCurrentPage + 1) % embeds.length;
            await i.update({
              embeds: [embeds[NewCurrentPage]],
              components: [NewRow],
            });
          } else if (i.customId === "previous") {
            NewCurrentPage =
              (NewCurrentPage - 1 + embeds.length) % embeds.length;
            await i.update({
              embeds: [embeds[NewCurrentPage]],
              components: [NewRow],
            });
          } else if (i.customId === "secret") {
            NewRow.addComponents(
              new ButtonBuilder()
                .setCustomId("claim")
                .setLabel("🧧 Claim !!!!")
                .setStyle(ButtonStyle.Success)
            );
            await i.update({ embeds: [hiddenPage], components: [NewRow] });
          } else if (i.customId === "claim") {
            const power = await dbManager.generateRandomPower();
            await dbManager.setPowerById(interaction.user.id, power);
            const randomMaterial =
              legendaryMaterials[
                Math.floor(Math.random() * legendaryMaterials.length)
              ];
            await dbManager.addMaterialToUser(
              interaction.user.id,
              randomMaterial.id
            );
            await i.update({
              content: `Claimed! reçu ${power} power et un matériel légendaire ${emoji(
                emo[randomMaterial.nom]
              )} ${randomMaterial.nom}.`,
              embeds: [],
              components: [],
            });
          }
        });

        Gcollector.on("end", () => {
          NewRow.components.forEach((component) => component.setDisabled(true));
          NewMessage.edit({ components: [NewRow] });
        });
      case "classement":
        const embedClassement = new EmbedBuilder()
          .setTitle(`Classement des utilisateurs`)
          .setColor(colors);

        const top = 5;

        // Rank par fragment
        const powerResult = await dbManager.getTopUsers("power", top);
        let powerDescription = "";
        for (let i = 0; i < powerResult.length; i++) {
          const user = `${powerResult[i].discordId}`;
          if (user === undefined) {
            powerDescription += `${i + 1}. Utilisateur inconnu : ${powerResult[
              i
            ].power.toLocaleString()}\n`;
          } else {
            powerDescription += `${i + 1}. <@${user}> : ${powerResult[
              i
            ].power.toLocaleString()} ${emoji(emo.power)}\n`;
          }
        }
        embedClassement.addFields({
          name: "🏆 Top ",
          value: powerDescription,
          inline: true,
        });

        // Rank par victoire
        const winResult = await dbManager.getTopUsers("winCounter", top);
        let winDescription = "";
        for (let i = 0; i < winResult.length; i++) {
          const user = `${winResult[i].discordId}`;
          if (user === undefined) {
            winDescription += `${i + 1}. Utilisateur inconnu : ${
              winResult[i].winCounter
            }\n`;
          } else {
            winDescription += `${i + 1}. <@${user}> : ${
              winResult[i].winCounter
            }\n`;
          }
        }
        embedClassement.addFields({ name: " ", value: " ", inline: true });
        embedClassement.addFields({
          name: "👑 Top - Victoires",
          value: winDescription,
          inline: true,
        });

        // Rank par puissance de Guild
        const topGuilds = await dbManager.calculateGuildRiches();

        const topGuildsDescription = topGuilds
          .map(
            (guild, index) =>
              `${index + 1}. **${guild.tag}**: ${guild.richesse}${emoji(
                emo.power
              )}`
          )
          .join("\n");
        embedClassement.addFields({
          name: "👑 - Top Guild",
          value: topGuildsDescription || "Aucune guilde disponible",
          inline: false,
        });

        // Rank par Win Rate
        const rateResult = await dbManager.getTopUsersByRate(top);
        let rateDescription = "";
        for (let i = 0; i < rateResult.length; i++) {
          const user = await `${rateResult[i].discordId}`;
          if (user === undefined) {
            rateDescription += `${i + 1}. Utilisateur inconnu : ${(
              rateResult[i].rate * 100
            ).toFixed(2)}%\n`;
          } else {
            rateDescription += `${i + 1}. <@${user}> : ${(
              rateResult[i].rate * 100
            ).toFixed(2)}%\n`;
          }
        }
        embedClassement.addFields({ name: " ", value: " ", inline: true });
        embedClassement.addFields({
          name: "👑 Top - Taux de victoire",
          value: rateDescription,
          inline: true,
        });

        return interaction.reply({ embeds: [embedClassement] });
      case "social":
        const embedSocial = new EmbedBuilder()
          .setTitle("Social Queen Link")
          .setColor(colors)
          .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
          .setDescription(
            `➼ ** | [${emoji(
              emo.git
            )} RuBy67](https://github.com/RuBy-67)**\n➼ ** | [${emoji(
              emo.x
            )} @Ru3y_67](https://x.com/Ru3y_67)**\n➼ ** | [${emoji(
              emo.insta
            )} @ru3y_67](https://www.instagram.com/ru3y_67?igsh=MXZ0aDFjZHZncTlzdw==)**\n➼ ** |** ${emoji(
              emo.discord
            )} <@375590278880428034>\n\n *Besoin d'une Update, un beug ? DM moi 😉*`
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        return interaction.reply({ embeds: [embedSocial] });
      case "guildes":
        const guildsEmbed = new EmbedBuilder()
          .setTitle("Infos - Guilde")
          .setColor(colors)
          .setDescription(
            "*Les guildes de Valoria sont des organisations puissantes et influentes qui rassemblent des individus partageant les mêmes idéaux et objectifs. Chaque guilde a sa propre histoire, sa propre culture et ses propres traditions, et ses membres sont liés par des liens de camaraderie et de loyauté. Les guildes jouent un rôle crucial dans la politique, l'économie et la culture de Valoria, et leurs actions peuvent changer le cours de l'histoire.*\n\n Créez votre guilde avec `/guild create [nom] [description]`"
          )
          .addFields({
            name: "🏰 - Guilde Commande",
            value:
              "__Pour les Admin de guilde:__\n- `/gestionguild help`\n**-----**\n__Pour les membres de guilde:__\n- `/guild join`,\n- `/guild leave`,\n- `/guild info`,\n- `/guild give [amount]`\n**-----**\n__Pour le Marchand / Alchimiste:__\n- `/alchimiste sell`\n- `/alchimiste stock`\n- `/alchimiste fabrique`",
          })
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        return await interaction.reply({
          embeds: [guildsEmbed],
          ephemeral: true,
        });
      case "roleguildes":
        const guildRolesEmbed = new EmbedBuilder()
          .setTitle("Infos - Rôles de Guilde")
          .setColor(colors)
          .setDescription(
            "*Les rôles de guilde sont des titres honorifiques et des fonctions spécifiques attribués aux membres des guildes de Valoria. Chaque rôle a ses propres responsabilités et privilèges, et contribue à la structure et au fonctionnement de la guilde. Les rôles de guilde sont un reflet de la culture et de l'organisation de chaque guilde, et ils sont souvent associés à des traditions et des rituels spécifiques.*"
          )
          .addFields(
            {
              name: `${emoji(emo.King)} - Empereur`,
              value:
                "L’Empereur est responsable de la guild, il peut recruter des membres, gérer les rangs et les rôles, [A venir] --> et organiser des événements pour la guilde. ",
            },
            {
              name: `${emoji(emo.reine)} - Reine`,
              value:
                "*La reine est la compagne de l'Empereur, elle est la seconde personne la plus importante de la guilde, elle est chargée de la gestion de la guilde en l'absence de l'Empereur. Elle peut recruter des membres, gérer les rangs et les rôles, [A venir] --> et organiser des événements pour la guilde.*",
            },
            {
              name: `${emoji(emo.class2)} - Ministre`,
              value:
                "Pour être promus Ministre il faut posséder les rôles suivant :\n- <@&1246944929675087914>\n- <@&1246944923526234113>\n- <@&1246944911580991549>\n\n*Le Ministre est le bras droit de l'Empereur, il est chargé de la gestion de la guilde et de l'organisation de la guilde. Il peut recruter des membres, gérer les rangs et les rôles, [A venir] --> et organiser des événements pour la guilde.*",
            },
            {
              name: `${emoji(emo.marchand)} - Marchand`,
              value:
                "Pour être promus Marchand il faut posséder le rôle suivant :\n<@&1246944923526234113>\n\n*Il n'y à qu'un seul Marchand par guilde, promus par l’Empereur en personne il est le responsable de la boutique de guilde, fabrique des potions grâce à ses connaissance en Alchimie et peut vendre des potion de guilde à ses membres.*",
            },
            {
              name: `${emoji(emo.class3)} - Noble`,
              value:
                "Pour être promus Noble il faut posséder les rôles suivant :\n- <@&1246944929675087914>\n- <@&1246944923526234113>\n- <@&1246944911580991549>\n- <@&1216037978913378389>\n\n*Le Nobles à des droits et des devoirs envers la guilde. [A venir]*",
            },
            {
              name: `${emoji(emo.class4)} - Chevalier`,
              value:
                "Pour être promus chevalier il faut posséder les rôles suivant :\n- <@&1247280292213948446>\n- <@&1246944929675087914>\n- <@&1246944923526234113>\n- <@&1246944911580991549>\n- <@&1216037978913378389>\n- <@&1216037978913378388>\n\n*Le Chevalier à des droits et des devoirs envers la guilde.[A venir]*",
            },
            {
              name: `${emoji(emo.class5)} - Paysan`,
              value: "*Simple de membre de Guilde*",
            },
            {
              name: `${emoji(emo.Esclave)} - Esclave`,
              value: "*Simple esclave de Guilde*",
            }
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        await interaction.reply({
          embeds: [guildRolesEmbed],
          ephemeral: true,
        });
      case "entrainement":
        const trainEmbed = new EmbedBuilder()
          .setTitle("Infos - Campagne Entrainement")
          .setColor(colors)
          .setDescription(
            "*La campagne d'entraînement est une série de défis conçus pour tester les compétences et la détermination des aventuriers de Valoria. Les participants doivent affronter des bosses redoutables,*\n\n- `/campagne entrainement`"
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        await interaction.reply({
          embeds: [trainEmbed],
          ephemeral: true,
        });
      case "help":
        const helpEmbed = new EmbedBuilder()
          .setTitle("Infos - Commandes")
          .setColor(colors)
          .setDescription(
            "*Commande supplémentaire non listé dans le reste des help*"
          )
          .addFields({
            name: "📚 - Général",
            value:
              "`/marriage` - Gérer le mariage\n" +
              "`/divorce` - Gérer le divorce\n" +
              "`/info profil` - Afficher le profil utilisateur\n" +
              "`/info lore` - Obtenir des informations sur le lore\n" +
              "`/info bot` - Informations sur le bot (MAJ ect)\n" +
              "`/info generale` - Informations générales, Matériaux, Badge, Role\n" +
              "`/info classement` - Voir les classements\n" +
              "`/info social`\n" +
              "`/info guildes` - Informations sur les guildes\n" +
              "`/info roleguildes` - Informations sur les rôles de guilde\n" +
              "`/info entrainement` - Informations sur l'entraînement\n" +
              "`/gestionguild help` - Aide pour la gestion de guilde\n",
          })
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

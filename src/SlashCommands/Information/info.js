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
  name: "info",
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
        const pages = [
          new EmbedBuilder()

            .setTitle(`Profil de ${targetUser.username}`)
            .setColor(colors)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
              {
                name: "Situation :",
                value: marriageStatus,
                inline: true,
              },
              {
                name: "Fragments :",
                value: `${power} ${emoji(emo.power)}` || "0",
                inline: true,
              },
              { name: "Badges :", value: badges || "Aucun", inline: false },
              {
                name: "Roles :",
                value: role || "Aucun",
                inline: false,
              },
              {
                name: "Matériaux :",
                value: materiaux || "Aucun",
                inline: false,
              },
              { name: "Win :", value: `${win}`, inline: true },
              { name: "Lose :", value: `${lose}`, inline: true },
              {
                name: "Rate :",
                value: `${(rate * 100).toFixed(2)}%`,
                inline: true,
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
          .setDescription()
          .addFields(
            {
              name: "📖 - Histoire",
              value:
                "Les origines de Valoria remontent à une époque oubliée, où les dieux marchaient parmi les mortels et où la magie régnait en maître. Les premières civilisations ont émergé des profondeurs de l'histoire, construisant des cités majestueuses et érigeant des temples dédiés aux puissances divines. Mais avec le pouvoir est venu le conflit, et les guerres ont ravagé les terres de Valoria, laissant derrière elles des ruines et des cicatrices.",
            },
            {
              name: "🧙‍♂️ - Magie",
              value:
                "La magie est le tissu même de Valoria, imprégnant chaque pierre, chaque arbre et chaque souffle de vent. Les arcanes sont étudiés et maîtrisés par ceux qui cherchent le savoir et la puissance. Des sorciers solitaires aux ordres mystiques, les praticiens de la magie utilisent leurs dons pour façonner le monde selon leur volonté, invoquant des tempêtes et des étoiles, guérissant les malades et invoquant des démons.",
            },
            {
              name: "⛰️ - Géographie",
              value:
                "Les terres de Valoria sont aussi vastes que variées, allant des sommets enneigés des montagnes de l'Est aux jungles luxuriantes de l'Ouest. Au nord, les déserts brûlants abritent des tribus nomades et des ruines anciennes, tandis qu'au sud, les vastes étendues des plaines fertiles sont le berceau de villes prospères et de cultures florissantes. Les océans entourent Valoria, offrant des voies commerciales et des mystères insondables.",
            },
            {
              name: "📕 - Culture",
              value:
                "La culture de Valoria est aussi diverse que ses habitants. Des festivals colorés célèbrent les saisons et les traditions, tandis que les guildes d'artisans et de marchands prospèrent dans les rues animées des villes. Les légendes et les chansons sont transmises de génération en génération, immortalisant les exploits des héros et les chutes des tyrans. C'est dans ce kaléidoscope de cultures et de croyances que l'histoire de Valoria se déroule, tissée de fils de destinée et de choix.",
            },
            {
              name: `${emoji(emo.power)} - Fragments de Protection`,
              value:
                "Ces fragments, représente l'énergie vitale et la force de défense des habitants du royaume, sont convoités par tous. Ils sont utilisés comme monnaie pour acquérir des biens, des services et des compétences. Les joueurs se lancent dans des duels acharnés pour obtenir ces précieux fragments et renforcer leur position dans le royaume.",
            }
          )
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
              name: "📚 V 0.1.2 -> V 1.0.0 Sortie de béta",
              value: `>>> - Ajout des DayBox et Randombox dans la boutique\n- Reset des Fragements\n- Ajout des Dayli free box\n- Ajout Roulette Russe (Admin) et solo \n- 👽 Correction de beug mineur\n__~~**----------------------------------------**~~__`,
            },
            {
              name: "📚 V 1.0.0-> ...",
              value: `>>> - Ajout d'une campagne solo\n- Ajout des royaumes (Empereur)\n- Ajout Duel 'Publique'\n- Ajout de l'utilité des role, badge, mariage \n- 👽 Correction de beug mineur\n__~~**----------------------------------------**~~__`,
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
          interaction.reply("Choix invalide");
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
            powerDescription += `${i + 1}. Utilisateur inconnu : ${
              powerResult[i].power
            }\n`;
          } else {
            powerDescription += `${i + 1}. <@${user}> : ${
              powerResult[i].power
            } ${emoji(emo.power)}\n`;
          }
        }
        embedClassement.addFields({
          name: "🏆 Top - Fragments de Protection",
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

        // Rank par défaite
        const loseResult = await dbManager.getTopUsers("loseCounter", top);
        let loseDescription = "";
        for (let i = 0; i < loseResult.length; i++) {
          const user = `${loseResult[i].discordId}`;
          if (user === undefined) {
            loseDescription += `${i + 1}. Utilisateur inconnu : ${
              loseResult[i].loseCounter
            }\n`;
          } else {
            loseDescription += `${i + 1}. <@${user}> : ${
              loseResult[i].loseCounter
            }\n`;
          }
        }
        embedClassement.addFields({
          name: "👎 Top - Looser",
          value: loseDescription,
          inline: true,
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

      default:
        await interaction.reply({
          content: "Commande slash invalide.",
          ephemeral: true,
        });
    }
  },
};

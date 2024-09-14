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
const Boss = require("../../class/bossManager");
const bossManager = new Boss();

module.exports = {
  name: "infos",
  description: "Informations",
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
            {
              name: "Boss",
              value: "boss",
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
        async function createBossEmbed(
          boss,
          bossInfo,
          statsResult,
          params,
          targetUser,
          EmbedColor,
          emo
        ) {
          const bossBoosts = await bossManager.calculateBossBoosts(
            boss,
            dbManager,
            targetUser,
            bossInfo
          );

          let materiau1 = false;
          let materiau2 = false;
          let materiau1Data = false;
          let materiau2Data = false;
          if (boss.muId1 != 0) {
            const [materiauId1Data] = await dbManager.getIdMateriauByIdUnique(
              boss.muId1
            );
            const [materiauData] = await dbManager.getDataMateriauById(
              materiauId1Data.materiauId
            );
            materiau1 = materiauData;
            materiau1Data = materiauId1Data;
          }
          if (boss.muId2 != 0) {
            const [materiauId2Data] = await dbManager.getIdMateriauByIdUnique(
              boss.muId2
            );
            const [materiauData] = await dbManager.getDataMateriauById(
              materiauId2Data.materiauId
            );
            materiau2 = materiauData;
            materiau2Data = materiauId2Data;
          }
          const calculateRealBoost = (baseBoost, level) => {
            return Math.round(baseBoost * (1 + level * 0.2));
          };

          // Fonction pour formater l'affichage des matériaux
          async function materialInfo(materiau, materiauData, targetUser) {
            if (!materiau) return null;

            const santeBoostReel = calculateRealBoost(
              materiau.santeBoost,
              materiauData.level
            );
            const attaqueBoostReel = calculateRealBoost(
              materiau.attaqueBoost,
              materiauData.level
            );
            const defenseBoostReel = calculateRealBoost(
              materiau.defenseBoost,
              materiauData.level
            );

            const defenseBoostUpgrade = calculateRealBoost(
              materiau.defenseBoost,
              materiauData.level + 1
            );
            const attaqueBoostUpgrade = calculateRealBoost(
              materiau.attaqueBoost,
              materiauData.level + 1
            );
            const santeBoostUpgrade = calculateRealBoost(
              materiau.santeBoost,
              materiauData.level + 1
            );

            const diffSante = santeBoostUpgrade - santeBoostReel;
            const diffAttaque = attaqueBoostUpgrade - attaqueBoostReel;
            const diffDefense = defenseBoostUpgrade - defenseBoostReel;

            const priceUpgrade = await dbManager.calculateUpgradePrice(
              materiau,
              materiauData,
              targetUser.id
            );

            const formattedPrice = priceUpgrade.toLocaleString("fr-FR");

            let materialString = `**${emoji(emo[materiau.nom])} ${
              materiau.nom
            }**\n**(${materiau.rarete})**, lvl : **${materiauData.level}/${
              params.maxLevel
            }**`;
            if (santeBoostReel != 0) {
              materialString += `\n💚 Santé: **+${santeBoostReel}%**`;
              if (materiauData.level < params.maxLevel) {
                materialString += ` ${emoji(emo.up)}(+ ${diffSante}%)`;
              }
            }
            if (attaqueBoostReel != 0) {
              materialString += `\n⚔️ Attaque: **+${attaqueBoostReel}%**`;
              if (materiauData.level < params.maxLevel) {
                materialString += ` ${emoji(emo.up)}(+ ${diffAttaque}%)`;
              }
            }
            if (defenseBoostReel != 0) {
              materialString += `\n🛡️ Défense: **+${defenseBoostReel}%**`;
              if (materiauData.level < params.maxLevel) {
                materialString += ` ${emoji(emo.up)}(+ ${diffDefense}%)`;
              }
            }
            if (materiauData.level < params.maxLevel) {
              materialString += `\n\n- Upgrade : **${formattedPrice}** ${emoji(
                emo.power
              )}`;
            }

            return materialString;
          }

          // Construction des informations des matériaux équipés
          const EquippedMateriaux = [
            await materialInfo(materiau1, materiau1Data, targetUser),
            await materialInfo(materiau2, materiau2Data, targetUser),
          ]
            .filter((info) => info !== null)
            .join("\n\n");

          // Gestion des raretés et poussières
          const raretes = {
            "Commune 🟢": "poussiereCommune",
            "Rare 🟠": "poussiereRare",
            "Épique 🟣": "poussiereEpique",
            "Légendaire 🟡": "poussiereLegendaire",
          };
          const rareteKey = bossInfo.type;
          const rarete = Object.keys(raretes)[rareteKey - 1] || "Inconnue";
          const colonnePoussiere = raretes[rarete] || "0";
          const quantitePoussiere = statsResult[colonnePoussiere] || 0;

          const diffSanteBoss = bossBoosts.santeBoost1 - bossBoosts.santeBoss;
          const diffAttaqueBoss =
            bossBoosts.attaqueBoost1 - bossBoosts.attaqueBoss;
          const diffDefenseBoss =
            bossBoosts.defenseBoost1 - bossBoosts.defenseBoss;

          // Utilisation des boosts calculés pour le boss
          let bossStats = `💚 Santé: **${Math.round(bossBoosts.santeBoss)}%**`;
          if (boss.level < params.maxLvlBoss) {
            bossStats += ` ${emoji(emo.up)} (+${diffSanteBoss}%)`;
          }

          bossStats += `\n⚔️ Attaque: **${Math.round(
            bossBoosts.attaqueBoss
          )}%**`;

          if (boss.level < params.maxLvlBoss) {
            bossStats += ` ${emoji(emo.up)} (+${diffAttaqueBoss}%)`;
          }

          bossStats += `\n🛡️ Défense: **${Math.round(
            bossBoosts.defenseBoss
          )}%**`;
          if (boss.level < params.maxLvlBoss) {
            bossStats += ` ${emoji(emo.up)} (+${diffDefenseBoss}%)`;
          }

          // Ligne de séparation pour l'esthétique
          bossStats += `\n__-------------------------__`;

          // Gestion des niveaux et autres éléments pour l'embed
          const currentBossLevel = boss.level;
          const roundedLevel = Math.ceil((currentBossLevel + 1) * 0.1) * 10;
          const requiredPoussière = (currentBossLevel + 1) * 10;
          const requiredCard =
            params.troops.bosses.type[bossInfo.type].carte[roundedLevel] || "0";

          // Création de l'embed
          const embed = new EmbedBuilder()
            .setAuthor({
              name: `Bosses`,
              iconURL: targetUser.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(
              `${bossInfo.nom} - (Niveau : ${boss.level}/${params.maxLvlBoss})`
            )
            .setThumbnail(bossInfo.image)
            .setColor(EmbedColor)
            .addFields(
              {
                name: "Rareté",
                value: rarete,
              },
              {
                name: "Boosts",
                value: bossStats,
              },
              ...(boss.level < 60
                ? [
                    {
                      name: `${emoji(
                        emo["Poussière de terre"]
                      )} Poussière (${rarete}) - pour niveau ${boss.level + 1}`,
                      value: `${quantitePoussiere}/${requiredPoussière}`,
                      inline: true,
                    },
                    {
                      name: `🃏 Carte pour niveau ${roundedLevel}`,
                      value: `${boss.carte || 0}/${requiredCard}`,
                      inline: true,
                    },
                  ]
                : []),
              {
                name: "Matériaux équipés",
                value:
                  "*Les Bonus sont Appliquées au boss qui l'applique aux troupes*\n\n" +
                  EquippedMateriaux,
              }
            )
            .setFooter({
              text: `Page ${pages.length + 1}/${bossResult1.length + 1}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            });

          return embed;
        }

        async function addSelectComponent(userId, bossId) {
          let components = [];
          const actionRow = new ActionRowBuilder();
          const etat0Materials = await player.getMaterialsByIdEtat0(userId);
          const userIdMaterials = await player.getMaterialsById(userId, bossId);

          // Récupère les matériaux de l'état 1 pour l'utilisateur (à confirmer si c'est bien 1)
          if (etat0Materials.length > 0 && userIdMaterials.length < 2) {
            const selectOptions = (
              await player.getMaterialsStringSelect(userId, 0, bossId, true)
            )
              .split("\n")
              .map((material) => {
                const [emo, nom, lvl, id] = material.split("_");
                return new StringSelectMenuOptionBuilder()
                  .setEmoji(emo)
                  .setLabel(`${nom}(lvl: ${lvl})`)
                  .setValue(`${id}_${lvl}`);
              });

            if (selectOptions.length > 0) {
              const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`material_select_${bossId}`)
                .setPlaceholder("Set Materiaux")
                .setMaxValues(1)
                .addOptions(selectOptions);

              actionRow.addComponents(selectMenu);
            }
          } else {
            return [];
          }
          components.push(actionRow);
          return components;
        }
        async function addUnselectComponent(userId, bossId) {
          let components = [];
          const actionRow = new ActionRowBuilder();
          const userIdMaterials = await player.getMaterialsById(userId, bossId);
          if (userIdMaterials.length > 0) {
            const unselectOptions = (
              await player.getMaterialsStringSelect(userId, 1, bossId, true)
            )
              .split("\n")
              .map((material) => {
                const [emo, nom, lvl, id] = material.split("_");
                return new StringSelectMenuOptionBuilder()
                  .setEmoji(emo)
                  .setLabel(`${nom}(lvl: ${lvl})`)
                  .setValue(`${id}_${lvl}`);
              });

            if (unselectOptions.length > 0) {
              const unselectMenu = new StringSelectMenuBuilder()
                .setCustomId(`material_unselect_${bossId}`)
                .setPlaceholder("Unset Materiaux")
                .setMaxValues(1)
                .addOptions(unselectOptions);

              actionRow.addComponents(unselectMenu);
            }
          } else {
            return [];
          }
          components.push(actionRow);
          return components;
        }

        const target =
          interaction.options.getMember("membre") || interaction.member;
        const targetUser = await client.users.fetch(target.user.id);

        // Récupérer les boss possédés par l'utilisateur
        const bossResult1 = await dbManager.getBossByUser(targetUser.id);

        const pages = [];
        const compo = [];
        const compo1 = [];

        // Profil principal
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
          marriageStatus = `Marié(e) avec <@${spouse.user.id}> \nDepuis le: <t:${mariageTimestamp}:D>`;
        }

        const statsResult = await dbManager.getStats(targetUser.id);
        const win = statsResult.winCounter;
        const dead = statsResult.deadCounter;
        const power = statsResult.power;
        const roleInfo = await dbManager.getRoleByUserId(targetUser.id);

        let role = "Aucun";
        if (roleInfo.length > 0) {
          role = roleInfo.map((role1) => `<@&${role1.id}>`).join(" ");
        }
        let EmbedColor = colors;
        let guildTag = "";

        if (statsResult.guildId != null) {
          const guildInfo = await dbManager.getGuildById(statsResult.guildId);
          if (guildInfo[0].empreur == targetUser.id) {
            guildTag = `${emoji(emo.King)} Empereur de **${
              guildInfo[0].nom
            }** - ***[${guildInfo[0].tag}]***`;
            EmbedColor = guildInfo[0].bannière;
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
            } de **${guildInfo[0].nom}** - ***[${guildInfo[0].tag}]***`;
            EmbedColor = guildInfo[0].bannière;
          }
        } else {
          guildTag = "Aucune guilde associée";
        }
        const civilisation = statsResult.civilisation;
        const capitalizedCivilisation =
          civilisation.charAt(0).toUpperCase() + civilisation.slice(1);

        pages.push(
          new EmbedBuilder()
            .setAuthor({
              name:
                "Puissance : " +
                power.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
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
                name: "Civilisation :",
                value: `${emoji(
                  emo[statsResult.civilisation]
                )} **${capitalizedCivilisation}**`,
              },
              {
                name: "Information :",
                value: `Fragments : ${statsResult.fragment
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${emoji(
                  emo.power
                )}\nBadges : ${badges}\n`,
                inline: true,
              },
              {
                name: "Roles :",
                value: role || "Aucun",
                inline: true,
              },
              {
                name: "Performance",
                value: `🏆 Win : **${win}**\n☠️ Dead : **${dead}**`,
                inline: false,
              }
            )
            .setFooter({
              text: `demandé(e) par ${interaction.user.tag} - Page 1/${
                bossResult1.length + 1
              }`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
        );
        let i = 0;

        for (const boss of bossResult1) {
          const bossInfo = await dbManager.getBossInfo(boss.bossId);
          const embed = await createBossEmbed(
            boss,
            bossInfo[0],
            statsResult,
            params,
            targetUser,
            EmbedColor,
            emo
          );
          const pageComponents = await addUnselectComponent(
            interaction.user.id,
            boss.bossId
          );
          const pageComponentsSelect = await addSelectComponent(
            interaction.user.id,
            boss.bossId
          );
          pages.push(embed);
          compo.push(pageComponents);
          compo1.push(pageComponentsSelect);
        }
        let currentPage = 0;
        let componentPage = -1;

        let row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(targetUser.id !== interaction.user.id), // Désactiver si pas le propriétaire
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(targetUser.id !== interaction.user.id) // Désactiver si pas le propriétaire
        );

        let row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("upgrade")
            .setLabel("Upgrade Boss")
            .setStyle(ButtonStyle.Success)
            .setEmoji(emo.up),
          new ButtonBuilder()
            .setCustomId("upgrade_mat1")
            .setLabel("Upgrade Matériaux 1")
            .setEmoji(emo.up)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("upgrade_mat2")
            .setLabel("Upgrade Matériaux 2")
            .setEmoji(emo.up)
            .setStyle(ButtonStyle.Secondary)
        );

        // Envoyer le message avec les composants appropriés
        const components = currentPage === 0 ? [row] : [row2];

        const message = await interaction.reply({
          embeds: [pages[currentPage]],
          components: components,
          compo,
          fetchReply: true,
        });
        const filter = (i) => {
          const validCustomIds = [
            "previous",
            "next",
            "upgrade",
            "upgrade_mat1",
            "upgrade_mat2",
          ];

          const isBasicInteraction = validCustomIds.includes(i.customId);
          const isSelectOrUnselect =
            i.customId.startsWith("material_select_") ||
            i.customId.startsWith("material_unselect_");
          const isUserInteraction = i.user.id === interaction.user.id;

          return (
            (isBasicInteraction || isSelectOrUnselect) && isUserInteraction
          );
        };

        const collector = message.createMessageComponentCollector({
          filter,
          time: 80000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "next") {
            currentPage = (currentPage + 1) % pages.length;
            componentPage = (componentPage + 1) % compo.length;
          } else if (i.customId === "previous") {
            currentPage = (currentPage - 1 + pages.length) % pages.length;
            componentPage = (componentPage - 1 + compo.length) % compo.length;
          } else if (i.customId === "upgrade") {
            const bossIndex = currentPage - 1;
            if (bossIndex >= 0 && bossIndex < bossResult1.length) {
              const boss = bossResult1[bossIndex];

              if (boss.level >= 60) {
                return i.reply({
                  content: "Le boss est déjà au niveau maximum.",
                  ephemeral: true,
                });
              }

              const raretes = {
                "Commune 🟢": "poussiereCommune",
                "Rare 🟠": "poussiereRare",
                "Épique 🟣": "poussiereEpique",
                "Légendaire 🟡": "poussiereLegendaire",
              };
              const bossInfo = await dbManager.getBossInfo(boss.bossId);
              const statsResult2 = await dbManager.getStats(targetUser.id);
              const rareteKey = bossInfo[0].type;
              const rarete = Object.keys(raretes)[rareteKey - 1] || "Inconnue";
              const colonnePoussiere = raretes[rarete] || "0";
              const quantitePoussiere = statsResult2[colonnePoussiere] || 0;
              const currentBossLevel = boss.level;
              const roundedLevel = Math.ceil((currentBossLevel + 1) * 0.1) * 10;
              const requiredPoussière = (currentBossLevel + 1) * 10;
              const requiredCard =
                params.troops.bosses.type[rareteKey].carte[roundedLevel] || "0";

              if (quantitePoussiere < requiredPoussière) {
                return i.reply({
                  content: `Vous n'avez pas assez de poussière pour améliorer ce boss.`,
                  ephemeral: true,
                });
              }

              if (boss.carte < requiredCard && boss.level % 10 == 0) {
                return i.reply({
                  content: `Vous n'avez pas assez de cartes pour améliorer ce boss.`,
                  ephemeral: true,
                });
              }
              // Effectuer l'upgrade
              await dbManager.upgradeBoss(targetUser.id, boss.bossId);
              const updatedBossInfo = await dbManager.getBossInfo(boss.bossId);

              const boss1 = await dbManager.getBossByUserByBossId(
                targetUser.id,
                boss.bossId
              );

              pages[currentPage] = await createBossEmbed(
                boss1[0],
                updatedBossInfo[0],
                statsResult,
                params,
                targetUser,
                EmbedColor,
                emo
              );

              let updatedRow2 = null;
              if (targetUser.id === interaction.user.id && currentPage > 0) {
                updatedRow2 = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("upgrade")
                    .setLabel("Upgrade Boss")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(emo.up),
                  new ButtonBuilder()
                    .setCustomId("upgrade_mat1")
                    .setLabel("Upgrade Matériaux 1")
                    .setEmoji(emo.up)
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("upgrade_mat2")
                    .setLabel("Upgrade Matériaux 2")
                    .setEmoji(emo.up)
                    .setStyle(ButtonStyle.Secondary)
                );
              }

              const updatedComponents =
                currentPage == 0
                  ? [row]
                  : [
                      row,
                      updatedRow2,
                      ...compo[componentPage],
                      ...compo1[componentPage],
                    ];

              await i.update({
                content: "Upgrade effectué !",
                embeds: [pages[currentPage]],
                components: updatedComponents,
              });
            }
          } else if (i.customId.startsWith("material_unselect_")) {
            const bossId = i.customId.split("_").pop();
            const [materialId, lvl] = i.values[0].split("_");

            await dbManager.updateMaterialState(
              targetUser.id,
              materialId,
              0,
              bossId,
              lvl
            );

            let menu1 = await addSelectComponent(targetUser.id, bossId);
            let menu2 = await addUnselectComponent(targetUser.id, bossId);
            const message = await interaction.fetchReply();
            const existingComponents = message.components || [];
            let preservedComponents = [];
            for (const component of existingComponents) {
              if (
                !component.components.some(
                  (c) =>
                    c.customId.startsWith("material_select_") ||
                    c.customId.startsWith("material_unselect_")
                )
              ) {
                preservedComponents.push(component);
              }
            }
            let combinedComponents = [
              ...preservedComponents,
              ...menu1,
              ...menu2,
            ];
            const statsResult = await dbManager.getStats(targetUser.id);
            const bossInfo = await dbManager.getBossInfo(bossId);
            const boss1 = await dbManager.getBossByUserByBossId(
              targetUser.id,
              bossId
            );
            pages[currentPage] = await createBossEmbed(
              boss1[0],
              bossInfo[0],
              statsResult,
              params,
              targetUser,
              EmbedColor,
              emo
            );

            return i.update({
              embeds: [pages[currentPage]],
              components: combinedComponents,
            });
          } else if (i.customId.startsWith("material_select")) {
            const bossId = i.customId.split("_").pop();
            const [materialId, lvl] = i.values[0].split("_");

            await dbManager.updateMaterialState(
              targetUser.id,
              materialId,
              1,
              bossId,
              lvl
            );

            const statsResult = await dbManager.getStats(targetUser.id);
            const bossInfo = await dbManager.getBossInfo(bossId);
            const boss1 = await dbManager.getBossByUserByBossId(
              targetUser.id,
              bossId
            );
            let menu1 = await addSelectComponent(targetUser.id, bossId);
            let menu2 = await addUnselectComponent(targetUser.id, bossId);
            const message = await interaction.fetchReply();
            const existingComponents = message.components || [];
            let preservedComponents = [];
            for (const component of existingComponents) {
              if (
                !component.components.some(
                  (c) =>
                    c.customId.startsWith("material_select_") ||
                    c.customId.startsWith("material_unselect_")
                )
              ) {
                preservedComponents.push(component);
              }
            }
            let combinedComponents = [
              ...preservedComponents,
              ...menu1,
              ...menu2,
            ];

            pages[currentPage] = await createBossEmbed(
              boss1[0],
              bossInfo[0],
              statsResult,
              params,
              targetUser,
              EmbedColor,
              emo
            );

            return i.update({
              embeds: [pages[currentPage]],
              components: combinedComponents,
            });
          } else if (i.customId === "upgrade_mat1") {
            const statsResult2 = await dbManager.getStats(targetUser.id);
            const bossIndex = currentPage - 1;

            if (bossIndex >= 0 && bossIndex < bossResult1.length) {
              const boss = bossResult1[bossIndex];
              if (boss.muId1 != 0) {
                const idUnique = boss.muId1;

                const bossInfo = await dbManager.getBossInfo(boss.bossId);
                const boss1 = await dbManager.getBossByUserByBossId(
                  targetUser.id,
                  boss.bossId
                );
                const materialData = await dbManager.getIdMateriauByIdUnique(
                  idUnique
                );
                const dataMaterial = await dbManager.getDataMateriauById(
                  materialData[0].id
                );

                const priceUpgrade = await calculateUpgradePrice(
                  materialData[0],
                  boss1[0],
                  targetUser.id
                );
                if (materialData[0].level >= params.maxLevel) {
                  return i.reply({
                    content: `Le matériel **${emoji(
                      emo[dataMaterial[0].nom]
                    )} ${
                      dataMaterial[0].nom
                    }** est déjà au niveau maximum (lvl **${
                      materialData[0].level
                    })**.`,
                    ephemeral: true,
                  });
                }

                if (statsResult2.fragment < priceUpgrade) {
                  return i.reply({
                    content: `Vous n'avez pas assez de fragment ${emoji(
                      emo.power
                    )} pour améliorer *${emoji(emo[dataMaterial[0].nom])} ${
                      dataMaterial[0].nom
                    }** au level ${
                      materialData[0].level + 1
                    }(nécessaire: ${priceUpgrade}  ${emoji(emo.power)})`,
                    ephemeral: true,
                  });
                }
                await dbManager.updateMaterialLevel(targetUser.id, idUnique);
                await dbManager.updatePower(targetUser.id, -priceUpgrade);
                pages[currentPage] = await createBossEmbed(
                  boss1[0],
                  bossInfo[0],
                  statsResult,
                  params,
                  targetUser,
                  EmbedColor,
                  emo
                );

                await i.update({
                  content: `${emoji(emo[dataMaterial[0].nom])} ${
                    dataMaterial[0].nom
                  } amélioré ! au niveau  ${
                    materialData[0].level + 1
                  } (-${priceUpgrade} ${emoji(emo.power)})`,
                  embeds: [pages[currentPage]],
                });
              } else {
                i.reply({
                  content: "Aucun 'matériau 1' à améliorer.",
                  ephemeral: true,
                });
              }
            }
          } else if (i.customId === "upgrade_mat2") {
            // Gestion de l'upgrade du matériel 2
            const statsResult2 = await dbManager.getStats(targetUser.id);
            const bossIndex = currentPage - 1;
            if (bossIndex >= 0 && bossIndex < bossResult1.length) {
              const boss = bossResult1[bossIndex];
              if (boss.muId2 != 0) {
                const idUnique = boss.muId2;

                const bossInfo = await dbManager.getBossInfo(boss.bossId);
                const boss1 = await dbManager.getBossByUserByBossId(
                  targetUser.id,
                  boss.bossId
                );
                const materialData = await dbManager.getIdMateriauByIdUnique(
                  idUnique
                );
                const dataMaterial = await dbManager.getDataMateriauById(
                  materialData[0].id
                );
                const priceUpgrade = await calculateUpgradePrice(
                  materialData[0],
                  boss1[0],
                  targetUser.id
                );
                if (materialData[0].level >= params.maxLevel) {
                  return i.reply({
                    content: `Le matériel **${emoji(
                      emo[dataMaterial[0].nom]
                    )} ${
                      dataMaterial[0].nom
                    }** est déjà au niveau maximum (lvl **${
                      materialData[0].level
                    }**).`,
                    ephemeral: true,
                  });
                }
                if (statsResult2.fragment < priceUpgrade) {
                  return i.reply({
                    content: `Vous n'avez pas assez de fragment ${emoji(
                      emo.power
                    )} pour améliorer **${emoji(emo[dataMaterial[0].nom])} ${
                      dataMaterial[0].nom
                    }** au level ${
                      materialData[0].level + 1
                    }(nécessaire: ${priceUpgrade}  ${emoji(emo.power)})`,
                    ephemeral: true,
                  });
                }

                await dbManager.updateMaterialLevel(targetUser.id, idUnique);
                await dbManager.updatePower(targetUser.id, -priceUpgrade);
                pages[currentPage] = await createBossEmbed(
                  boss1[0],
                  bossInfo[0],
                  statsResult,
                  params,
                  targetUser,
                  EmbedColor,
                  emo
                );
                await i.update({
                  content: `${emoji(emo[dataMaterial[0].nom])} ${
                    dataMaterial[0].nom
                  } amélioré ! au niveau  ${
                    materialData[0].level + 1
                  } (-${priceUpgrade} ${emoji(emo.power)})`,
                  embeds: [pages[currentPage]],
                });
              } else {
                i.reply({
                  content: "Aucun 'matériau 2' à améliorer.",
                  ephemeral: true,
                });
              }
            }
          } else {
            i.reply({
              content: "Erreurs inconnue.",
              ephemeral: true,
            });
          }

          const updatedRow2 =
            currentPage > 0
              ? new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("upgrade")
                    .setLabel("Upgrade Boss")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(emo.up),
                  new ButtonBuilder()
                    .setCustomId("upgrade_mat1")
                    .setLabel("Upgrade Matériaux 1")
                    .setEmoji(emo.up)
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("upgrade_mat2")
                    .setLabel("Upgrade Matériaux 2")
                    .setEmoji(emo.up)
                    .setStyle(ButtonStyle.Secondary)
                )
              : null;

          const components =
            currentPage == 0
              ? [row]
              : [
                  row,
                  updatedRow2,
                  ...compo[componentPage],
                  ...compo1[componentPage],
                ];

          await i.update({
            embeds: [pages[currentPage]],
            components: components,
          });
        });

        collector.on("end", () => {
          row.components.forEach((component) => component.setDisabled(true));
          if (row2) {
            row2.components.forEach((component) => component.setDisabled(true));
          }
          message.edit({ components: [row, row2].filter(Boolean) });
        });
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
              name: "📚 V 1.5.2",
              value: `>>> - Ajout DATE by TATSU '/createdateprofil', '/date'\n- 👽 Correction de bug mineur & esthétique\n\nModification Importante Campagne de boss (puissance attaque défense) + logique, Nerf des récompense Modification des stats de boss ,division par 2 de la possibilité de faire une Égalité \n\n__~~**----------------------------------------**~~__`,
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
        const userStats = await dbManager.getStats(userId);

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
            "***Dans le royaume de Valoria, chaque individu peut choisir un rôle spécifique qui détermine son chemin et ses capacités au sein de la société. Ces rôles ne sont pas simplement des titres, mais des vocations imprégnées de pouvoir et de responsabilité. Chaque rôle confère des compétences uniques et des statuts particuliers.***\nLes rôles de Valoria, sont achetables dans la boutique\n\n**Liste de tous les rôles :**";
          category = "Roles";
        } else if (choice === "badges") {
          result = await dbManager.getAllBadge();
          title = "Infos - Badges";
          description =
            "***Dans le royaume de Valoria, les badges sont bien plus que de simples insignes. Ils représentent des statuts, Portés fièrement par leurs détenteurs, chaque badge raconte une histoire et confère des privilèges uniques ou des responsabilités spécifiques.***\n ⚠️ Compétence des badges NON implèmentés\n\n**Liste de tous les badges de Valoria :**";
          category = "Badges";
        } else if (choice === "boss") {
          result = await bossManager.getBosses();
          title = "Infos - Boss";
          description =
            "***Dans le royaume de Valoria, les Boss sont des créatures puissantes et redoutables qui règnent sur des territoires sauvages et hostiles. Chaque Boss est unique et possède des compétences et des capacités qui lui sont propres. Ils sont les gardiens des trésors et des secrets de Valoria, et leur défaite est le gage de richesses et de gloire.***\n\nIls sont également recrutable afin de mener à bien vos combat\n**Liste de tous les Boss de Valoria :**";
          category = "Boss";
        } else {
          interaction.reply({ content: "Choix invalide", ephemeral: true });
          return;
        }

        const embeds = [];
        let currentEmbed = new EmbedBuilder()
          .setAuthor({
            name: `Puissance : ${userStats.power.toLocaleString("fr-FR")}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
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

        let NewCurrentPage = 0;
        const NewMessage = await interaction.reply({
          embeds: [embeds[NewCurrentPage]],
          components: [NewRow],
          fetchReply: true,
          ephemeral: true,
        });

        const gfilter = (i) =>
          ["previous", "next"].includes(i.customId) &&
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

        const top = params.topClassement;
        ///rank par puissance
        const { sortedResults } = await dbManager.calculatePowerForAllUsers();
        const userId = interaction.user.id;
        let powerDescription = "";
        let userRank = null;
        for (let i = 0; i < sortedResults.length; i++) {
          const user = sortedResults[i];
          const userDiscordId = user.userId;

          if (userDiscordId === undefined) {
            powerDescription += `${
              i + 1
            }. Utilisateur inconnu : ${user.power.toLocaleString()}\n`;
          } else {
            if (userDiscordId === userId) {
              userRank = i + 1;
            }
            if (i < top) {
              powerDescription += `${
                i + 1
              }. <@${userDiscordId}> : ${user.power.toLocaleString()} \n`;
            }
          }
        }
        if (userRank && userRank > top) {
          powerDescription += `\n${userRank} : <@${userId}> : ${sortedResults[
            userRank - 1
          ].power.toLocaleString()} ${emoji(emo.power)}`;
        }
        embedClassement.addFields({
          name: "🔥 - Puissance",
          value: powerDescription,
        });

        //rank par dead
        const DeadResult = await dbManager.getTopUsers("deadCounter", top);
        let DeadDescription = "";
        for (let i = 0; i < DeadResult.length; i++) {
          const user = `${DeadResult[i].discordId}`;
          if (user === undefined) {
            DeadDescription += `${i + 1}. Utilisateur inconnu : ${
              DeadResult[i].winCounter
            }\n`;
          } else {
            DeadDescription += `${i + 1}. <@${user}> : ${
              DeadResult[i].winCounter
            }\n`;
          }
        }
        embedClassement.addFields({
          name: "☠️ - Dead",
          value: DeadDescription,
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

        embedClassement.addFields({
          name: "👑 - Victoires",
          value: winDescription,
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
          name: `${emoji(emo.power)} - Guildes`,
          value: topGuildsDescription || "Aucune guilde disponible",
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
              "__Pour les Admin de guilde:__\n- `/gestionguild help`\n**-----**\n__Pour les membres de guilde:__\n- `/guild join`,\n- `/guild leave`,\n- `/guild give [amount]`\n**-----**\n__Pour le Marchand / Alchimiste:__\n- `/alchimiste sell`\n- `/alchimiste stock`\n- `/alchimiste fabrique`",
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
            "*La campagne d'entraînement est une série de défis conçus pour tester les compétences et la détermination des aventuriers de Valoria. Les participants doivent affronter des bosses redoutables afin d'obtenir des récompense,*\n\n- `/campagne entrainement`"
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
              "`/gestionguild help` - Aide pour la gestion de guilde\n" +
              "`/guild info` - Informations sur la guilde\n" +
              "`/guild list` - Liste des guildes\n",
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

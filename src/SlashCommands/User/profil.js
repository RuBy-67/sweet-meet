const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const Player = require("../../class/player");
const player = new Player();

module.exports = {
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
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const target =
      interaction.options.getMember("membre") || interaction.member;
    const targetUser = await client.users.fetch(target.user.id);

    const materiauResult = await dbManager.getMateriauByUserId(targetUser.id);

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
        const description = `**Rareté:** ${materiau.rarete}\n**Type:** ${materiau.type}\n**Boost:** 💚 ${materiau.sante}% - ⚔️ ${materiau.attaque}% - 🛡️ ${materiau.defense}%\n**Description:** ${materiau.lore}\n**Quantité:** ${materiau.quantite}\n__~~**----------------------------------**~~__`;

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

    const pages = [
      new EmbedBuilder()

        .setTitle(`Profil de ${targetUser.username}`)
        .setColor(color.pink)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "Situation :",
            value: marriageStatus,
            inline: true,
          },
          { name: "Puissance :", value: `${power}`, inline: true },
          { name: "Badges :", value: badges, inline: false },
          { name: "Matériaux :", value: materiaux, inline: false },
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
        .setColor(color.pink)
        .setDescription(
          "*Dans l'univers mystique où ces matériaux émergent, leur utilité est souvent ancrée dans des récits légendaires et des croyances profondément enracinées. Chacun de ces matériaux mystiques possède des propriétés uniques, non seulement physiques, mais aussi symboliques, qui influencent leur utilisation dans diverses facettes de la vie.*\n\n***Le level Influe sur les Boost***"
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
      .setColor(color.pink)
      .setDescription(
        "Ho t'a trouvé la page secrète ! claim ton cadeau 🧧 c'est une chance sur 100 de tomber sur cette page, et te permet de claim entre 5000 et 15000 de power !\nAinsi que d'obtenir un matériaux legendaire parmis la liste suivante !"
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
    const showRareButton = Math.random() < 0.01; // 1 in 100 chance

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
          content: `Claimed! You received ${power} power and a legendary material: ${emoji(
            emo[randomMaterial.nom]
          )} ${randomMaterial.nom}.`,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on("end", () => {
      row.components.forEach((component) => component.setDisabled(true));
      message.edit({ components: [row] });
    });
  },
};

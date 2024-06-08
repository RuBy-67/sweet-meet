const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const emo = require("../../jsons/emoji.json");
const color = require("../../jsons/color.json");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();

module.exports = {
  name: "infos",
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
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const choice = interaction.options.getString("categorie");
    console.log(choice);
    let result = null;
    let title = "";
    let description = "";
    let category = "";

    if (choice === "materiaux") {
      result = await dbManager.getMateriau();
      title = "Infos - Matériaux";
      description =
        "Les matériaux de Valoria possèdent des propriétés uniques et sont recherchés par les guerriers pour leurs pouvoirs : \n\n**Liste de tous les matériaux :**";
      category = "Matériaux";
    } else if (choice === "roles") {
      result = await dbManager.getRolesFromDB();
      title = "Infos - Roles";
      description =
        "⚠️ Compétence des badges NON implèmentés\nLes rôles de Valoria possèdent des ils sont achetables dans la boutique\n\n**Liste de tous les rôles :**";
      category = "Roles";
    } else if (choice === "badges") {
      result = await dbManager.getAllBadge();
      title = "Infos - Badges";
      description =
        "⚠️ Compétence des badges NON implèmentés\n\n**Liste de tous les badges de Valoria :**";
      category = "Badges";
    } else {
      interaction.reply("Choix invalide");
      return;
    }

    const embeds = [];
    let currentEmbed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color.pink)
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(description);

    result.forEach((item, index) => {
      const description = `*${item.lore}*\n__~~**----------------------------------**~~__`;
      currentEmbed.addFields({
        name: `${
          category === "Matériaux" || category === "Badges"
            ? emoji(emo[item.nom]) + " " + item.nom
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
          .setColor(color.pink)
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
      }
    });

    embeds.push(currentEmbed);

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
    let currentPage = 0;
    const message = await interaction.reply({
      embeds: [embeds[currentPage]],
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
        currentPage = (currentPage + 1) % embeds.length;
        await i.update({
          embeds: [embeds[currentPage]],
          components: [row],
        });
      } else if (i.customId === "previous") {
        currentPage = (currentPage - 1 + embeds.length) % embeds.length;
        await i.update({
          embeds: [embeds[currentPage]],
          components: [row],
        });
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
          content: `Claimed! reçu ${power} power et un matériel légendaire ${emoji(
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

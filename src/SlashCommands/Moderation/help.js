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
const commands = require("../../devs/command");

const commandNames = Object.keys(commands).map(
  (key) => "`[" + commands[key].name + "]`, "
);
const commandNamesString = commandNames.join("");

module.exports = {
  name: "help",
  description: "help command",
  options: null,
  run: async (client, interaction, args) => {
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const pages = [
      new EmbedBuilder()
        .setTitle("Help - Commande Basique")
        .setColor(color.pink)
        .setDescription("Commande Basique du bot")
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "Social",
            value: "**/social**, **/mariage**, **/divorce**, **/profil**",
          },
          {
            name: "Divertissement",
            value: "**/Divertissement** " + commandNamesString,
          }
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),
      new EmbedBuilder()
        .setTitle("Help - Duels")
        .setColor(color.pink)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          "Explication et commande concernant les duels\n\nAutrefois, Valoria était unifiée sous le règne d'un puissant Empereur, un alchimiste de renom ayant découvert l'Essence de l'Océan, une substance mystique dotée de propriétés inimaginables. Cependant, la mort de l'Empereur a plongé le royaume dans le chaos, et les Seigneurs de guerre se sont emparés des terres, déchirant le royaume en plusieurs régions. Les duels sont un moyen pour les habitants de Valoria de régler leurs différends, et de gagner en puissance et en gloire."
        )
        .addFields({
          name: "Commande de Duel",
          value:
            "**/duel @user** pour défier un guerrier\n**/setmateriaux** pour choisir les matériaux à utiliser\n**/upgrade** pour améliorer vos matériaux\n**/sell** Pour vendre vos materiaux\n**/classement** pour voir le classement des joueurs",
        })
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),

      new EmbedBuilder()
        .setTitle("Help - Campagne solo 🚧🚧🚧")
        .setColor(color.pink)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          "Dans le monde de Valoria, un royaume mystérieux et magique, les joueurs se retrouvent plongés dans un univers où les duels, et la quête de pouvoir s'entremêlent. Les contrées de Valoria sont divisées en plusieurs régions, chacune gouvernée par un Roi ou une Reine. La technologie et la magie coexistent, et des guildes secrètes ainsi que des créatures fantastiques influencent la destinée des habitants, dans la campagne vous être uen de ces guildes et vous devez accomplir des missions pour gagner en puissance et en gloire."
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),
      new EmbedBuilder()
        .setTitle("Help - Royaume 🚧🚧🚧")
        .setColor(color.pink)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          "Aucun Royaume n'a encore été créé, revenez plus tard pour plus d'information."
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
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
          content: `Claimed! reçut ${power} power et un matériel légendaire ${emoji(
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

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
const config = require("../../jsons/config.json");

const commandNames = Object.keys(commands).map(
  (key) => "`[" + commands[key].name + "]`, "
);
const commandNamesString = commandNames.join("");

module.exports = {
  name: "help",
  description: "help command",
  options: null,
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
    const colors = await dbManager.getColor(interaction.user.id);
    const pages = [
      new EmbedBuilder()
        .setTitle("Help - Commande Basique")
        .setColor(colors)
        .setDescription("Commande Basique du bot")
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: "🌐 Social",
            value: [
              "**/mariage** - Mariez-vous avec un autre utilisateur",
              "**/divorce** - Divorcez de votre partenaire",
              "**/infos social** - Gérez vos interactions sociales",
              "**/infos profil** - Affichez votre profil utilisateur",
              "**/infos bot** - informations sur le bot (MAJ, prévision ...)",
            ].join("\n"),
          },
          {
            name: "🎉 Divertissement",
            value: [
              "**/Divertissement** - " +
                commandNamesString +
                "\n- *Amusez-vous avec diverses commandes*",
            ].join("\n"),
          }
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),
      new EmbedBuilder()
        .setTitle("Help - Valoria")
        .setColor(color)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription("Explication et commande concernant le lore de valoria")
        .addFields({
          name: "⚔️ Commande de Duel",
          value: [
            "**/duel @user** - Défiez un guerrier",
            "**/materiaux setmateriaux** - Choisissez les matériaux à utiliser",
            "**/freedaylibox** - Réclamez votre free daily box",
            "**/materiaux upgrade** - Améliorez vos matériaux",
            "**/materiaux sell** - Vendez vos matériaux",
            "**/infos classement** - Consultez le classement des joueurs",
            "**/infos generales [ ]** - Consultez les informations sur les matériaux, roles, badges, etc.",
            "**/infos lore** - Consultez les informations sur le lore de Valoria",
          ].join("\n"),
        })
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),

      new EmbedBuilder()
        .setTitle("Help - Campagne solo 🚧🚧🚧")
        .setColor(colors)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          "Aucune campagne solo n'a encore été créée, revenez plus tard pour plus d'information."
        )
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        }),
      new EmbedBuilder()
        .setTitle("Help - Guildes ")
        .setColor(colors)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription("")
        .addFields({
          name: "⚔️ Commande de Guildes",
          value: [
            "***Joueurs***",
            "**/createguild** - Créer une guilde",
            "**/deleteguild** - Créer une guilde",
            "**/guild info** - Obtenir les infos d'une guilde",
            "**/guild join** - Rejoindre une guilde",
            "**/guild leave** - Quitter sa guilde actuelle",
            "**/guild give** - Donner des fragments à sa guilde",
            "**/guild update [Nom, Description, Bannière, StatutInvit]** - Mettre à jour les informations de la guilde",
            "***Admin de guild***",
            "**/gestionguild upgrade** - Améliorer la guilde (level)",
            "**/gestionguild membre kick ** - Exclure un membre de la guilde ",
            "**/gestionguild membre promote** - Promouvoir un membre de la guilde",
            "**/gestionguild membre demote** - Rétrograder un membre de la guilde",
            "**/gestionguild membre setmarchand** - Promouvoir un membre au rôle de marchand",
            "**/gestionguild membre invite** - Inviter un joueur dans la guilde",
            "**/gestionguild membre accept** - Accepter une invitation dans la guilde",
            "***Marchand***",
            "**/marchand** - Ouvrir la boutique de la guilde",
            "***Chevalier***",
            "**/chevalier** - ",
            "***Nobles***",
            "**/nobles** - ",
          ].join("\n"),
        })
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
      .setColor(colors)
      .setDescription(
        "Ho t'a trouvé la page secrète ! claim ton cadeau 🧧 c'est une chance sur 1000 de tomber sur cette page, et te permet de claim entre 5000 et 15000 fragments !\nAinsi que d'obtenir un matériau legendaire parmis la liste suivante !"
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
          content: `Claimed! reçut ${power} Fragments et un matériel légendaire ${emoji(
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

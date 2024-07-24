const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const param = require(`../../jsons/param.json`);
const Player = require("../../class/player");
const DatabaseManager = require("../../class/dbManager");
const { getMaterialsById } = require("../../class/sqlQueriesPlayer");
const dbManager = new DatabaseManager();
const player = new Player();
const config = require("../../jsons/config.json");

module.exports = {
  name: "sell",
  description: "Vendre un objet dans la boutique",
  options: null,
  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    const userMaterials = await dbManager.getMateriauByUserId(
      interaction.user.id
    );
    const colors = await dbManager.getColor(interaction.user.id);
    if (userMaterials.length === 0) {
      const noMaterialsEmbed = new EmbedBuilder()
        .setTitle("Boutique - Vente")
        .setColor(color.error)
        .setDescription("Vous ne possédez aucun matériau à vendre.")
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      return interaction.reply({ embeds: [noMaterialsEmbed] });
    }
    const embed = new EmbedBuilder()
      .setTitle("Boutique - Vente")
      .setColor(colors)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription("Choisissez un objet à vendre:")
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("sell_select")
        .setPlaceholder("Choisissez un objet à vendre")
        .addOptions(
          ...userMaterials.map((material) => ({
            emoji: emo[material.nom] || `❔`,
            label: `${material.nom} => lvl: ${material.lvl}`,
            description: `Prix: ${Math.floor(
              param.boutique.vente.prix.materiaux[material.rarete] *
                material.lvl *
                0.6
            )}`,
            value: `${material.mid}_${material.IdMateriau}_${material.lvl}`,
          }))
        )
    );

    await interaction.reply({ embeds: [embed], components: [row] });

    const filter = (i) =>
      i.customId === "sell_select" && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      collector.stop(); 

      const [idUnique, idMateriau, level] = i.values[0].split("_");
      const [selectedMaterial] = await dbManager.getDataMateriauById(
        idMateriau
      );

      const confirmationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm")
          .setLabel("Valider")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("Refuser")
          .setStyle(ButtonStyle.Danger)
      );

      await i.update({
        content: `Êtes-vous sûr de vendre **${
          selectedMaterial.nom
        }** pour ${Math.floor(
          param.boutique.vente.prix.materiaux[selectedMaterial.rarete] *
            level *
            0.6
        )} ${emoji(emo.power)} ?`,
        components: [confirmationRow],
        embeds: [],
      });

      const confirmFilter = (btnInt) =>
        btnInt.user.id === interaction.user.id &&
        (btnInt.customId === "confirm" || btnInt.customId === "cancel");

      const confirmationCollector =
        interaction.channel.createMessageComponentCollector({
          confirmFilter,
          time: 30000, 
        });

      confirmationCollector.on("collect", async (btnInt) => {
        confirmationCollector.stop(); 

        if (btnInt.customId === "confirm") {
          const prix = Math.floor(
            param.boutique.vente.prix.materiaux[selectedMaterial.rarete] *
              level *
              0.6
          );
          await dbManager.removeMaterialFromUser(idUnique);
          await dbManager.updatePower(i.user.id, -prix);
          await i.update({
            content: `La vente de **${
              selectedMaterial.nom
            }** a été effectuée avec succès pour ${prix} ${emoji(emo.power)}.`,
            components: [],
            embeds: [],
          });
        } else {
          await btnInt.update({
            content: "Vente annulée.",
            components: [],
            embeds: [],
          });
        }
      });

      confirmationCollector.on("end", async (collected) => {
        if (collected.size === 0) {
          await i.update({
            content: "Temps écoulé, vente annulée.",
            components: [],
            embeds: [],
          });
        }
      });
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: "Temps écoulé, vente annulée.",
          components: [],
          embeds: [],
        });
      }
    });
  },
};

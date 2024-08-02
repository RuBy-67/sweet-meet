const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const param = require(`../../jsons/param.json`);
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const config = require("../../jsons/config.json");

module.exports = {
  name: "divorce",
  description: `Demander le divorce à votre partenaire (coûte ${param.Pricing.divorce.prix} Fragments).`,

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
    const authorId = interaction.user.id;

    // Verify if the author has enough power to get
    const authorStats = await dbManager.getStats(authorId);
    if (authorStats.power < param.Pricing.divorce.prix) {
      return interaction.reply({
        content: `Vous n'avez pas suffisamment de Fragments pour demander un divorce. Vous avez besoin de ${
          param.Pricing.divorce.prix
        } ${emoji(emo.power)}`,
        ephemeral: true,
      });
    }

    // Verify if the author and the target are married
    const authorMarriage = await dbManager.getMarriage(authorId);
    if (authorMarriage.length === 0) {
      return interaction.reply({
        content: `Vous n'êtes pas marié(e).`,
        ephemeral: true,
      });
    }

    dbManager.updatePower(authorId, -param.Pricing.divorce.prix);
    const temps = Math.floor(Date.now() / 1000) + 60;
    const embed = new EmbedBuilder()
      .setTitle(`Demande de divorce de ${interaction.user.username}`)
      .setColor(color.pink)
      .setDescription(
        `Voulez-vous vraiment divorcer ? Vous avez 60 secondes pour répondre.`
      )
      .setFooter({
        text: `demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    const confirmButton = new ButtonBuilder()
      .setCustomId("accepter")
      .setLabel("Accepter")
      .setStyle(ButtonStyle.Success);

    const refuseButton = new ButtonBuilder()
      .setCustomId("refuser")
      .setLabel("Refuser")
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(
      confirmButton,
      refuseButton
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });
    const targetId = authorMarriage[0].userId2;
    const targetId2 = authorMarriage[0].userId;

    const filter = (interaction) =>
      interaction.user.id === authorId || interaction.user.id === targetId;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === "accepter") {
        dbManager.deleteMarriage(authorId, targetId);
        dbManager.updateBadge(targetId, "loveb");
        dbManager.updateBadge(authorId, "loveb");
        dbManager.removeBadgeById(4, targetId);
        dbManager.removeBadgeById(4, authorId);

        await interaction.editReply({
          content: `Félicitations ?, <@${targetId}> et <@${targetId2}> sont maintenant divorcés !`,
          embeds: [],
          components: [],
        });
      } else if (interaction.customId === "refuser") {
        dbManager.updatePower(authorId, param.Pricing.divorce.refus);
        dbManager.updatePowerByBadgeId(
          5,
          param.Pricing.divorce.refus * param.Pricing.divorce.fees
        );
        await interaction.editReply({
          content: `La demande de divorce a été refusée. coût : ${
            param.Pricing.divorce.refus
          }  ${emoji(emo.power)}`,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        dbManager.updatePower(authorId, param.Pricing.divorce.refus);
        interaction.editReply({
          content: `La demande de divorce a expiré. coût : ${
            param.Pricing.divorce.refus
          }  ${emoji(emo.power)}`,
          components: [],
          embeds: [],
        });
      }
    });
  },
};

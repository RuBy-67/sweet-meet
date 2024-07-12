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
const Cooldown = require("../../class/cooldown");
const cooldown = new Cooldown();
const config = require("../../jsons/config.json");

module.exports = {
  name: "mariage",
  cooldown: param.cooldownMariage,
  description: `Demander en mariage un autre utilisateur (coûte ${param.Pricing.marriage.accepter} Fragments).`,
  options: [
    {
      name: "membre",
      description: "L'utilisateur que vous souhaitez épouser.",
      type: 6,
      required: true,
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
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const commandName = "marriage";
    const cooldownDuration = param.cooldownMariage; // en secondes
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration
    );
    if (cooldownInfo) return;

    const target = interaction.options.getMember("membre");
    const targetUser = await client.users.fetch(target.user.id);
    const authorId = interaction.user.id;
    const colors = await dbManager.getColor(authorId);
    const targetId = targetUser.id;

    // Verify if the author has enough power to get married
    const authorStats = await dbManager.getStats(authorId);
    if (authorStats.power < param.Pricing.marriage.accepter) {
      return interaction.reply({
        content: `Vous n'avez pas suffisamment de Fragments pour vous marier. Vous avez besoin de ${
          param.Pricing.marriage.accepter
        }  ${emoji(emo.power)}`,
        ephemeral: true,
      });
    }

    if (authorId === targetId) {
      return interaction.reply({
        content: `Vous ne pouvez pas vous marier avec vous-même.`,
        ephemeral: true,
      });
    }

    // Verify if the author and the target are already married
    const authorMarriage = await dbManager.getMarriage(authorId);
    const targetMarriage = await dbManager.getMarriage(targetId);
    if (authorMarriage.length > 0 || targetMarriage.length > 0) {
      return interaction.reply({
        content: `Vous ne pouvez pas vous marier car l'un des deux utilisateurs est déjà marié.`,
        ephemeral: true,
      });
    }
    dbManager.updatePower(authorId, -param.Pricing.marriage.accepter);
    const temps = Math.floor(Date.now() / 1000) + 60;
    const embed = new EmbedBuilder()
      .setTitle(
        `Demande en mariage de ${interaction.user.username} à ${targetUser.username}`
      )
      .setColor(colors)
      .setDescription(
        `Un mariage coûte ${param.Pricing.marriage.accepter} ${emoji(
          emo.power
        )}. Les avantages et inconvénients du mariage seront partagés entre les deux utilisateurs. Voulez-vous accepter cette demande en mariage ? \n\nFin <t:${temps}:R> `
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
      content: `<@${targetId}> ... <@${authorId}> souhaite t'épouser !`,
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    const filter = (interaction) => interaction.user.id === targetId;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === "accepter") {
        const guild = await dbManager.getGuildByOwnerId(targetId);
        const guild2 = await dbManager.getGuildByOwnerId(authorId);

        const inGuild = await dbManager.getStats(targetId);
        const inGuild2 = await dbManager.getStats(authorId);

        // Vérification si les utilisateurs sont déjà dans une guilde
        if (inGuild2.guildId !== null && guild.id !== inGuild2.guildId) {
          return interaction.editReply({
            content: `Mariage Impossible, l'un est empereur d'une guilde différente de la vôtre.`,
            embeds: [],
            components: [],
          });
        } else if (inGuild.guildId !== null && guild2.id !== inGuild.guildId) {
          return interaction.editReply({
            content: `Mariage Impossible, l'un est empereur d'une guilde différente de la vôtre.`,
            embeds: [],
            components: [],
          });
        }

        // Vérification si les deux utilisateurs sont empereurs de guilde
        if (guild.length > 0 && guild2.length > 0) {
          return interaction.editReply({
            content: `Mariage Impossible, les deux utilisateurs sont tous deux empereurs de guilde.`,
            embeds: [],
            components: [],
          });
        }

        // Mise à jour des guildes et des classes d'utilisateurs
        if (guild.length > 0) {
          await dbManager.addClassToUser(authorId, guild[0].id, 1);
          await dbManager.updateUserGuild(guild[0].id, targetId);
        } else if (guild2.length > 0) {
          await dbManager.addClassToUser(targetId, guild2[0].id, 1);
          await dbManager.updateUserGuild(guild2[0].id, authorId);
        }

        // Mise à jour des informations de mariage et des badges
        await dbManager.setMarriage(authorId, targetId);
        await dbManager.updateBadge(targetId, "love");
        await dbManager.updateBadge(authorId, "love");
        await dbManager.updatePowerByBadgeId(
          5,
          param.Pricing.marriage.accepter * param.Pricing.marriage.fees
        );

        // Réponse finale après mariage
        return interaction.editReply({
          content: `Félicitations, <@${targetId}> et <@${authorId}> sont maintenant mariés !`,
          embeds: [],
          components: [],
        });
      } else if (interaction.customId === "refuser") {
        await dbManager.updatePower(authorId, param.Pricing.marriage.refuse);
        await dbManager.updatePowerByBadgeId(
          5,
          (param.Pricing.marriage.accepter - param.Pricing.marriage.refuse) *
            param.Pricing.marriage.fees
        );
        return interaction.editReply({
          content: `La demande en mariage de <@${authorId}> à <@${targetId}> a été refusée, ${
            param.Pricing.marriage.refuse
          } ${emoji(emo.power)} ont été rendus à <@${authorId}>`,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        dbManager.updatePower(authorId, param.Pricing.marriage.expire);
        dbManager.updatePowerByBadgeId(
          5,
          (param.Pricing.marriage.accepter - param.Pricing.marriage.expire) *
            param.Pricing.marriage.fees
        );
        return interaction.editReply({
          content: `La demande en mariage a expiré car <@${targetId}> n'a pas répondu dans le temps imparti, ${
            param.Pricing.marriage.expire
          } ${emoji(emo.power)} on été rendu à <@${authorId}>.`,
          components: [],
          embeds: [],
        });
      }
    });
  },
};

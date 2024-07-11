const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const dbManager = require("../../class/dbManager");
const db = new dbManager();
const param = require("../../jsons/param.json");
const config = require("../../jsons/config.json");

module.exports = {
  name: "roulette",
  description: "Roulette russe joue et perd !",
  options: [
    {
      name: "paris",
      description: "Combien vaut ta vie ?",
      type: 4,
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
    const commandName = "roulette";
    const cooldownDuration = param.cooldownroulette;
    const cooldownInfo = await cooldown.handleCooldown(
      interaction,
      commandName,
      cooldownDuration
    );
    if (cooldownInfo) return;
    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const userId = interaction.user.id;
    const colors = await db.getColor(userId);
    const bet = interaction.options.getInteger("paris");

    // Initial user stats
    const userPower = await db.getStats(userId);

    if (userPower.power < bet) {
      return interaction.reply({
        content: `Vous n'avez pas assez de ${emoji(
          emo.power
        )} pour parier cette somme.`,
        ephemeral: true,
      });
    }

    // Embed de départ
    const embed = new EmbedBuilder()
      .setTitle("Roulette Russe")
      .setColor(colors)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `Choisissez le nombre de coups à tirer. Chaque coup augmente vos gains potentiels, mais augmente également vos chances de perdre.\n> Paris : ${bet} ${emoji(
          emo.power
        )}\n> Votre solde : ${userPower.power} ${emoji(
          emo.power
        )}\n\n**Attention :** Si vous perdez, vous perdrez 5% de vos fragments de protection (+ le bet effectué) et serez mute pendant 30 minutes.\n\n**Bon courage !**\n\n> **Règles :**\n> - Vous avez 1 chance sur 6 de mourir à chaque coup\n> - Les gains sont multipliés par **1.2**, **1.9**, **3**, **5** ou **10** en fonction du nombre de coups choisis\n> - Si vous survivez, vous gagnez le montant misé multiplié par le multiplicateur\n> - Si vous perdez, vous perdez 5% de vos fragments de protection + le montant misé\n\n**Combien de coups voulez-vous tirer ?**\n\n`
      )
      .setFooter({
        text: `Demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    // Boutons pour les coups
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shot1")
        .setLabel("1 Coup")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("shot2")
        .setLabel("2 Coups")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("shot3")
        .setLabel("3 Coups")
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shot4")
        .setLabel("4 Coups")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("shot5")
        .setLabel("5 Coups")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("shot6")
        .setLabel("6 Coups")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true,
    });

    // Collecteur d'interactions de boutons
    const filter = (i) => i.customId.startsWith("shot") && i.user.id === userId;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      const shots = parseInt(i.customId.replace("shot", ""));
      const chanceOfDeath = 1 / 6;
      let survived = true;

      for (let j = 0; j < shots; j++) {
        if (Math.random() < chanceOfDeath) {
          survived = false;
          break;
        }
      }

      if (survived) {
        const multiplier = [1.2, 1.9, 3, 5, 10][shots - 1];
        const powerGain = Math.floor(bet * multiplier);
        console.log(powerGain);
        await db.updatePower(userId, powerGain);
        const successEmbed = new EmbedBuilder()
          .setTitle("Roulette Russe - Victoire")
          .setColor(color)
          .setDescription(
            `Vous avez survécu à ${shots} coups et gagné ${powerGain} ${emoji(
              emo.power
            )}!`
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        const powerLoss = Math.floor(userPower.power * 0.05) + bet;
        await db.updatePower(userId, -powerLoss);
        const member = await interaction.guild.members.fetch(userId);
        await member.timeout(30 * 60 * 1000, "Perdu à la roulette russe");
        const failEmbed = new EmbedBuilder()
          .setTitle("Roulette Russe - Échec")
          .setColor(color.error)
          .setDescription(
            `Vous avez perdu après ${shots} coups. Vous êtes mute pour 30 minutes et perdez ${powerLoss} ${emoji(
              emo.power
            )}.`
          )
          .setFooter({
            text: `Demandé(e) par ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });

        await i.update({ embeds: [failEmbed], components: [] });
      }
      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "Le temps est écoulé. La roulette russe est annulée.",
          embeds: [],
          components: [],
        });
      }
    });
  },
};

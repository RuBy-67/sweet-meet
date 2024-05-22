const { EmbedBuilder } = require("discord.js");
const emo = require(`../../jsons/emoji.json`);
const color = require(`../../jsons/color.json`);
const { connection } = require("../../db");

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
      console.log(id);
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }
    const target =
      interaction.options.getMember("membre") || interaction.member;
    const targetUser = await client.users.fetch(target.user.id);
    console.log(targetUser);

    const materiauResult = await connection
      .promise()
      .query("SELECT * FROM materiau_user WHERE idUser = ?", [targetUser.id]);

    let materiaux = "Aucun";
    if (materiauResult[0].length > 0) {
      materiaux = materiauResult[0]
        .map((materiau) => `${materiau.lvl}x ${emoji(emo[materiau.nom])}`)
        .join(" | ");
    }

    const badgeResult = await connection
      .promise()
      .query(
        "SELECT badge.emojiId FROM badge_user INNER JOIN badge ON badge_user.idBadge = badge.id WHERE badge_user.idUser = ?",
        [targetUser.id]
      );
    let badges = "Aucun";
    if (badgeResult[0].length > 0) {
      badges = badgeResult[0].map((badge) => emoji(badge.emojiId)).join(" | ");
    }

    const marriageResult = await connection
      .promise()
      .query("SELECT * FROM mariage WHERE userId = ? OR userId2 = ?", [
        targetUser.id,
        targetUser.id,
      ]);

    let marriageStatus;
    if (marriageResult[0].length === 0) {
      marriageStatus = "Célibataire";
    } else {
      let spouse;
      if (marriageResult[0][0].userId2 === targetUser.id) {
        spouse = await interaction.guild.members.fetch(
          marriageResult[0][0].userId
        );
      } else {
        spouse = await interaction.guild.members.fetch(
          marriageResult[0][0].userId2
        );
      }

      const mariage = marriageResult[0][0].date;
      const mariageTimestamp = Math.floor(mariage.getTime() / 1000);
      marriageStatus = `Marié(e) avec <@${spouse.user.id}> \n Depuis le: <t:${mariageTimestamp}:D>`;
    }

    const statsResult = await connection
      .promise()
      .query("SELECT * FROM user WHERE discordId = ?", [targetUser.id]);
    const win = statsResult[0][0].winCounter;
    const lose = statsResult[0][0].loseCounter;
    const power = statsResult[0][0].power;
    const rate = win / (win + lose) || 0;

    const embed = new EmbedBuilder()
      .setTitle(`Profil de ${targetUser.username}`)
      .setColor(color.pink)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "Marié(e)",
          value: marriageStatus,
          inline: true,
        },
        { name: "Puissance", value: `${power}`, inline: true },
        { name: "Badges", value: badges, inline: false },
        { name: "Matériaux", value: materiaux, inline: false },
        { name: "Win", value: `${win}`, inline: true },
        { name: "Lose", value: `${lose}`, inline: true },
        { name: "Rate", value: `${(rate * 100).toFixed(2)}%`, inline: true }
      )
      .setFooter({
        text: `demandé(e) par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    return interaction.reply({ embeds: [embed] });
  },
};

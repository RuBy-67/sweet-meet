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

    // Récupérer les matériaux de l'utilisateur
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

    // Récupérer les informations de mariage de l'utilisateur
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
      const spouse = await interaction.guild.members.fetch(
        marriageResult[0][0].userId2
      );
      marriageStatus = `Marié(e) avec ${
        spouse.user.username
      } depuis le ${mariage.date.substring(0, 10)} `;
    }

    // Récupérer info de l'utilisateur
    const statsResult = await connection
      .promise()
      .query("SELECT * FROM user WHERE discordId = ?", [targetUser.id]);
    const win = statsResult[0][0].winCounter;
    const lose = statsResult[0][0].loseCounter;
    const power = statsResult[0][0].power;
    console.log(statsResult);
    console.log(win);
    console.log(lose);
    console.log(power);
    // Calculer le taux de réussite de l'utilisateur
    const rate = win / (win + lose) || 0;

    // Générer l'embed du profil de l'utilisateur
    const embed = new EmbedBuilder()
      .setTitle(`Profil de ${targetUser.username}`)
      .setColor(color.pink)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Marié", value: marriageStatus, inline: true },
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

    // Envoyer l'embed du profil de l'utilisateur
    return interaction.reply({ embeds: [embed] });
  },
};

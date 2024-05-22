/// Take new users and create an account for them in the database and send a welcome message in the welcome room
const { EmbedBuilder } = require("discord.js");
const { welcome } = require("../../jsons/config.json");
const { connection, connectionBo } = require("../../db");
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "guildMemberAdd",
  execute: async (member) => {
    //Welcome message-
    const embed = new EmbedBuilder()
      .setTitle("Bienvenue sur notre serveur !")
      .setColor(color.pink)
      .setDescription(`Nous sommes ravis de t'accueillir, <@${member.id}> !`)
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });
    const welcomeChannel = member.guild.channels.cache.find(
      (channel) => channel.id === welcome
    );

    const result = await connection
      .promise()
      .query("SELECT * FROM user WHERE discordId = ?", [member.id]);
    if (result[0].length > 0) {
      console.log(
        `Le compte pour l'utilisateur ${member.id} existe déjà dans la base de données principale.`
      );

      if (welcomeChannel) {
        welcomeChannel.send({ embeds: [embed] });
      } else {
        console.log(`No Welcome Room Find`);
      }
      return;
    }

    const resultBo = await connectionBo
      .promise()
      .query("SELECT * FROM backup_user WHERE discordId = ?", [member.id]);
    if (resultBo[0].length > 0) {
      const userData = resultBo[0][0];
      const materiauData = await connectionBo
        .promise()
        .query("SELECT * FROM backup_materiau_user WHERE idUser = ?", [
          userData.discordId,
        ]);
      const badgeData = await connectionBo
        .promise()
        .query("SELECT * FROM backup_badge_user WHERE idUser = ?", [
          userData.discordId,
        ]);

      await connection
        .promise()
        .query(
          "INSERT INTO user (discordId, power, winCounter, loseCounter) VALUES (?, ?, ?, ?)",
          [
            userData.discordId,
            userData.power,
            userData.winCounter,
            userData.loseCounter,
          ]
        );

      if (materiauData[0].length > 0) {
        materiauData[0].forEach(async (materiau) => {
          await connection
            .promise()
            .query(
              "INSERT INTO materiau_user (idUser, idMateriau, lvl) VALUES (?, ?, ?)",
              [userData.discordId, materiau.idMateriau, materiau.lvl]
            );
          console.log(`Matière réimportée pour l'utilisateur ${member.id}`);
        });
      } else {
        console.log(
          `Aucune matière à réimporter pour l'utilisateur ${member.id}`
        );
      }

      if (badgeData[0].length > 0) {
        badgeData[0].forEach(async (badge) => {
          await connection
            .promise()
            .query("INSERT INTO badge_user (idUser, idBadge) VALUES (?, ?)", [
              userData.discordId,
              badge.idBadge,
            ]);
          console.log(`Badge réimporté pour l'utilisateur ${member.id}`);
        });
      } else {
        console.log(`Aucun badge à réimporter pour l'utilisateur ${member.id}`);
      }

      await connectionBo
        .promise()
        .query("DELETE FROM backup_user WHERE discordId = ?", [member.id]);
      await connectionBo
        .promise()
        .query("DELETE FROM backup_materiau_user WHERE idUser = ?", [
          userData.discordId,
        ]);
      await connectionBo
        .promise()
        .query("DELETE FROM backup_badge_user WHERE idUser = ?", [
          userData.discordId,
        ]);
    } else {
      await connection
        .promise()
        .query("INSERT INTO user (discordId) VALUES (?)", [member.id]);
    }
    if (welcomeChannel) {
      welcomeChannel.send({ embeds: [embed] });
    } else {
      console.log(`No Welcome Room Find`);
    }
  },
};

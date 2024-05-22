const { EmbedBuilder } = require("discord.js");
const { welcome } = require("../../jsons/config.json");
const { connection, connectionBo } = require("../../db");
const color = require(`../../jsons/color.json`);

module.exports = {
  name: "guildMemberRemove",
  execute: async (member) => {
    // bye message
    const embed = new EmbedBuilder()
      .setTitle("Au revoir !")
      .setColor(color.pink)
      .setDescription(
        `Nous sommes tristes de te voir partir, <@${member.id}> !`
      )
      .setFooter({
        text: `Nombre de membres : ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      });

    const welcomeChannel = member.guild.channels.cache.find(
      (channel) => channel.id === welcome
    );
    const currentDate = new Date()
      .toISOString()
      .substring(0, 10)
      .replace(/-/g, "");

    try {
      // take data from main database
      const result = await connection
        .promise()
        .query("SELECT * FROM user WHERE discordId = ?", [member.id]);

      if (result[0].length === 0) {
        console.log(
          `Le compte pour l'utilisateur ${member.id} n'existe pas dans la base de données principale.`
        );
        if (welcomeChannel) {
          welcomeChannel.send({ embeds: [embed] });
        } else {
          console.log(`Le salon de bienvenue spécifié n'existe pas.`);
        }
        return;
      }

      const userData = result[0][0];

      // save data in backup database
      await connectionBo
        .promise()
        .query(
          "INSERT INTO backup_user (discordId, power, winCounter, loseCounter, date) VALUES (?, ?, ?, ?,?)",
          [
            userData.discordId,
            userData.power,
            userData.winCounter,
            userData.loseCounter,
            currentDate,
          ]
        );

      const materiauData = await connection
        .promise()
        .query("SELECT * FROM materiau_user WHERE idUser = ?", [
          userData.discordId,
        ]);

      for (const materiau of materiauData[0]) {
        await connectionBo
          .promise()
          .query(
            "INSERT INTO backup_materiau_user (idUser, idMateriau, lvl, date) VALUES (?, ?, ?, ?)",
            [materiau.IdUser, materiau.IdMateriau, materiau.lvl, currentDate]
          );
      }

      const badgeData = await connection
        .promise()
        .query("SELECT * FROM badge_user WHERE idUser = ?", [
          userData.discordId,
        ]);

      for (const badge of badgeData[0]) {
        await connectionBo
          .promise()
          .query(
            "INSERT INTO backup_badge_user (idUser, idBadge, date) VALUES (?, ?, ?)",
            [badge.IdUser, badge.idBadge, currentDate]
          );
      }

      // delete data from main database
      await connection
        .promise()
        .query("DELETE FROM user WHERE discordId = ?", [userData.discordId]);

      await connection
        .promise()
        .query("DELETE FROM mariage WHERE userId = ? OR userId2 = ?", [
          userData.discordId,
          userData.discordId,
        ]);

      await connection
        .promise()
        .query("DELETE FROM materiau_user WHERE idUser = ?", [
          userData.discordId,
        ]);

      await connection
        .promise()
        .query("DELETE FROM badge_user WHERE idUser = ?", [userData.discordId]);

      console.log(`Profil supprimé pour l'utilisateur ${member.id}`);

      if (welcomeChannel) {
        welcomeChannel.send({ embeds: [embed] });
      } else {
        console.log(`Le salon de bienvenue spécifié n'existe pas.`);
      }
    } catch (err) {
      console.error(err);
    }
  },
};

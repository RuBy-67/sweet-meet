const SQL_QUERIES = {
  GET_MATERIAU_BY_USER_ID: `
    SELECT mu.id AS mid, mu.*, m.*
    FROM materiau_user mu 
    JOIN materiau m ON mu.idMateriau = m.id 
    WHERE mu.idUser = ?`,
  GET_MATERIAU: `
    SELECT * FROM materiau
    ORDER BY 
      CASE 
        WHEN rarete = 'Legendaire' THEN 1
        WHEN rarete = 'Épique' THEN 2
        WHEN rarete = 'Très Rare' THEN 3
        WHEN rarete = 'Rare' THEN 4
        WHEN rarete = 'Commun' THEN 5
        ELSE 5
      END ASC`,
  DELETE_MATERIAU_USER: `DELETE FROM materiau_user WHERE id = ?`,
  GET_BADGE: `
    SELECT badge.emojiId 
    FROM badge_user 
    INNER JOIN badge ON badge_user.idBadge = badge.id 
    WHERE badge_user.idUser = ?`,
  GET_BADGE_NO_L: "SELECT * FROM badge WHERE rarete != 'Legendaire'",
  GET_BADGE_BY_ID: `SELECT * FROM badge_user WHERE idBadge = ?`,
  GET_MARRIAGE: `
    SELECT * FROM mariage 
    WHERE userId = ? OR userId2 = ?`,
  GET_STATS: `
    SELECT * FROM user 
    WHERE discordId = ?`,
  GET_TOP_USERS: `
    SELECT * FROM user 
    ORDER BY ?? DESC 
    LIMIT ?`,
  GET_TOP_USERS_BY_RATE: `
    SELECT *, winCounter / (winCounter + loseCounter) as rate 
    FROM user 
    WHERE winCounter + loseCounter > 0 
    ORDER BY rate DESC 
    LIMIT ?`,
  SET_MARRIAGE: `
    INSERT INTO mariage (userId, userId2, date) 
    VALUES (?, ?, NOW())`,
  UPDATE_POWER: `
    UPDATE user 
    SET power = power + ? 
    WHERE discordId = ?`,
  GET_BADGE_ID_BY_NAME: `
    SELECT id 
    FROM badge 
    WHERE nom = ?`,
  INSERT_BADGE_USER: `
    INSERT INTO badge_user (idUser, idBadge) 
    VALUES (?, ?)`,
  DELETE_BADGE_USER: `DELETE FROM badge_user WHERE idBadge = ?`,
  GET_USERS_BY_BADGE_ID: `
    SELECT idUser 
    FROM badge_user 
    WHERE idBadge = ?`,
  UPDATE_USER_POWER: `
    UPDATE user 
    SET power = ? 
    WHERE discordId = ?`,
  GENERATE_RANDOM_POWER: `
    SELECT * 
    FROM materiau 
    WHERE rarete = ?`,
  ADD_MATERIAL_TO_USER: `
    INSERT INTO materiau_user (idUser, idMateriau, lvl) 
    VALUES (?, ?, ?)`,
  GET_ROLE_BY_ID: `SELECT * FROM role WHERE id = ?`,
  GET_ROLE_BY_USER_ID_ROLE_ID: `SELECT * FROM role_user WHERE idRole = ? AND idUser = ?`,
  ADD_ROLE_TO_USER: `INSERT INTO role_user (idUser, idRole) VALUES (?, ?)`,
  GET_ROLE_BY_USER_ID: `SELECT role_user.*, role.*
FROM role_user
INNER JOIN role ON role_user.IdRole = role.id
WHERE role_user.idUser = ?`,
  UPDATE_MATERIAL_STATE: `UPDATE materiau_user SET etat= ? WHERE id = ? AND idUser = ?`,
  GET_ALL_POWER: "SELECT SUM(power) as power FROM user",
  COUNT_DUEL: "SELECT COUNT(*) AS count FROM duel",
  DELETE_MARIAGE: `DELETE FROM mariage WHERE userId = ? OR userId2 = ?`,
  GET_TOTAL_MATERIAU_BY_RARITY: `SELECT 
  SUM(CASE WHEN m.rarete = 'Legendaire' THEN 1 ELSE 0 END) AS legendary,
  SUM(CASE WHEN m.rarete = 'Épique' THEN 1 ELSE 0 END) AS epic,
  SUM(CASE WHEN m.rarete = 'Rare' THEN 1 ELSE 0 END) AS rare,
  SUM(CASE WHEN m.rarete = 'Commun' THEN 1 ELSE 0 END) AS common,
  SUM(CASE WHEN m.rarete = 'Très Rare' THEN 1 ELSE 0 END) AS veryRare
FROM materiau_user mu
JOIN materiau m ON mu.IdMateriau = m.id`,
  GET_AVERAGE_POWER: `SELECT AVG(power) AS avgPower FROM user`,
  GET_ALL_PLAYER: `SELECT COUNT(*) as count FROM user`,
  UPDATE_MATERIAL_LEVEL: `UPDATE materiau_user SET lvl = ? WHERE id = ? AND idUser = ?`,
  GET_MATERIAL_BY_ID: ` SELECT mu.id AS mid, mu.*, m.*
    FROM materiau_user mu 
    JOIN materiau m ON mu.IdMateriau = m.id 
    WHERE mu.id = ?`,
  GET_USER_DATA_BO: `SELECT * FROM backup_user  WHERE discordId = ?`,
  GET_USER_DATA: `SELECT * FROM user  WHERE discordId = ?`,
  INSERT_USER_DATA: `INSERT INTO user (discordId, power, winCounter, loseCounter) VALUES (?, ?, ?, ?)`,
  GET_MATERIAU_DATA: `SELECT * FROM backup_materiau_user WHERE idUser = ?`,
  INSERT_MATERIAU_DATA: `INSERT INTO materiau_user (idUser, idMateriau, lvl) VALUES (?, ?, ?)`,
  GET_BADGE_DATA: `SELECT * FROM backup_badge_user WHERE idUser = ?`,
  INSERT_BADGE_DATA: `INSERT INTO badge_user (idUser, idBadge) VALUES (?, ?)`,
  DELETE_BACKUP_USER: `DELETE FROM backup_user WHERE discordId = ?`,
  DELETE_BACKUP_MAT: `DELETE FROM backup_materiau_user WHERE idUser = ?`,
  DELETE_BACKUP_BADGE: `DELETE FROM backup_badge_user WHERE idUser = ?`,
  GET_ALL_BADGE: `SELECT * FROM badge`,
  GET_DATA_MATERIAL_BY_ID: `SELECT * FROM materiau WHERE id = ?`,
  INSERT_BACKUP_USER: `INSERT INTO backup_user (discordId, power, winCounter, loseCounter, date) VALUES (?, ?, ?, ?, NOW())`,
  SELECT_MATERIAU_USER: `SELECT * FROM materiau_user WHERE idUser = ?`,
  INSERT_BACKUP_MATERIAU_USER: `INSERT INTO backup_materiau_user (idUser, idMateriau, lvl, date) VALUES (?, ?, ?, NOW())`,
  SELECT_BADGE_USER: `SELECT * FROM badge_user WHERE idUser = ?`,
  INSERT_BACKUP_BADGE_USER: `INSERT INTO backup_badge_user (idUser, idBadge, date) VALUES (?, ?, NOW())`,
  DELETE_USER: `DELETE FROM user WHERE discordId = ?`,
  GET_ROLES: `SELECT * FROM role ORDER BY role.idRole ASC`,
  GET_RANDOM_MATERIAL: `SELECT * FROM materiau ORDER BY RAND() LIMIT 3`,
  GET_DUEL_DETAILS: `SELECT dd.id, dd.idDuel, dd.idUser, dd.idMateriau1, m1.nom AS nomMateriau1, m1.type AS typeMateriau1, dd.idMateriau2, m2.nom AS nomMateriau2, m2.type AS typeMateriau2, dd.idMateriau3, m3.nom AS nomMateriau3, m3.type AS typeMateriau3, dd.idMateriau4, m4.nom AS nomMateriau4, m4.type AS typeMateriau4, dd.win,u1.power AS powerUser1 FROM  dueldetails dd LEFT JOIN  materiau m1 ON dd.idMateriau1 = m1.id LEFT JOIN  materiau m2 ON dd.idMateriau2 = m2.id LEFT JOIN materiau m3 ON dd.idMateriau3 = m3.id LEFT JOIN  materiau m4 ON dd.idMateriau4 = m4.id LEFT JOIN  user u1 ON dd.idUser = u1.discordId WHERE dd.idDuel = ? AND dd.idUser = ?`,
  INSERT_CODE_SECRET: `INSERT INTO user_code (discordId, code, date) VALUES (?, ?, ?)`,
  DELETE_CODE_SECRET: `DELETE FROM user_code WHERE discordId = ?`,
  GET_COLOR: `SELECT g.bannière 
FROM user u
JOIN guild g ON u.guildId = g.id
WHERE u.discordId = ?`,
  CREATE_GUILD: `INSERT INTO guild (nom,description,tag, bannière, empreur, xp, level, banque) VALUES (?, ?, ?, ?,?, 10, 1,40000)`,
  GET_GUILD: `SELECT * FROM guild`,
  GET_GUILD_BY_ID: `SELECT * FROM guild WHERE id = ?`,
  GET_GUILD_BY_OWNER_ID: `SELECT * FROM guild WHERE empreur = ?`,
  DELETE_GUILD_BY_OWNER_ID: `DELETE FROM guild WHERE empreur = ?`,
  REMOVE_GUILD_ID_FROM_USER: `UPDATE user SET guildId = NULL WHERE guildId = ?`,
  GET_GUILD_MEMBERS: `SELECT * FROM user WHERE guildId = ?`,
  GET_GUILD_INFO: "SELECT * FROM guild WHERE id = ?",
  GET_GUILD_TYPE: "SELECT statutInvit FROM guild WHERE id = ?",
  INSERT_INVITATION:
    "INSERT INTO invitation (guildId, userId, type) VALUES (?, ?, ?)",
  LEAVE_GUILD: "UPDATE user SET guildId = NULL WHERE discordId = ?",
  DELETE_CLASS_USER: "DELETE FROM class_user WHERE idUser = ?",
  GET_USER_GUILD: "SELECT guildId FROM user WHERE discordId = ?",
  DELETE_INVITATION:
    "DELETE FROM invitation WHERE guildId = ? AND userId = ? AND type = 1",
  UPDATE_USER_GUILD: "UPDATE user SET guildId = ? WHERE discordId = ?",
  CHECK_INVITATIONS:
    "SELECT guildId FROM invitation WHERE userId = ? AND type = 2",
  CHECK_INVITATIONS_BY_GUILD:
    "SELECT guildId FROM invitation WHERE userId = ? AND guildId=? AND type = ?",
  GET_GUILD_INVITATION:
    "SELECT userId FROM invitation WHERE guildId = ? AND type = 1",
  GET_USER_CLASS:
    "SELECT idClasse FROM class_user WHERE idUser = ? AND idGuild = ?",
  GET_GUILD_BY_NAME: "SELECT * FROM guild WHERE tag = ? or nom = ?",
  GET_GUILD_USER_BY_ROLE:
    "SELECT idUser FROM class_user WHERE idGuild = ? AND idClasse = ?",
  ADD_CLASS_TO_USER:
    "INSERT INTO class_user (idUser, idGuild, idClasse) VALUES (?, ?, ?)",
  UPDATE_CLASS_TO_USER: `UPDATE class_user SET idClasse = ? WHERE idUser = ? AND idGuild = ?`,
  GET_GUILD_BY_TAG: "SELECT * FROM guild WHERE tag = ?",
  ADD_GUILD_BANK: `UPDATE guild SET banque = banque + ? WHERE id = ?`,
  UPDATE_GUILD_LEVEL: `UPDATE guild SET level = ? WHERE id = ?`,
  UPDATE_GUILD_NAME_AND_TAG: `UPDATE guild SET nom = ?, tag = ? WHERE id = ?`,
  UPDATE_GUILD_DESCRIPTION: `UPDATE guild SET description = ? WHERE id = ?`,
  UPDATE_GUILD_BANNER: `UPDATE guild SET bannière = ? WHERE id = ?`,
  UPDATE_GUILD_INVITATION_STATUS: `UPDATE guild SET statutInvit = ? WHERE id = ?`,
  ADD_MEMBER_POWER: `UPDATE user SET power = power + ? WHERE discordId = ?`,
  UPDATE_GUILD_XP: `UPDATE guild SET xp = xp + ? WHERE id = ?`,
  GET_CLASS_NAME: `SELECT Nom FROM guild_classe WHERE idClass = ?`,
  GET_MATERIAU_BY_ID: `SELECT * FROM materiau WHERE id = ?`,
  REMOVE_INVITATION: `DELETE FROM invitation WHERE userId = ? `,
  UPDATE_GUILD_MARCHAND: `UPDATE guild SET marchand = ? WHERE id = ?`,
  INSERT_POTION_DATA: `INSERT INTO potion_user (idUser, potionName, attaqueBoost, defenseBoost, santeBoost,type, powerBoost, duration, etat) VALUES (?,?,?,?,?,?,?,?,0)`,
  GET_POTION_DATA: `SELECT * FROM potion_user WHERE idUser = ?`,
  GET_POTION_DATA_BY_ID: `SELECT * FROM potion_user WHERE idPotion = ?`,
  UPDATE_POTION_ETAT: `UPDATE potion_user SET etat = ? WHERE idPotion = ?`,
  DELETE_POTION: `DELETE FROM potion_user WHERE idPotion = ?`,
  UPDATE_POTION_OWNER: `UPDATE potion_user SET idUser = ? WHERE idPotion = ?`,
  UPDATE_MATERIAUX_OWNER: `UPDATE materiau_user SET idUser = ? WHERE id = ?`,
  UPDATE_POTION_ETAT: `UPDATE potion_user SET etat = ?, powerBoost=0 WHERE idPotion = ?`,
  DELETE_POTION: `DELETE FROM potion_user WHERE idPotion = ?`,
  GET_POTION_DATA_BY_ETAT: `SELECT * FROM potion_user WHERE idUser = ? AND etat = 0`,
  GET_MID_MATERIAUX_BY_ID_LVL5: `SELECT * FROM materiau_user WHERE IdMateriau = ? AND lvl = 5 AND idUser = ?`,
  DELETE_CLASS_BY_GUILD_ID: `DELETE FROM class_user WHERE idGuild = ?`,
};

module.exports = SQL_QUERIES;

const SQL_QUERIES = {
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
  UPDATE_FRAGMENT: `
    UPDATE user 
    SET fragment = fragment + ? 
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
  SELECT_MATERIAUX_BY_RARITY: `
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
  UPDATE_MATERIAL_STATE: `UPDATE materiau_user SET etat= ? WHERE id = ? AND discordId = ?`,
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
  GET_ALL_PLAYER: `SELECT COUNT(*) as count FROM user`,
  GET_ALL_USER_IDS: `SELECT discordId FROM user`,
  UPDATE_MATERIAL_LEVEL: `UPDATE materiau_user SET level = level + 1  WHERE id = ? AND discordId = ?;`,
  GET_MATERIAL_BY_ID: ` SELECT mu.id AS mid, mu.*, m.*
    FROM materiau_user mu 
    JOIN materiau m ON mu.materiauId = m.id 
    WHERE mu.discordId = ?`,
  ADD_USER: `INSERT INTO user (discordId, civilisation) VALUES (?,?)`,
  GET_ALL_BADGE: `SELECT * FROM badge`,
  GET_DATA_MATERIAL_BY_ID: `SELECT * FROM materiau WHERE id = ?`,
  GET_FORGE_LVL: `SELECT lvl FROM forge WHERE discordId = ?`,
  GET_CASERNE_LVL: `SELECT * FROM caserne WHERE discordId = ?`,
  GET_HOSPITAL_LVL: `SELECT lvl FROM hospital WHERE discordId = ?`,
  GET_FORGE_INFO: `SELECT * FROM batiment WHERE nom = 'forge'`,
  GET_TROOP_TYPE: `SELECT * FROM batiment WHERE nom = ?`,
  UPDATE_FORGE_LVL: `UPDATE forge SET lvl = lvl + 1 WHERE discordId = ?`,
  UPDATE_CASERNE_LVL: `UPDATE caserne SET lvl = lvl + 1 WHERE discordId = ?`,
  UPDATE_HOSPITAL_LVL: `UPDATE hospital SET lvl = lvl + 1 WHERE discordId = ?`,
  SELECT_MATERIAU_USER: `SELECT * FROM materiau_user WHERE idUser = ?`,
  SELECT_BADGE_USER: `SELECT * FROM badge_user WHERE idUser = ?`,
  DELETE_USER: `DELETE FROM user WHERE discordId = ?`,
  GET_ID_MATERIAL_BY_ID_UNIQUE: `SELECT * FROM materiau_user WHERE id = ?`,
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
  ADD_MEMBER_FRAGMENT: `UPDATE user SET fragment = fragment + ? WHERE discordId = ?`,
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
  GET_DETAILS_BATIMENT:
    "SELECT  h.lvl AS hospitalLevel, f.lvl AS forgeLevel, c.lvl AS caserneLevel FROM  hospital h LEFT JOIN forge f ON h.discordId = f.discordId LEFT JOIN  caserne c ON h.discordId = c.discordId WHERE h.discordId = ?",
  GET_DETAILS_TROOPS: "SELECT * FROM troops WHERE discordId = ?",
  GET_DETAILS_BOSS: "SELECT * FROM user_boss WHERE discordId = ?",
  GET_ALL_CIVILISATION: `SELECT * FROM civilisation`,
  GET_CIVILISATION_BY_NAME: `SELECT * FROM civilisation WHERE nom = ?`,
  ADD_USER_HOSPITAL: `INSERT INTO hospital (discordId, lvl) VALUES (?, 1)`,
  ADD_USER_CASERNE: `INSERT INTO caserne (discordId, lvl) VALUES (?, 1)`,
  ADD_USER_FORGE: `INSERT INTO forge (discordId, lvl) VALUES (?, 1)`,
  GET_BOSS_INFO: `SELECT * FROM bosses WHERE id = ?`,
  ADD_BOSS_ID: `INSERT INTO user_boss (discordId, bossId,level) VALUES (?, ?,?)`,
  GET_BOSS_BY_USER: `SELECT * FROM user_boss WHERE discordId = ?`,
  UPGRADE_BOSS: `UPDATE user_boss SET level = level + 1 WHERE discordId = ? AND bossId = ?`,
  GET_BOSS_BY_USER_BY_BOSS_ID: `SELECT * FROM user_boss WHERE discordId = ? AND bossId = ?`,
  GET_CURRENT_STATE: `SELECT * FROM user_boss WHERE discordId = ? AND bossId = ?`,
  UPDATE_MATERIAL_STATE_ON_BOSS: `UPDATE user_boss SET muId1 = ?, muId2 = ?  WHERE discordId = ? AND bossId = ?`,
  ADD_TRAINING: `UPDATE caserne  SET troopType = ?, troopLevel = ?, troopAmount = ?, troopEndTime = ? WHERE discordId = ?`,
  UPDATE_TROOP_AMOUNT: `UPDATE caserne SET troopType = NULL, troopLevel = 0, troopAmount = 0 , troopEndTime = 0 WHERE discordId = ?`,
  GET_TROOPS: `SELECT * FROM troops WHERE discordId = ?`,
  GET_BOSS_INFO_ARRAY: `SELECT * FROM bosses WHERE id IN (?)`,
  GET_ALL_TROOPS: `SELECT * FROM troops WHERE discordId = ?`,
  DELETE_ARMY: `DELETE FROM troops WHERE discordId = ? AND nom =? `,
  GET_ARMY: `SELECT * FROM user_army WHERE discordId = ? AND nom = ?`,
};

module.exports = SQL_QUERIES;

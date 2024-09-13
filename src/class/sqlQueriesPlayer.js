const sqlQueries = {
  getLastInsertId: "SELECT LAST_INSERT_ID() AS duel_id",
  insertDuel: "INSERT INTO duel (date) VALUES (NOW())",
  insertDuelDetails: "INSERT INTO dueldetails (idDuel, idUser) VALUES (?, ?)",
  updateDuelDetailsWin:
    "UPDATE dueldetails SET win = ? WHERE idUser = ? AND idDuel = ?",
  updateUserWinCounter:
    "UPDATE user SET winCounter = winCounter + 1 WHERE discordId = ?",
  updateUserLoseCounter:
    "UPDATE user SET loseCounter = loseCounter + 1 WHERE discordId = ?",
  getMateriaux: "SELECT * FROM materiau_user WHERE idUser = ?",
  getMaterialsById: `
    SELECT m.nom, mu.level AS materiauLevel, ub.bossId, mu.id
FROM user_boss ub
JOIN materiau_user mu ON mu.id IN (ub.muId1, ub.muId2)
JOIN materiau m ON m.id = mu.materiauId
WHERE mu.discordId = ?
AND ub.bossId = ?
AND mu.etat = ?;
  `,
  getMaterialsByIdEtat0: `
     SELECT m.nom AS nom, mu.level AS materiauLevel, mu.materiauId AS id FROM materiau m JOIN materiau_user mu ON m.id = mu.materiauId WHERE mu.discordId = ? AND (mu.etat = 0 OR mu.etat IS NULL);`,
  insertMaterialsIntoDuelDetail: `
    UPDATE dueldetails SET idMateriau1 = ?, idMateriau2 = ?, idMateriau3 = ?, idMateriau4 = ?
    WHERE idDuel = ? AND idUser = ?
  `,
  updateDuelDetailsDraw: "UPDATE dueldetails SET win = 2 WHERE idDuel = ?",
  getMaterialsByIdEtat1: ``,
  getPotionByEtat: `SELECT * FROM potion_user WHERE idUser = ? AND etat = ?`,
};

module.exports = sqlQueries;

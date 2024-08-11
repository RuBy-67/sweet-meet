const param = require("../jsons/param.json");
const { EmbedBuilder } = require("discord.js");
const DatabaseManager = require("./dbManager");
const sqlQueriesDate = require("./sqlQueriesDate");
const { pool, poolBo, poolCampagne, poolDate } = require("../db");
const emo = require(`../jsons/emoji.json`);

class Dating extends DatabaseManager {
  constructor() {
    super(pool, poolBo, poolCampagne, poolDate);
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
  }
  async getAllDateProfil() {
    const [rows] = await this.queryDate(sqlQueriesDate.GET_ALL_DATE);
    return rows;
  }
  async insertIntoProfile(
    user_id,
    dateOrientation,
    dateDesc,
    dateMP,
    prenom,
    age
  ) {
    await this.queryDate(sqlQueriesDate.INSERT_INTO_PROFILE, [
      user_id,
      dateOrientation,
      dateDesc,
      dateMP,
      prenom,
      age,
    ]);
  }
  async insertIntoLIke(id1, id2) {
    await this.queryDate(sqlQueriesDate.INSERT_INTO_LIKE, [id1, id2]);
  }
  async getLikerId(id1, id2) {
    const [rows] = await this.queryDate(sqlQueriesDate.GET_LIKER_ID, [
      id1,
      id2,
    ]);
    return rows;
  }
}

module.exports = Dating;

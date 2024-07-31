const param = require("../jsons/param.json");
const DatabaseManager = require("./dbManager");
const sqlQueriesBoss = require("./sqlQueriesBoss");
const { pool, poolBo, poolCampagne } = require("../db");
const duelMessages = require(`../jsons/gif.json`);
const emo = require(`../jsons/emoji.json`);

class Boss extends DatabaseManager {
  constructor() {
    super(pool, poolBo, poolCampagne);
    this.userId = null;
    this.stats = null;
    this.materiaux = null;
  }
  async getInfoBossById(id) {
    const result = await this.queryCampagne(sqlQueriesBoss.getInfoBossById, [
      id,
    ]);
    return result[0];
  }
}
module.exports = Boss;

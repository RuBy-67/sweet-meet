const DatabaseManager = require("../../class/dbManager"); // Adjust the path as necessary
const db = new DatabaseManager();
module.exports = {
  name: "boost",
  description: "Événement de suivi des boosts de serveur",
  run: async (client, oldGuild, newGuild) => {
    const oldBoostLevel = oldGuild.premiumTier;
    const newBoostLevel = newGuild.premiumTier;

    if (newBoostLevel > oldBoostLevel) {
      const members = await newGuild.members.fetch();

      members.forEach(async (member) => {
        if (
          oldGuild.premiumSubscriptionCount < newGuild.premiumSubscriptionCount
        ) {
          const userId = member.user.id;
          const powerToAdd = 50000;
          await db.updatePower(userId, powerToAdd);
          await member.send(
            `Merci pour votre boost! Vous avez reçu ${powerToAdd} points de puissance!`
          );
          await db.updateBadge(userId, "Booster");
        }
      });
    }
  },
};

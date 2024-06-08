const DatabaseManager = require("../../class/dbManager"); // Ajustez le chemin si nécessaire
const db = new DatabaseManager();

module.exports = {
  name: "boost",
  description: "Événement de suivi des boosts de serveur",
  async execute(client, oldGuild, newGuild) {
    const oldBoostLevel = oldGuild.premiumTier;
    const newBoostLevel = newGuild.premiumTier;

    if (newBoostLevel > oldBoostLevel) {
      const members = newGuild.members.cache;

      for (const [memberID, member] of members) {
        const oldBoostCount = oldGuild.premiumSubscriptionCount;
        const newBoostCount = newGuild.premiumSubscriptionCount;

        if (oldBoostCount < newBoostCount && member.user.bot === false) {
          const userId = member.user.id;
          const powerToAdd = 50000;

          await db.updatePower(userId, powerToAdd);
          await member.send(
            `Merci pour votre boost! Vous avez reçu ${powerToAdd} Fragments de Protection`
          );
          await db.updateBadge(userId, "Booster");
        }
      }
    }
  },
};

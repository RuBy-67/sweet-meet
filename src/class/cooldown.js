const cooldowns = new Map();

class Cooldown {
  async setCooldown(userId, commandName, cooldownDuration) {
    const userCooldowns = cooldowns.get(userId) || new Map();
    userCooldowns.set(commandName, Date.now() + cooldownDuration);
    cooldowns.set(userId, userCooldowns);
  }

  async isOnCooldown(userId, commandName, cooldownDuration) {
    const userCooldowns = cooldowns.get(userId);
    if (!userCooldowns) return false;

    const expirationTime = userCooldowns.get(commandName);
    if (!expirationTime) return false;

    const remainingTime = (expirationTime - Date.now()) / 1000;
    if (remainingTime <= 0) {
      userCooldowns.delete(commandName);
      return false;
    }

    return { remainingTime, cooldownDuration };
  }

  async handleCooldown(interaction, commandName, cooldownDuration) {
    const userId = interaction.user.id;
    const cooldownInfo = await this.isOnCooldown(
      userId,
      commandName,
      cooldownDuration
    );

    if (cooldownInfo) {
      const remainingTime = cooldownInfo.remainingTime.toFixed(1);
      const timestamp = Math.floor((Date.now() + remainingTime * 1000) / 1000);
      await interaction.reply({
        content: `Vous êtes en cooldown pour cette commande. Veuillez réessayer <t:${timestamp}:R>`,
        ephemeral: true,
      });
      return true;
    } else {
      await this.setCooldown(userId, commandName, cooldownDuration * 1000);
      return false;
    }
  }
}
module.exports = Cooldown;

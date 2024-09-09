const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");
const DatabaseManager = require("../../class/dbManager");
const dbManager = new DatabaseManager();
const emo = require("../../jsons/emoji.json");
const config = require("../../jsons/config.json");
const params = require("../../jsons/param.json");
const color = require("../../jsons/color.json");

module.exports = {
  name: "createaccount",
  description: "Créer son compte sur Sweet Meet",
  options: null,

  run: async (client, interaction, args) => {
    if (config.maintenance) {
      const embed = new EmbedBuilder()
        .setTitle("⚒️ Maintenance ⚒️")
        .setColor(color.error)
        .setDescription(
          `> Le bot est actuellement en maintenance, veuillez réessayer plus tard.`
        );
      return interaction.reply({ embeds: [embed] });
    }

    const userId = interaction.user.id;
    const user = await dbManager.getStats(userId);
    if (user) {
      const embed = new EmbedBuilder()
        .setTitle("Erreur")
        .setColor(color.error)
        .setDescription(
          `Vous avez déjà un compte sur Sweet Meet, ${interaction.user.username} envie de changer de civilisation ? '/update civilisation.'`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    function emoji(id) {
      return (
        client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
        "Missing Emoji"
      );
    }

    // Fonction pour construire la description des bonus
    function buildBonusDescription(bonus) {
      const parts = [];

      if (bonus.archerBonusSanté != 0)
        parts.push(`> **${bonus.archerBonusSanté}%** Santé Archer`);
      if (bonus.archerBonusAttaque != 0)
        parts.push(`> **${bonus.archerBonusAttaque}% ** Attaque Archer`);
      if (bonus.archerBonusDéfense != 0)
        parts.push(`> **${bonus.archerBonusDéfense}%** Défense Archer`);
      if (bonus.cavalierBonusSanté != 0)
        parts.push(`> **${bonus.cavalierBonusSanté}%** Santé Cavalerie`);
      if (bonus.cavalierBonusAttaque != 0)
        parts.push(`> **${bonus.cavalierBonusAttaque}%** Attaque Cavalerie`);
      if (bonus.cavalierBonusDéfense != 0)
        parts.push(`> **${bonus.cavalierBonusDéfense}%** Défense Cavalerie`);
      if (bonus.infanterieBonusSanté != 0)
        parts.push(`> **${bonus.infanterieBonusSanté}%** Santé Infanterie`);
      if (bonus.infanterieBonusAttaque != 0)
        parts.push(`> **${bonus.infanterieBonusAttaque}%** Attaque Infanterie`);
      if (bonus.infanterieBonusDéfense != 0)
        parts.push(`> **${bonus.infanterieBonusDéfense}%** Défense Infanterie`);
      if (bonus.machineBonusSanté != 0)
        parts.push(`> **${bonus.machineBonusSanté}%** Santé Machine`);
      if (bonus.machineBonusAttaque != 0)
        parts.push(`> **${bonus.machineBonusAttaque}%** Attaque Machine`);
      if (bonus.machineBonusDéfense != 0)
        parts.push(`> **${bonus.machineBonusDéfense}%** Défense Machine`);
      return parts.length ? parts.join("\n ") : "Aucun bonus spécial.";
    }
    async function getTroopTypeName(type) {
      const bonusPercentage = params.troops.baseBonusType / 100;
      switch (type) {
        case 1: // Infanterie
          const infanterie = await dbManager.getTroopType("infanterie");
          return `**Infanterie ${emoji(emo.infant)}** (+${
            params.troops.baseBonusType
          }%)\n> Attaque : **${Math.round(
            infanterie.attaque * (1 + bonusPercentage)
          )}** ⚔️\n> Défense : **${Math.round(
            infanterie.defense * (1 + bonusPercentage)
          )}** 🛡️\n> Santé : **${Math.round(
            infanterie.sante * (1 + bonusPercentage)
          )}** 💚`;

        case 2: // Archer
          const archer = await dbManager.getTroopType("archer");
          return `**Archer ${emoji(emo.archer)}** (+${
            params.troops.baseBonusType
          }%)\n> Attaque : **${Math.round(
            archer.attaque * (1 + bonusPercentage)
          )}** ⚔️\n> Défense : **${Math.round(
            archer.defense * (1 + bonusPercentage)
          )}** 🛡️\n> Santé : **${Math.round(
            archer.sante * (1 + bonusPercentage)
          )}** 💚`;

        case 3: // Cavalier
          const cavalier = await dbManager.getTroopType("cavalier");
          return `**Cavalier ${emoji(emo.horse)}** (+${
            params.troops.baseBonusType
          }%)\n> Attaque : **${Math.round(
            cavalier.attaque * (1 + bonusPercentage)
          )}** ⚔️\n> Défense : **${Math.round(
            cavalier.defense * (1 + bonusPercentage)
          )}** 🛡️\n> Santé : **${Math.round(
            cavalier.sante * (1 + bonusPercentage)
          )}** 💚`;

        case 4: // Machine
          const machine = await dbManager.getTroopType("machine");
          return `**Machine ${emoji(emo.machine)}** (+${
            params.troops.baseBonusType
          }%)\n> Attaque : **${Math.round(
            machine.attaque * (1 + bonusPercentage)
          )}** ⚔️\n> Défense : **${Math.round(
            machine.defense * (1 + bonusPercentage)
          )}** 🛡️\n> Santé : **${Math.round(
            machine.sante * (1 + bonusPercentage)
          )}** 💚`;

        default:
          return "Inconnu ❔";
      }
    }
    function getTroopTypeEasy(type) {
      switch (type) {
        case 1:
          return `Infanterie`;

        case 2:
          return `Archer`;

        case 3:
          return `Cavalier`;

        case 4:
          return `Machine `;

        default:
          return "Inconnu";
      }
    }

    const civilizations = await dbManager.getAllCivilisation();
    const bosses = await Promise.all(
      civilizations.map((civ) => dbManager.getBossInfo(civ.bossId))
    );
    // Construire la description des civilisations
    const fields = await Promise.all(
      civilizations.map(async (civ, index) => {
        const boss = bosses[index]; // Récupère le boss correspondant à la civilisation
        return {
          name: `${emoji(emo[civ.nom])} ${civ.nom}`,
          value: `Spécialité Principale : ${await getTroopTypeName(
            civ.troopType
          )}\n\nBonus Civilisation :\n ${buildBonusDescription(
            civ
          )}\n\nBonus de Départ : **+${civ.fragment} Fragment ${emoji(
            emo.power
          )}**\nBoss de départ : **${boss[0].nom}**\n> Santé : **${
            boss[0].santeBoost
          }%** 💚\n> Attaque : **${boss[0].attaqueBoost}%** ⚔️\n> Défense : **${
            boss[0].defenseBoost
          }%** 🛡️\n__----------------------__`,
        };
      })
    );

    // Embed de présentation des civilisations
    const embed = new EmbedBuilder()
      .setTitle("Création de compte")
      .setDescription(
        `Bienvenue sur Sweet Meet, ${interaction.user.username} !\n\nPour commencer, veuillez choisir votre civilisation parmi les suivantes :`
      )
      .addFields(fields)
      .setColor(color.pink);

    // Menu de sélection des civilisations
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("civilization_select")
      .setPlaceholder("Choisissez votre civilisation")
      .addOptions(
        civilizations.map((civ) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(civ.nom)
            .setValue(civ.nom.toLowerCase())
            .setDescription(`Spécialité : ${getTroopTypeEasy(civ.troopType)}`)
            .setEmoji(emo[civ.nom.toLowerCase()])
        )
      );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) =>
        i.customId === "civilization_select" && i.user.id === userId,
      time: 60000, // 1 minute
    });

    collector.on("collect", async (i) => {
      const selectedCivilization = i.values[0];

      // Trouver la civilisation sélectionnée
      const civ = await dbManager.getCivilisationByName(selectedCivilization);

      if (!civ) {
        return i.reply({
          content: "Civilisation non trouvée.",
          ephemeral: true,
        });
      }

      // Créer le compte
      await dbManager.createAccount(
        userId,
        selectedCivilization,
        civ[0].troopType
      );
      frag = civ[0].fragment;

      await dbManager.addBossId(userId, civ[0].bossId, 1);
      const nomBoss = await dbManager.getBossInfo(civ[0].bossId);
      await dbManager.updatePower(userId, frag);
      // Répondre à l'utilisateur avec les détails
      const stats = await dbManager.getStats(userId);
      const power = stats.power;
      const formattedPower = power.toLocaleString("fr-FR", {
        useGrouping: true,
      });

      const embedReply = new EmbedBuilder()
        .setAuthor({
          name: "Puissance: " + stats.power,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle(`Civilisation Choisie : **${civ[0].nom}**`)
        .setDescription(
          `**Détails :**\n` +
            `- **Boss de départ** : ${nomBoss[0].nom}\n` +
            `- **Spécialité Principale** : ${getTroopTypeEasy(
              civ[0].troopType
            )}\n` +
            `- **Fragments** : **+${civ[0].fragment}** ${emoji(
              emo.power
            )}\n\n` +
            `Votre compte a été créé avec succès.\n` +
            `**10 000** ${getTroopTypeEasy(
              civ[0].troopType
            )} Lvl1 ont été ajoutés à votre Caserne.\n` +
            `Vous pouvez maintenant commencer à jouer !\n\n` +
            `Commandes :\n` +
            `- /infos profil\n` +
            `- /infos boss\n` +
            `- /duel\n` +
            `- /caserne\n` +
            `- /hôpital\n` +
            `- /forge\n` +
            `- /updateciv`
        )
        .setColor(color.pink)
        .setFooter({
          text: `Demandé(e) par ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });
      await i.update({
        components: [],
        embeds: [embedReply],
      });
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.followUp({
          content:
            "Le temps est écoulé, vous n'avez pas sélectionné de civilisation.",
          ephemeral: true,
        });
      }
    });
  },
};

const {
  EmbedBuilder,
  Client,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");
const emo = require(`../jsons/emoji.json`);
const color = require(`../jsons/color.json`);
const param = require("../jsons/param.json");
const config = require("../jsons/config.json");
const DatabaseManager = require("../class/dbManager");
const dbManager = new DatabaseManager();

async function openShop(client, shopMessage) {
  function emoji(id) {
    return (
      client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
      "Missing Emoji"
    );
  }

  const BuyableMaterial = await dbManager.getRandomMaterial();
  const materialLevels = {};
  BuyableMaterial.forEach((material) => {
    const level = Math.floor(Math.random() * 5) + 1;
    materialLevels[material.id] = level;
  });
  const role = await dbManager.getRolesFromDB();
  const temps = Math.floor(Date.now() / 1000);
  const timestamp = temps + param.shopDuration;
  const embed = new EmbedBuilder()
    .setTitle("Boutique Ouverte")
    .setColor(color.pink)
    .setImage(
      "https://cdn.discordapp.com/attachments/1246893100790448198/1246895279890763846/ruby_67_a_ancien_work_shop_on_roulotte_cartoon_style_2b489696-1d8f-40f2-9b0b-0bb2afdecc34.png?ex=665e0d38&is=665cbbb8&hm=150b14e6c5595ac2871e3787ca25d954d831658bdb3dc44ed9cf069b833055c0&"
    )
    .setDescription(
      `> Elowen le Marchand, vous acceuille dans sa boutique ! Sélectionnez un objet à acheter.\n\nLa boutique fermera <t:${timestamp}:R>.`
    )
    .addFields(
      {
        name: `LootBox`,
        value: `- ${emoji(
          emo.randomlootbox
        )} **RandomLootBox**:\n> Une boîte aléatoire, Prix : **${
          param.boutique.achat.prix.RndLootBox
        }** ${emoji(emo.power)}\n\n- ${emoji(
          emo.daysbox
        )} **DaysBox:** \n> Boite journalière, Prix : **${
          param.boutique.achat.prix.LootBox
        } ${emoji(emo.power)}**`,
      },
      {
        name: "Materiaux",
        value: BuyableMaterial.map((material) => {
          const level = materialLevels[material.id]; // Récupérer le niveau à partir de l'objet
          const price = Math.floor(
            param.boutique.achat.prix.materiaux[material.rarete] * level * 0.6
          );
          return `- ${emoji(emo[material.nom])} **${
            material.nom
          }** => (lvl: ${level}), **Prix: ${price}** ${emoji(emo.power)}\n> **${
            material.rarete
          }** \n> ${material.lore}`;
        }).join("\n\n"),
      },
      {
        name: "Rôle",
        value: role
          .map((role) => {
            return `- **${role.nom}**, **Prix: ${
              param.boutique.achat.prix.role[role.id]
            } ${emoji(emo.power)} **\n> ${role.lore}`;
          })
          .join("\n\n"),
      }
    )
    .setFooter({
      text: `created by Ruby_67 - Boutique Ouverte`,
    });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select-item")
    .setPlaceholder("Choisissez un objet")
    .addOptions(
      [
        {
          label: "RandomLootBox",
          description: `Prix: ${param.boutique.achat.prix.RndLootBox}⚡`,
          value: "randomlootbox",
        },
        {
          label: "DaysBox",
          description: `Prix:  ${param.boutique.achat.prix.LootBox}⚡`,
          value: "daysbox",
        },
      ]
        .map((option) =>
          new StringSelectMenuOptionBuilder()
            .setEmoji(emo[option.value] || "❔")
            .setLabel(option.label)
            .setDescription(option.description)
            .setValue(option.value)
        )
        .concat(
          BuyableMaterial.map((material) => {
            const level = materialLevels[material.id]; // Récupérer le niveau à partir de l'objet
            const price = Math.floor(
              param.boutique.achat.prix.materiaux[material.rarete] * level * 0.6
            );
            return new StringSelectMenuOptionBuilder()
              .setEmoji(emo[material.nom] || "❔")
              .setLabel(`${material.nom} (lvl: ${level})`)
              .setDescription(`Prix: ${price}⚡`)
              .setValue(`material_${material.id}_${level}`);
          }),
          role.map((role) => {
            return new StringSelectMenuOptionBuilder()
              .setEmoji("1246899778726531142")
              .setLabel(`${role.nom}`)
              .setDescription(
                `Prix: ${param.boutique.achat.prix.role[role.id]}⚡`
              )
              .setValue(`role_${role.id}`);
          })
        )
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);
  const channelId = config.boutique;
  const logChannel = await client.channels.fetch(channelId);
  if (logChannel) {
    if (shopMessage) {
      await shopMessage.edit({ embeds: [embed], components: [row] });
    } else {
      const message = await logChannel.send({
        embeds: [embed],
        components: [row],
      });
      shopMessage = message;
    }
  } else {
  }
  setTimeout(() => closeShop(client, shopMessage), param.shopDuration * 1000);
}

async function closeShop(client, shopMessage) {
  const temps = Math.floor(Date.now() / 1000) + param.closeInterval;
  const timestamp = temps + param.closeInterval;
  const embed = new EmbedBuilder()
    .setTitle("Boutique Fermée")
    .setColor(color.black)
    .setImage(
      "https://cdn.discordapp.com/attachments/1246893100790448198/1246905655894479001/ruby_67_Elowen_le_Marchand_Itinerant_est_actuellement_en_voyage_c6f82e37-46c6-4c85-8f07-e6dea33a0407.png?ex=665e16e2&is=665cc562&hm=a22abb61ab4eec608e6508980aea7c49e3ceaa6ddeb10c1edd6fe5e5bdae02b9&"
    )
    .setDescription(
      `> Elowen le Marchand est actuellement en voyage à travers les contrées de Valoria, découvrant de nouveaux trésors et forçant de nouvelles alliances.\n> Revenez plus tard pour découvrir les merveilles qu'il aura ramenées de ses aventures lointaines. En attendant, que la magie de Valoria guide vos pas.\n\nMerci de votre visite ! <t:${timestamp}:R> .`
    )
    .setFooter({
      text: `Boutique Fermée - Created by Ruby_67`,
    });

  await shopMessage.edit({ embeds: [embed], components: [] });

  setTimeout(() => openShop(client, shopMessage), param.closeInterval * 1000);
}

async function randomLootBox(interaction) {
  // Logique pour la RandomLootBox
  await interaction.reply({
    content: `Vous avez choisi la RandomLootBox. Voici vos récompenses...(🚧)`,
    ephemeral: true,
  });
}

async function daysBox(interaction) {
  // Logique pour la DaysBox
  await interaction.reply({
    content: `Vous avez choisi la DaysBox. Voici vos récompenses pour aujourd'hui...(🚧)`,
    ephemeral: true,
  });
}
async function buyMaterial(client, interaction, userId, materialId, level) {
  function emoji(id) {
    return (
      client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
      "Missing Emoji"
    );
  }

  const [m] = await dbManager.getDataMateriauById(materialId);
  const prix = Math.floor(
    param.boutique.achat.prix.materiaux[m.rarete] * level * 0.6
  );
  const power = await dbManager.getStats(interaction.user.id);
  if (power.power < prix) {
    return interaction.reply({
      content: `Vous n'avez pas assez de ${emoji(
        emo.power
      )} pour acheter le matériau ${m.nom}`,
      ephemeral: true,
    });
  } else {
    await dbManager.updatePower(interaction.user.id, -prix);
    await dbManager.addMaterialToUser(
      interaction.user.id,
      materialId,
      level - 1
    );
    await interaction.reply({
      content: `Vous avez acheté le matériau **${m.nom}** (lvl : ${
        level - 1
      }),prix: ${prix} ${emoji(emo.power)}`,
      ephemeral: true,
    });
  }
}
async function buyRole(client, interaction, userId, roleId) {
  function emoji(id) {
    return (
      client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
      "Missing Emoji"
    );
  }
  const testRole = await dbManager.getRoleByUserIdRoleId(
    roleId,
    interaction.user.id
  );
  const [role] = await dbManager.getRoleById(roleId);
  const power = await dbManager.getStats(interaction.user.id);
  if (testRole.length > 0) {
    return interaction.reply({
      content: `Vous posseder déjà le role ${role.nom}`,
      ephemeral: true,
    });
  } else if (power.power < param.boutique.achat.prix.role[roleId]) {
    return interaction.reply({
      content: `Vous n'avez pas assez de ${emoji(
        emo.power
      )} pour acheter le role ${role.nom}`,
      ephemeral: true,
    });
  } else {
    const prix = param.boutique.achat.prix.role[roleId];
    const member = await interaction.guild.members.fetch(interaction.user.id);
    await dbManager.updatePower(interaction.user.id, -prix);
    await dbManager.addRoleToUser(interaction.user.id, roleId);
    await member.roles.add(roleId);

    await interaction.reply({
      content: `Vous avez acheté le rôle ${role.nom}, prix: ${prix} ${emoji(
        emo.power
      )}`,
      ephemeral: true,
    });
  }
}
module.exports = {
  buyMaterial,
  daysBox,
  randomLootBox,
  openShop,
  closeShop,
  buyRole,
};
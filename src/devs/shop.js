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
const Player = require("../class/player");
const player = new Player();
const DatabaseManager = require("../class/dbManager");
const dbManager = new DatabaseManager();
const Cooldown = require("../class/cooldown");
const cooldown = new Cooldown();

async function openShop(client, shopMessage) {
  if (config.maintenance) {
    return;
  }
  let dayBox = "";
  const { dayMaterial, dayPower } = await player.dayliBox();
  if (dayMaterial != null) {
    dayBox = `daysbox_${dayPower}_${dayMaterial.id}`;
  } else {
    dayBox = `daysbox_${dayPower}`;
  }

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
    .setDescription(
      `> *Elowen*: ***Les routes m'ont mené jusqu'ici une fois de plus, voyageurs et aventuriers de Valoria! Ma boutique est maintenant ouverte, offrant trésors rares et artefacts enchantés. Approchez, et laissez vos yeux découvrir les merveilles que j'ai ramenées des quatre coins du royaume!***\n\nLa boutique fermera <t:${timestamp}:R>.`
    )
    .addFields(
      {
        name: `LootBox`,
        value: `- ${emoji(
          emo.RandomLootBox
        )} **RandomLootBox**:\n> Une boîte aléatoire contient entre 1 et 3 matériels, Prix : **${
          param.boutique.achat.prix.RndLootBox
        }** ${emoji(emo.power)}\n\n- ${emoji(
          emo.DaysBox
        )} **DaysBox:** \n> Boite journalière contient 0 ou 1 matériels et de la puissance, Prix : **${
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
        name: "Rôles",
        value: role
          .map((role) => {
            let lore =
              role.lore.length > 100
                ? `${role.lore.slice(0, 97)}...`
                : role.lore;
            return `- **${role.nom}**, **Prix: ${
              param.boutique.achat.prix.role[role.id]
            } ${emoji(emo.power)} **\n> ${lore} [...]`;
          })
          .join("\n\n"),
      }
    )
    .setImage(
      "https://media.discordapp.net/attachments/1246893100790448198/1246964534170877982/ruby_67_Elowen_is_a_merchant_His_shop_is_a_cart_pulled_by_Mist__4813330d-83d8-486a-a496-50ecc8699eff.png?ex=66658df8&is=66643c78&hm=5d0ed0876f998bb32c36eaf79acb88b2a07ab7efb06322da905819209445853c&=&format=webp&quality=lossless&width=810&height=540"
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
          description: `Prix: ${param.boutique.achat.prix.RndLootBox} 🌟`,
          value: "randomlootbox",
        },
        {
          label: "DaysBox",
          description: `Prix:  ${param.boutique.achat.prix.LootBox} 🌟`,
          value: dayBox,
        },
      ]
        .map((option) =>
          new StringSelectMenuOptionBuilder()
            .setEmoji(emo[option.label] || "❔")
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
              .setDescription(`Prix: ${price} 🌟`)
              .setValue(`material_${material.id}_${level}`);
          }),
          role.map((role) => {
            return new StringSelectMenuOptionBuilder()
              .setEmoji("1246899778726531142")
              .setLabel(`${role.nom}`)
              .setDescription(
                `Prix: ${param.boutique.achat.prix.role[role.id]} 🌟`
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
    .setDescription(
      `> *Elowen*: ***Le vent m'appelle vers de nouveaux horizons, mes amis. ma boutique ferme ses portes pour l'instant. Mais ne désespérez pas, car je reviendrai avec de nouveaux trésors et découvertes. Que vos aventures soient prospères jusqu'à notre prochaine rencontre!***\n *En attendant, que la magie de Valoria guide vos pas.*\n\nMerci de votre visite ! <t:${timestamp}:R> .`
    )
    .setImage(
      "https://media.discordapp.net/attachments/1246893100790448198/1246964534170877982/ruby_67_Elowen_is_a_merchant_His_shop_is_a_cart_pulled_by_Mist__4813330d-83d8-486a-a496-50ecc8699eff.png?ex=66658df8&is=66643c78&hm=5d0ed0876f998bb32c36eaf79acb88b2a07ab7efb06322da905819209445853c&=&format=webp&quality=lossless&width=810&height=540"
    )
    .setFooter({
      text: `Boutique Fermée - Created by Ruby_67`,
    });

  await shopMessage.edit({ embeds: [embed], components: [] });

  setTimeout(() => openShop(client, shopMessage), param.closeInterval * 1000);
}
///-----------------------///
async function randomLootBox(client, interaction, ...materialIds) {
  function emoji(id) {
    return (
      client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
      "Missing Emoji"
    );
  }
  const userPower = await dbManager.getStats(interaction.user.id);
  const totalPrice = param.boutique.achat.prix.RndLootBox;

  if (userPower.power < totalPrice) {
    return interaction.reply({
      content: `Vous n'avez pas assez de ${emoji(
        emo.power
      )} pour acheter la RandomLootBox`,
      ephemeral: true,
    });
  }
  let message = "Vous avez obtenu les récompenses suivantes :\n>>> ";
  for (const materialId of materialIds) {
    const [selectedItem] = await dbManager.getDataMateriauById(materialId);
    message += `- ${emoji(emo[selectedItem.nom])} **${selectedItem.nom}** \n`;

    await dbManager.addMaterialToUser(interaction.user.id, materialId);
  }
  await dbManager.updatePower(interaction.user.id, -totalPrice);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

///-----------------------///

async function daysBox(client, interaction, power, materialId) {
  power = Math.floor(power);
  const commandName = "daylibox";
  const cooldownDuration = param.cooldownBox;
  const messageCd = "Vous avez déjà acheté une DaysBox aujourd'hui";
  const cooldownInfo = await cooldown.handleCooldown(
    interaction,
    commandName,
    cooldownDuration,
    messageCd
  );
  if (cooldownInfo) return;
  function emoji(id) {
    return (
      client.emojis.cache.find((emoji) => emoji.id === id)?.toString() ||
      "Missing Emoji"
    );
  }
  const userPower = await dbManager.getStats(interaction.user.id);
  if (userPower.power < param.boutique.achat.prix.LootBox) {
    return interaction.reply({
      content: `Vous n'avez pas assez de ${emoji(
        emo.power
      )} pour acheter la DaysBox`,
      ephemeral: true,
    });
  }
  let message = "Vous avez obtenu les récompenses suivantes :\n>>> ";
  if (materialId != null) {
    await dbManager.addMaterialToUser(interaction.user.id, materialId);
    const [selectedItem] = await dbManager.getDataMateriauById(materialId);
    message += `- ${emoji(emo[selectedItem.nom])} **${
      selectedItem.nom
    }** \n- **${power}** ${emoji(emo.power)}\n`;
  } else {
    message += `- **${power}** ${emoji(emo.power)}\n`;
  }
  await dbManager.updatePower(
    interaction.user.id,
    power - param.boutique.achat.prix.LootBox
  );

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

///-----------------------///

async function buyMaterial(client, interaction, materialId, level) {
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
    level = Math.min(Math.max(level, 1), 5);
    await dbManager.addMaterialToUser(interaction.user.id, materialId, level);
    await interaction.reply({
      content: `Vous avez acheté le matériau **${
        m.nom
      }** (lvl : ${level}),prix: ${prix} ${emoji(emo.power)}`,
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

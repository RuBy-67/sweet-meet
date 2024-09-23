const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, EmbedBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');

// Stockage des salons vocaux créés par la commande
const createdVoiceChannels = new Set();

module.exports = {
    name: 'searchmate',
    description: 'Sélectionne un jeu, le nombre de joueurs et un rang pour rechercher des mates',

    run: async (client, interaction) => {
        // Utilisation de deferReply pour différer la réponse initiale
        await interaction.deferReply({ ephemeral: true });

        // Étape 1 : Sélection du jeu
        const gamesMenu = new StringSelectMenuBuilder()
            .setCustomId('select_game')
            .setPlaceholder('Choisir un jeu')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('League of Legends')
                    .setValue('LOL'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Teamfight Tactics')
                    .setValue('TFT'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Valorant')
                    .setValue('valorant'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('CS:GO')
                    .setValue('CS:GO'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Minecraft')
                    .setValue('Minecraft'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Rocket League')
                    .setValue('RL'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Apex Legends')
                    .setValue('Apex'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Roblox')
                    .setValue('Roblox'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Dead By Daylight')
                    .setValue('DBD'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Fifa')
                    .setValue('Fifa')
            );

        const row1 = new ActionRowBuilder().addComponents(gamesMenu);

        // Envoi du menu de sélection du jeu en mode éphémère
        const message = await interaction.editReply({
            content: 'Sélectionnez un jeu pour rechercher des joueurs :',
            components: [row1],
            ephemeral: true, // Cette interaction intermédiaire est éphémère
        });

        // choix du jeu
        const gameCollector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 30000,
        });

        gameCollector.on('collect', async (i) => {
            if (i.customId === 'select_game') {
                const selectedGame = i.values[0];

                // Étape 2 : Sélection du nombre de joueurs
                const playersMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_players')
                    .setPlaceholder('Combien de joueurs recherchez-vous ?')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('1 joueur')
                            .setValue('1'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('2 joueurs')
                            .setValue('2'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('3 joueurs')
                            .setValue('3'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('4 joueurs')
                            .setValue('4'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('5 joueurs')
                            .setValue('5')
                    );

                const row2 = new ActionRowBuilder().addComponents(playersMenu);

                // Mise à jour pour la sélection des joueurs
                await i.update({
                    content: `Vous avez sélectionné : ${selectedGame}. Maintenant, combien de joueurs recherchez-vous ?`,
                    components: [row2],
                    ephemeral: true,
                });

                // choix du nombre de joueurs
                const playersCollector = message.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000,
                });

                playersCollector.on('collect', async (i2) => {
                    if (i2.customId === 'select_players') {
                        const selectedPlayers = i2.values[0];

                        // Étape 3 : Sélection du rang
                        const ranksMenu = new StringSelectMenuBuilder()
                            .setCustomId('select_rank')
                            .setPlaceholder('Choisir votre rang')
                            .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Fun')
                                    .setValue('fun'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Bronze')
                                    .setValue('bronze'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Silver')
                                    .setValue('silver'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Gold')
                                    .setValue('gold'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Platine')
                                    .setValue('platine'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Diamant')
                                    .setValue('diamant'),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel('Champion')
                                    .setValue('champion')
                            );

                        const row3 = new ActionRowBuilder().addComponents(ranksMenu);

                        // Mise à jour pour la sélection du rang
                        await i2.update({
                            content: `Vous avez sélectionné : ${selectedPlayers} joueurs. Maintenant, quel est votre rang ?`,
                            components: [row3],
                            ephemeral: true,
                        });

                        // choix du rang
                        const rankCollector = message.createMessageComponentCollector({
                            componentType: ComponentType.StringSelect,
                            time: 30000,
                        });

                        rankCollector.on('collect', async (i3) => {
                            if (i3.customId === 'select_rank') {
                                const selectedRank = i3.values[0];

                                await i3.deferUpdate();  // On différé la mise à jour pour éviter les erreurs d'interaction

                                // Création de l'embed récapitulatif
                                const embed = new EmbedBuilder()
                                    .setColor(10181046)
                                    .setTitle('Recherche de mate')
                                    .setDescription('Voici les détails de la recherche :')
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1211347141218533490/1284196466004594839/chibi_girl_pumpkin_by_wabisabiwonders_dgbh205-350t.png?ex=66ebaf68&is=66ea5de8&hm=d9f2dff0497d3a201b683b4675ca51f698c6817746e98587c8a9e45f1f7dc73d&')
                                    .addFields(
                                        { name: 'Jeu', value: selectedGame, inline: true },
                                        { name: 'Nombre de joueurs', value: selectedPlayers, inline: true },
                                        { name: 'Rang', value: selectedRank, inline: true }
                                    )
                                    .setTimestamp();

                                // Création d'un salon vocal
                                const voiceChannel = await interaction.guild.channels.create({
                                    name: `${interaction.user.username}-room`,
                                    type: ChannelType.GuildVoice,
                                    parent: '1216057432728408265', // Remplacez 'CATEGORY_ID' par l'ID de votre catégorie
                                    permissionOverwrites: [
                                        {
                                            id: interaction.guild.id,
                                            allow: [PermissionsBitField.Flags.Connect], // Permettre l'accès à tous
                                        },
                                        {
                                            id: interaction.user.id,
                                            allow: [PermissionsBitField.Flags.Connect], // Permettre l'accès à l'utilisateur
                                        },
                                    ],
                                });

                                // Ajouter le salon à la liste des salons créés par cette commande
                                createdVoiceChannels.add(voiceChannel.id);

                                // Déplacer l'utilisateur dans le nouveau salon vocal
                                const member = interaction.guild.members.cache.get(interaction.user.id);
                                if (member && member.voice) {
                                        await member.voice.setChannel(voiceChannel.id);
                                }

                                // Bouton d'acceptation uniquement
                                const acceptButton = new ButtonBuilder()
                                    .setCustomId('accept')
                                    .setLabel('Rejoindre')
                                    .setStyle(ButtonStyle.Success);

                                const buttonRow = new ActionRowBuilder().addComponents(acceptButton);

                                // Envoi de l'embed et des boutons visibles pour tout le monde (sans ephemeral)
                                const finalMessage = await interaction.channel.send({
                                    content: `Salon vocal créé : ${voiceChannel.name}`,
                                    embeds: [embed],
                                    components: [buttonRow], // Ajouter le bouton d'acceptation
                                });

                                // Désactiver les boutons après 10 minutes (600000 ms)
                                setTimeout(async () => {
                                    await finalMessage.edit({
                                        components: [new ActionRowBuilder().addComponents(
                                            acceptButton.setDisabled(true)
                                        )],
                                    });
                                }, 600000); // 10 minutes

                                // Supprimer l'embed après 10 minutes (600 000 ms)
                                setTimeout(async () => {
                                    await finalMessage.delete();
                                }, 600000); // 10 minutes

                                // Configuration d'un collector pour le bouton
                                const buttonCollector = finalMessage.createMessageComponentCollector({
                                    componentType: ComponentType.Button,
                                    time: 600000,
                                });

                                buttonCollector.on('collect', async (i4) => {
                                    if (i4.customId === 'accept') {
                                        const accepter = i4.user;
                                        const accepterMember = interaction.guild.members.cache.get(accepter.id);

                                        // Vérifier si l'utilisateur est dans un salon vocal
                                        if (!accepterMember.voice.channel) {
                                            return await i4.reply({
                                                content: "Vous devez être dans un salon vocal pour être déplacé.",
                                                ephemeral: true,
                                            });
                                        }

                                        // Vérifier si le salon vocal existe toujours
                                        const channelExists = interaction.guild.channels.cache.get(voiceChannel.id);
                                        if (!channelExists) {
                                            return await i4.reply({
                                                content: "Le salon vocal n'existe plus. Vous ne pouvez pas rejoindre.",
                                                ephemeral: true,
                                            });
                                        }

                                        // Déplacer l'utilisateur dans le salon vocal s'il est en vocal
                                        await accepterMember.voice.setChannel(voiceChannel.id);
                                        // ** Marquer l'interaction comme traitée **
                                        await i4.deferUpdate();
                                    }
                                });

                                buttonCollector.on('end', async () => {
                                    await finalMessage.edit({ components: [] }); // Retirer les boutons après expiration du collector
                                });

                                // Suppression automatique des salons vides
                                client.on('voiceStateUpdate', async (oldState, newState) => {
                                    const voiceChannelId = oldState.channelId;
                                    // Vérifier si un utilisateur quitte un salon vocal
                                    if (voiceChannelId && createdVoiceChannels.has(voiceChannelId)) {
                                        const voiceChannel = oldState.guild.channels.cache.get(voiceChannelId);

                                        if (voiceChannel) {
                                            // Vérifier si le salon vocal est vide
                                            if (voiceChannel.members.size === 0) {
                                                // Double vérification : Si le salon vocal existe toujours avant de le supprimer
                                                const channelExists = oldState.guild.channels.cache.get(voiceChannelId);
                                                if (channelExists) {
                                                    await voiceChannel.delete();
                                                    createdVoiceChannels.delete(voiceChannelId); // Supprimer le salon de la liste des salons créés
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });

                        rankCollector.on('end', async (collected, reason) => {
                            if (reason === 'time') {
                                await interaction.editReply({
                                    content: 'Temps écoulé pour la sélection du rang.',
                                    components: [],
                                });
                            }
                        });
                    }
                });

                playersCollector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await interaction.editReply({
                            content: 'Temps écoulé pour la sélection du nombre de joueurs.',
                            components: [],
                        });
                    }
                });
            }
        });

        gameCollector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({
                    content: 'Temps écoulé pour la sélection du jeu.',
                    components: [],
                });
            }
        });
        await interaction.editReply({
            content: 'Une erreur est survenue lors de l\'envoi du menu.',
            ephemeral: true,
        });
    }
};

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType, ActionRowBuilder } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'dateprofil',
    description: 'Affiche les profils de date',

    run: async (client, message, args) => {
        if (interaction.isCommand()) {
            const { commandName } = interaction;

            if (commandName === 'dateprofil') {
                const profiles = await db.getAllDateProfil( rows => {
                    if (!profiles) {
                        return;
                    }

                    if (rows.length === 0) {
                        return interaction.reply('Aucun profil n\'a été trouvé.');
                    }

                    let page = 0;

                    const generateEmbed = async (page) => {
                        const profil = rows[page];
                        const targetUser = await client.users.fetch(profil.user_id);

                        return new EmbedBuilder()
                            .setTitle(`Profil de ${profil.prenomInput}`)
                            .setDescription(profil.dateDesc)
                            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                            .addFields(
                                { name: 'Âge', value: `${profil.ageInput}`, inline: true },
                                { name: 'Orientation', value: `${profil.dateOrientation}`, inline: true },
                                { name: 'MP', value: `${profil.dateMP}`, inline: true },
                            )
                            .setFooter({ text: `Page ${page + 1} sur ${rows.length}` });
                    };

                    const generateActionRow = () => {
                        return new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous')
                                .setLabel("⬅️")
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('like')
                                .setLabel("❤️")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel("➡️")
                                .setStyle(ButtonStyle.Primary)
                        );
                    };

                    const embedMessage = interaction.reply({
                        embeds: [generateEmbed(page)],
                        components: [generateActionRow()],
                        fetchReply: true
                    });

                    const collector = embedMessage.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000 
                    });

                    collector.on('collect', async (i) => {
                        if (i.customId === 'like') {
                                const likedId = rows[page].user_id;
                                const likerId = i.user.id;
                                const insertLike = await db.insertIntoLIke(likerId, likedId, function (err) {
                                if (!insertLike) {
                                    if (!insertLike.includes('SQLITE_CONSTRAINT')) {
                                        return i.reply({ content: 'Vous avez déjà aimé ce profil.', ephemeral: true });
                                    }
                                    return;
                                }
                                db.getLikerId(likedId, likerId, (err, row) => {
                                    if (err) {
                                        return;
                                    }
                                    if (row) {
                                        const liker = client.users.fetch(likerId);
                                        const liked = client.users.fetch(likedId);
                                        liker.send(`Toi et ${liked.username} avez matché! 💓`);
                                        liked.send(`Toi et ${liker.username} avez matché! 💓`);
                                    }
                                    i.reply({ content: 'Vous avez aimé ce profil!', ephemeral: true });
                                });
                            });
                        } else if (i.customId === 'previous') {
                            page = page > 0 ? --page : rows.length - 1;
                            i.update({ embeds: [await generateEmbed(page)], components: [generateActionRow()] });
                        } else if (i.customId === 'next') {
                            page = page + 1 < rows.length ? ++page : 0;
                            i.update({ embeds: [await generateEmbed(page)], components: [generateActionRow()] });
                        }
                    });

                    collector.on('end', collected => {
                        embedMessage.edit({ components: [] });
                    });
                });
            }
        }
    },
};
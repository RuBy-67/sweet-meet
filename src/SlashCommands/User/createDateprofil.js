const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const Dating = require("../../class/dateManager");
const db = new Dating();

module.exports = {
    name: 'createdateprofil',
    description: 'Crée un profil pour date',

    run: async (interaction) => {

        if (interaction.isCommand() && interaction.commandName ==='createdateprofil') {
            const modal = new ModalBuilder()
                .setCustomId('DateModal')
                .setTitle('Créer ton Profil');

            const prenomInput = new TextInputBuilder()
                .setCustomId('prenomInput')
                .setLabel("Quel est votre prénom/pseudo ?")
                .setStyle(TextInputStyle.Short);

            const ageInput = new TextInputBuilder()
                .setCustomId('ageInput')
                .setLabel("Quel âge avez vous ?")
                .setStyle(TextInputStyle.Short);

            const orientationInput = new TextInputBuilder()
                .setCustomId('orientationInput')
                .setLabel("Quel est votre orientation ?")
                .setStyle(TextInputStyle.Short);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('descriptionInput')
                .setLabel("Une petite description de vous?")
                .setStyle(TextInputStyle.Paragraph);

            const mpInput = new TextInputBuilder()
                .setCustomId('mpInput')
                .setLabel("Quel sont vos MP?")
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(prenomInput),
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(orientationInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(mpInput)
            );

            await interaction.showModal(modal);
        } else if (interaction.type === InteractionType.ModalSubmit) {
            const user_id = interaction.user.id;
            const prenom = interaction.fields.getTextInputValue('prenomInput');
            const age = interaction.fields.getTextInputValue('ageInput');
            const dateOrientation = interaction.fields.getTextInputValue('orientationInput');
            const dateDesc = interaction.fields.getTextInputValue('descriptionInput');
            const dateMP = interaction.fields.getTextInputValue('mpInput');

            await db.insertIntoProfile(
                user_id,
                prenom,
                age,
                dateOrientation,
                dateDesc,
                dateMP
            );
        }
    },
};
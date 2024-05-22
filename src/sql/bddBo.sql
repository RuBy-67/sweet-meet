CREATE TABLE IF NOT EXISTS backup_user (
    `discordId` int(255) NOT NULL,
    `power` int(11) NOT NULL,
    `date` date NOT NULL,
    PRIMARY KEY (`discordId`)
);

CREATE TABLE IF NOT EXISTS backup_materiau_user (
    `idUser` int(11) NOT NULL,
    `idMateriau` int(11) NOT NULL,
    `lvl` int(11) NOT NULL,
    `date` date NOT NULL,
    PRIMARY KEY (`idUser`, `idMateriau`, `date`),
    FOREIGN KEY (`idUser`) REFERENCES backup_user(`discordId`),
    FOREIGN KEY (`idMateriau`) REFERENCES materiau(`id`)
);

CREATE TABLE IF NOT EXISTS backup_badge_user (
    `idBadge` int(11) NOT NULL,
    `idUser` int(11) NOT NULL,
    `date` date NOT NULL,
    PRIMARY KEY (`idBadge`, `idUser`, `date`),
    FOREIGN KEY (`idBadge`) REFERENCES badge(`id`),
    FOREIGN KEY (`idUser`) REFERENCES backup_user(`discordId`)
);
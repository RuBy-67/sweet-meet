CREATE TABLE IF NOT EXISTS mariage (
    Id int(11) NOT NULL AUTO_INCREMENT,
    userId varchar(255) NOT NULL,
    userId2 varchar(255) NOT NULL,
    date date NOT NULL,
    PRIMARY KEY (Id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS user (
    discordId varchar(255) NOT NULL,
    power int(11) NOT NULL,
    winCounter int(11) NOT NULL,
    loseCounter int(11) NOT NULL,
    PRIMARY KEY (discordId)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS materiau (
    id int(11) NOT NULL AUTO_INCREMENT,
    nom varchar(255) NOT NULL,
    coût int(11) NOT NULL,
    type varchar(255) NOT NULL,
    bonus int(11) NOT NULL,
    malus int(11) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS materiau_user (
    id int(11) NOT NULL AUTO_INCREMENT,
    idUser varchar(255) NOT NULL,
    idMateriau int(11) NOT NULL,
    lvl int(11) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS duel (
    id int(11) NOT NULL AUTO_INCREMENT,
    userId1 varchar(255) NOT NULL,
    userId2 varchar(255) NOT NULL,
    date datetime NOT NULL,
    win int(11) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS badge (
    id int(11) NOT NULL AUTO_INCREMENT,
    nom varchar(255) NOT NULL,
    type varchar(255) NOT NULL,
    emojiId varchar(255) NOT NULL,
    bonus int(11) NOT NULL,
    malus int(11) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE IF NOT EXISTS badge_user (
    id int(11) NOT NULL AUTO_INCREMENT,
    idBadge int(11) NOT NULL,
    idUser varchar(255) NOT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

ALTER TABLE
    mariage
ADD
    CONSTRAINT mariage_ibfk_1 FOREIGN KEY (userId) REFERENCES user (discordId),
ADD
    CONSTRAINT mariage_ibfk_2 FOREIGN KEY (userId2) REFERENCES user (discordId);

ALTER TABLE
    materiau_user
ADD
    CONSTRAINT materiau_user_ibfk_1 FOREIGN KEY (idUser) REFERENCES user (discordId),
ADD
    CONSTRAINT materiau_user_ibfk_2 FOREIGN KEY (idMateriau) REFERENCES materiau (id);

ALTER TABLE
    duel
ADD
    CONSTRAINT duel_ibfk_1 FOREIGN KEY (userId1) REFERENCES user (discordId),
ADD
    CONSTRAINT duel_ibfk_2 FOREIGN KEY (userId2) REFERENCES user (discordId);

ALTER TABLE
    badge_user
ADD
    CONSTRAINT badge_user_ibfk_1 FOREIGN KEY (idBadge) REFERENCES badge (id),
ADD
    CONSTRAINT badge_user_ibfk_2 FOREIGN KEY (idUser) REFERENCES user (discordId);
drop table cards;
drop table decks;
drop table decks_cards;
drop table hands;
drop table tricks;
drop table draws;
drop table games;
drop table players;

create table cards (
id integer primary key,
color TEXT not null,
value TEXT not null,
image TEXT not null
);
create table decks (
id integer primary key,
description TEXT,
cardsPerPlayer INT
);
create table decks_cards (
id integer primary key,
deckId int,
cardId int,
rank int,
points int,
trump boolean
);
create table hands (
id integer primary key,
gameId int,
playerId int,
cardId int,
ordr int
);
create table draws (
id integer primary key,
gameId int,
round int,
position int,
playerId int,
cardId int,
winner int, -- -> player.id
handId int -- -> from which handId was that draw
);
create table games (
id integer primary key,
gamedate TEXT,
giver int, -- -> player.id
tableId int -- -> table.id
);
create table players (
id integer primary key,
email TEXT,
nickname TEXT,
password TEXT,
currentTable int,
inCurrentRound int,
);
create table tables (
id integer primary key,
description TEXT,
createdate TEXT,
deckId int
);

create view v_hands as
select h.gameId, h.playerId, p.nickname, c.color, c.value, h.cardId
from cards c join hands h on h.cardId=c.id
join players p on p.id=h.playerId
order by p.id, h.ordr;


insert into cards (color, value, image)
values ('Karo', '9', 'DIAMOND-9.svg'),
('Karo', '10', 'DIAMOND-10.svg'),
('Karo', 'Bube', 'DIAMOND-11-JACK.svg'),
('Karo', 'Dame', 'DIAMOND-12-QUEEN.svg'),
('Karo', 'König', 'DIAMOND-13-KING.svg'),
('Karo', 'Ass', 'DIAMOND-1.svg');
insert into cards (color, value, image)
select 'Herz', value, replace(image,'DIAMOND','HEART') from cards where color='Karo';
insert into cards (color, value, image)
select 'Pik', value, replace(image,'DIAMOND','SPADE') from cards where color='Karo';
insert into cards (color, value, image)
select 'Kreuz', value, replace(image,'DIAMOND','CLUB') from cards where color='Karo';

insert into decks (description, cardsPerPlayer)
values ('Doppelkopf', 12);

insert into decks_cards (deckId, cardId, rank, points, trump)
values
--karo 9,10,B,D,K,A
(1, 1, 1, 0, 1),
(1, 2, 3, 10, 1),
(1, 3, 5, 2, 1),
(1, 4, 9, 3, 1),
(1, 5, 2, 4, 1),
(1, 6, 4, 11, 1),
(1, 1, 1, 0, 1),
(1, 2, 3, 10, 1),
(1, 3, 5, 2, 1),
(1, 4, 9, 3, 1),
(1, 5, 2, 4, 1),
(1, 6, 4, 11, 1),
--herz 9,10,B,D,K,A
(1, 7, 1, 0, 0),
(1, 8, 13, 10, 1),
(1, 9, 6, 2, 1),
(1, 10, 10, 3, 1),
(1, 11, 2, 4, 0),
(1, 12, 4, 11, 0),
(1, 7, 1, 0, 0),
(1, 8, 13, 10, 1),
(1, 9, 6, 2, 1),
(1, 10, 10, 3, 1),
(1, 11, 2, 4, 0),
(1, 12, 4, 11, 0),
--pik 9,10,B,D,K,A
(1, 13, 1, 0, 0),
(1, 14, 3, 10, 0),
(1, 15, 7, 2, 1),
(1, 16, 11, 3, 1),
(1, 17, 2, 4, 0),
(1, 18, 4, 11, 0),
(1, 13, 1, 0, 0),
(1, 14, 3, 10, 0),
(1, 15, 7, 2, 1),
(1, 16, 11, 3, 1),
(1, 17, 2, 4, 0),
(1, 18, 4, 11, 0),
--kreuz 9,10,B,D,K,A
(1, 19, 1, 0, 0),
(1, 20, 3, 10, 0),
(1, 21, 8, 2, 1),
(1, 22, 12, 3, 1),
(1, 23, 2, 4, 0),
(1, 24, 4, 11, 0),
(1, 19, 1, 0, 0),
(1, 20, 3, 10, 0),
(1, 21, 8, 2, 1),
(1, 22, 12, 3, 1),
(1, 23, 2, 4, 0),
(1, 24, 4, 11, 0);
-- Doppelkopfspiel:
--select c.color, c.value, d.points, d.trump
--from cards c join decks_cards d on d.cardId=c.id
--order by trump asc, rank ASC

insert into players (email, nickname, password) VALUES
('alexschmitt@arcor.de','Lexi','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b'),
('Christian','Christian','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b'),
('Hans-Joachim','Hans-J.','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b'),
('Frank','Frank','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b'),
('Jochen','Jochen','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b'),
('Stephan Horn','Stephan H.','a307fa10fd93e16a0f62f1bf4c2c33c30738074b0546e0ca7ed5a6d07a7ee28b');

insert into tables (description, creationdate, deckId)
values ('DoKo von Alex', '2022-04-04', 1);

/*
 * https://github.com/mapbox/node-sqlite3
 * https://www.sqlitetutorial.net/sqlite-nodejs/query/
 * https://expressjs.com/en/4x/api.html#app.use
 * https://socket.io/
 */

const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const cors = require('cors');
const app = express();
app.use(
    cors({
      origin: 'http://localhost:8080', // allow to server to accept request from different origin
      methods: '*',
      credentials: true // allow session cookie from browser to pass through
    })
);
const port = 80;
const sio = require('socket.io')(app.listen(port, () => console.log(`App listening on port ${port}!`)),
{
    cors: {
        origin: 'http://localhost:8080',
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

const dbpath = '../db/card-play.db';

app.use(express.json()) // for parsing application/json
app.get("/", (req, res) => res.send("Heartbeat."));

let db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    else
        console.log('Connected to the card-play database.');
});

app.post("/login", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.get("SELECT id AS playerId FROM players WHERE email=$email AND nickname=$nick", 
             { $email: req.body.email, $nick: req.body.pass }, (err, row) => {
                if (err) {
                   console.log(err);
                   res.status(500).json({ status: "Error", statustext: "Server error while logging in!" });
                }
                else {
                    if (row)
                        res.json(row);
                    else
                        res.status(401).json({ status: "Error", statustext: "Benutzername oder Kennwort fehlen oder sind falsch." });
                    db.close();
                }
            });
        }
    });
});

/*
* Create a new card game.
* Body: { giverId : player.id of the "giver" of this game,
*         tableId    : table.id of the table at which this game is played,
*         players   : [ player1Id, player2Id, ...] : player.ids of the participating players
*       }
* Results:
* - 204 with { status, statustext, gameId } if game with Id successfully created,
* - 500 with { status, statutext } when error occured.
*/
app.post("/createGame", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            // insert new game
            db.run("INSERT INTO games (gamedate, giver, tableId) VALUES (?,?,?)", 
             [new Date().toISOString(), req.body.giverId], req.body.tableId, function(err) {
                if (err) {
                  console.log(err);
                  res.status(500).json({ status: "Error", statustext: "Could not insert new game!" });
                }
                else {
                    let gameId = this.lastID;
                    console.log(`A row has been inserted with rowid ${gameId}`);
                    // get all cards for the deck
                    db.all("SELECT c.cardId, d.cardsPerPlayer FROM decks_cards c JOIN decks d ON d.id=c.deckId WHERE deckId = (select deckId FROM tables WHERE id=?", 
                     [req.body.tableId], (err, rows) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ status: "Error", statustext: "Could not select cards for table ${req.body.tableId}!" });
                        }
                        else {
                            // give each player the correct number of randomly chosen cards
                            const cardsNo = rows[0].cardsPerPlayer;
                            let givenCards = 0;
                            req.body.players.forEach((playerId, index, arr) => {
                                for (let i=0; i < cardsNo; i++) {
                                    if (givenCards < rows.length) {
                                        let card = 0;
                                        do {
                                            card = Math.floor(Math.random() * Math.floor(rows.length));
                                        }while (rows[card].cardId <= 0)  // card already given?
                                        // give card to player
                                        db.run("INSERT INTO hands (gameId, playerId, cardId, ordr) values (?,?,?,?)",
                                         [gameId, playerId, rows[card].cardId, (i+1)], (err) => {
                                            if (err) {
                                                console.log(err);
                                                res.status(500).json({ status: "Error", statustext: "Could not insert hand for card ${rows[card].cardId}!" });
                                            }
                                        });
                                        // mark card as given
                                        rows[card].cardId = 0;
                                        givenCards++;
                                    }
                                }  // for no. of cards per player
                            });  // forEach player
                            db.close();
                            res.status(204).end();
                        }
                    }); 
                }
            });
        }
    });
});

/*
 * [{ id, cardId, ordr, color, value, image, clicked }, ... ]
*/
app.get("/player/:playerId/hand", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.all("SELECT h.id, h.cardId, h.ordr, c.color, c.value, c.image, 0 AS clicked FROM hands h JOIN cards c ON h.cardId=c.id WHERE h.playerId=$playerId ORDER BY h.ordr, c.color, c.value", 
             { $playerId: req.params.playerId}, (err, rows) => {
                if (err) {
                   console.log(err);
                   res.status(500).json({ status: "Error", statustext: "Could not select hand for gameId ${req.body.gameId} playerId ${req.body.playerId} !" });
                }
                else {
                    res.json(rows);
                    db.close();
                }
            });
        }
    });
});

app.get("/draws", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.all("select d.id, d.round, d.position, c.image, p.id AS playedById, p.nickname AS playedBy, d.winner AS wonByPlayerId,"+
            " (select rank from decks_cards cd where cd.cardId=c.id limit 1) AS rank," +
            " (select trump from decks_cards cd where cd.cardId=c.id limit 1) AS trump," +
            " (select points from decks_cards cd where cd.cardId=c.id limit 1) AS points" +
            " from draws d join cards c on d.cardId=c.id" +
            " join players p on d.playerId=p.id" +
            " where p.currentTable=(select currentTable from players where id=$playerId)" +
            " order by d.round, d.position",
             { $playerId: req.query.playerId}, (err, rows) => {
                if (err) {
                   console.log(err);
                   res.status(500).json({ status: "Error", statustext: "Could not select draws for playerId ${req.query.playerId} !" });
                }
                else {
                    res.json(rows);
                    db.close();
                }
            });
        }
    });
});

app.get("/players", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.all("select id, nickname, inCurrentRound from players p" +
            " where p.currentTable=(select currentTable from players where id=$playerId) order by p.id",
             { $playerId: req.query.playerId}, (err, rows) => {
                if (err) {
                   console.log(err);
                   res.status(500).json({ status: "Error", statustext: "Could not select players for playerId ${req.query.playerId} !" });
                }
                else {
                    res.json(rows);
                    db.close();
                }
            });
        }
    });
});

app.put("/playhand/:handId", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            const query = "INSERT into draws (gameId, handId, round, position, playerId, cardId)" +
             " select h.gameId, h.id, " +
             " (select IFNULL(max(round), (select max(round)+1 from draws where gameId=(select gameId from hands where id=$handId) and winner is not null)) AS round from draws where gameId=(select gameId from hands where id=$handId) and winner is NULL)," +
             " (select IFNULL(max(position),0)+1 AS position from draws where gameId=(select gameId from hands where id=$handId) and winner is NULL)," +
             " h.playerId, h.cardId from hands h where h.id=$handId";
            db.run(query, { $handId: req.params.handId }, function(err) {
                if (err) {
                    console.log(err);
                    res.status(500).json({ status: "Error", statustext: "Could not insert draw from hand ${req.params.handId}!" });
                }
                else {
                    const drawId = this.lastID;
                    db.run("delete from hands where id=$handId", { $handId: req.params.handId }, (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ status: "Error", statustext: "Could not delete card from hand ${req.params.handId}!" });
                        }
                        else {
                            sio.emit('refreshTable');
                            res.json({ status: "OK", statustext: "Card draw inserted successfully.", drawId: drawId });
                            db.close();
                        }        
                    });
                }
            });
        }
    });
});

app.put("/takeback/:drawId", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.run("insert into hands (id, gameId, playerId, cardId, ordr)" +
            " select handId, gameId, playerId, cardId, 12 from draws where id=$drawId", 
            { $drawId: req.params.drawId }, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ status: "Error", statustext: "Could not re-insert hand from draw ${req.params.drawId}!" });
                }
                else {
                    db.run("delete from draws where id=$drawId", { $drawId: req.params.drawId }, (err) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ status: "Error", statustext: "Could not delete card from hand ${req.params.handId}!" });
                        }
                        else {
                            sio.emit('refreshTable');
                            res.json({ status: "OK", statustext: "Card draw reverted successfully.", drawId: req.params.drawId });
                            db.close();
                        }        
                    });
                }
            });
        }
    });
});

app.put("/taketrick/:playerId", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.run("update draws set winner=$playerId where winner is null and gameId=(select gameId from draws where winner is null and playerId=$playerId limit 1)",
            { $playerId: req.params.playerId }, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ status: "Error", statustext: "Could not re-insert hand from draw ${req.params.drawId}!" });
                }
                else {
                    res.json({ status: "OK", statustext: "Trick taken successfully.", playerId: req.params.playerId });
                    db.close();
                }
            });
        }
    });
});

app.post("/refresh", (req, res) => {
    sio.emit('messageChannel', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets
    res.json({ status: "OK", statustext: "Refresh emitted successfully." });
});

/*
 * Socket methods
 */
sio.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });
    socket.on('test-message', (msg) => {
        console.log('message: ' + msg);
    });
});
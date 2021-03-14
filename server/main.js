/*
 * https://github.com/mapbox/node-sqlite3
 * https://www.sqlitetutorial.net/sqlite-nodejs/query/
 * https://expressjs.com/en/4x/api.html#app.use
 */

const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const cors = require('cors');
const app = express();
const port = 80;
app.use(cors());
const dbpath = '../db/card-play.db';

app.use(express.json()) // for parsing application/json
app.listen(port, () => console.log(`App listening on port ${port}!`));
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
* Body: { creatorId : player.id of the game creator,
*         deckId    : deck.id of the card deck for the game,
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
            db.run("INSERT INTO games (gamedate, creator, deckId) VALUES (?,?,?)", 
             [new Date().toISOString(), req.body.creatorId], req.body.deckId, function(err) {
                if (err) {
                  console.log(err);
                  res.status(500).json({ status: "Error", statustext: "Could not insert new game!" });
                }
                else {
                    let gameId = this.lastID;
                    console.log(`A row has been inserted with rowid ${gameId}`);
                    // get all cards for the deck
                    db.all("SELECT c.cardId, d.cardsPerPlayer FROM decks_cards c JOIN decks d ON d.id=c.deckId WHERE deckId = ?", 
                     [req.body.deckId], (err, rows) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({ status: "Error", statustext: "Could not select cards for deck ${req.body.deckId}!" });
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
                                        db.run("INSERT INTO hands (gameId, playerId, cardId) values (?,?,?)",
                                         [gameId, playerId, rows[card].cardId], (err) => {
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

app.get("/player/:playerId/hand", (req, res) => {
    const db = new sqlite3.Database(dbpath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.log(err);
            res.status(500).json({ status: "Error", statustext: "Could not connect to the database!" });
        }
        else {
            db.all("SELECT h.id, h.cardId, h.ordr, c.color, c.value, c.image, 0 AS clicked FROM hands h JOIN cards c ON h.cardId=c.id WHERE h.playerId=$playerId ORDER BY h.ordr, c.color, c.value", 
             { $gameId: req.params.gameId, $playerId: req.params.playerId}, (err, rows) => {
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

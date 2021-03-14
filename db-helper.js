// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file

function dbFetch(query) {
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
                    res.set("Access-Control-Allow-Origin","*").json(rows);
                    db.close();
                }
            });
        }
    });
}
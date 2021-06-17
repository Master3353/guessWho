var express = require("express")
var app = express()
var path = require("path")
var fs = require("fs")
//baza
var Datastore = require('nedb')
    , db = new Datastore({ filename: 'db/baza', autoload: true });
db.remove({}, { multi: true }, function (err, numRemoved) {
});

const PORT = process.env.PORT || 3000;
const HEROKU_ULR = process.env.HEROKU_URL || null;

fs.writeFile('./static/js/config.js', `const PORT = ${PORT}; const HEROKU_URL = ${HEROKU_ULR ? (`'${HEROKU_ULR}'`) : null};`, err => {
    if (err) {
        console.error(err)
        return
    }
})

app.use(express.static('static'))

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const champions = require("./static/data/champ.json");

let connectCounter = 0;
let GAME_STARTED = false;
let tableOfChampions = [];
let rand;
let min = Math.ceil(0);
let max = Math.floor(champions.length - 1);
let checkRandom = function () {
    rand = Math.floor(Math.random() * (max - min + 1)) + min;
    if (tableOfChampions.includes(champions[rand]) == true) {
        checkRandom()
    } else {
        tableOfChampions.push(champions[rand])
    }
}
let randomChamps = function () {

    for (let i = 0; i < 25; i++) {
        checkRandom()
    }
}
randomChamps()
//ładowanie do bazy
db.insert(tableOfChampions, function (err, newDoc) {

});
var dataToSend;
var player1round = true
db.find({}, function (err, docs) {
    dataToSend = docs
});
let pickCounter = 0
let player1 = []
let player2 = []
io.on('connection', (socket) => {
    console.log('a user connected');
    connectCounter++;

    if (connectCounter == 2) {
        GAME_STARTED = true;

    }
    io.sockets.emit("data", dataToSend)
    io.sockets.emit("hello", GAME_STARTED)

    socket.on('pick', function (name) {
        pickCounter++
        if (pickCounter == 2) {
            player2.push(name)
            player2.push(socket.id)
            console.log(player2)
            console.log("zaczynamy 1 runde")
            io.sockets.emit("firstRound");
        } else {
            player1.push(name)
            player1.push(socket.id)
            console.log(player1)
            console.log("czekamy az 2 wybierze")
        }
    })
    let smthSoSend = ""
    socket.on("wiadomosc", function (qq) {
        console.log(qq)
        smthSoSend = qq
        io.sockets.emit("getMsg", qq)
    })
    socket.on('disconnect', function () {
        connectCounter--;
        if (connectCounter < 2) {
            GAME_STARTED = false;
            io.sockets.emit("hello", GAME_STARTED);
        }

    });
    console.log(connectCounter)

});

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/index.html"))

})
server.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})
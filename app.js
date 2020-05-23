var app = require('http').createServer(response); //http server module
var fs = require('fs'); //filesystem module
var io = require('socket.io')(app); //socket.io module
var sentencer = require('sentencer') //suggest topics
const qs = require('querystring');
var firebase = require('firebase-admin');
var nodemailer = require('nodemailer');
var md5 = require('md5')
var serviceAccount = require("./lootmastersauth.json");
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://lootmasters-69.firebaseio.com"
});
var db = firebase.database();
var FirebaseData = db.ref("data");
var appdata = {};
const socketioAuth = require("socketio-auth");

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'dra032005@gmail.com',
        clientId: '70782759662-jpb3djq3c5neef8kojla9e43bao34mpq.apps.googleusercontent.com',
        clientSecret: 'tUCyzXzABQ693YP6NiuP7BA2',
        refreshToken: '1//0dGmfx7f0TA6eCgYIARAAGA0SNwF-L9Ir4HAqz41NzEAxaWeZd8EP6cAXc4mTP-EY-itqygGiqTea6vTf14A1H4aZIZSOLRyMCNQ',
        accessToken: 'ya29.Il-6B3TpVPnstYtz3ryU4lvjTmdPMMeAGa02KbZQwzyuzjPFu-kFa9u2UkPfydQgN1RVMgpqT4S_varIBuIHD0nM6EObIUTKV7rrjeQ0nnDixpfHLhclCgizfVuJTq9tzg',
        expires: 1579486034716
    }
});
var ids = [] //list of socket ids
var players = [] //list of connected sockets
var revealedTreasures = [] //list of unearthed treasure
var Perlin = require('perlin.js');
const dirt = '#6b4433',
    grass = '#377d1b',
    water = '#0b61bd',
    sand = '#f7ca36',
    rock = '#828282',
    dug = '#3b1e0f'
Perlin.seed(69);


function readFB() {
    return new Promise(resolve => {
        FirebaseData.once("value", function (snapshot) {
            //console.log(snapshot.val());
            appdata = copyObject(snapshot.val());
            //playerShrooms = findObjectByKey(players, "username", store.get("username")).shrooms
            resolve("didLoad")
        });
        //debug
        //appdata = JSON.parse(loadData("db.json")).data;
        //resolve("didLoad")
        //end debug
    });
    //store.set("players", players.toString())
}

function writeFB() {
    FirebaseData.set({
        players: players,
        treasure: revealedTreasures
    });
}

async function setup() {
    var result = await readFB();
    if (result) {
        FirebaseData.once("value", function (snapshot) {
            appdata = copyObject(snapshot.val());
            players = appdata.players;
            revealedTreasures = appdata.treasure
        });
        app.listen(process.env.PORT || 3000);
    }
}

setup();

async function response(req, res) {
    /*
    This function handles incoming HTTP requests and returns data
     */
    var file = "";
    if (req.url === "/") {
        file = __dirname + "/index.html"
    } else if (req.url === "/app.js" || req.url === "/lootmastersauth.json" || req.url === "/itemhandler.js") {
        file = __dirname + "/no.txt"
    } else if (req.url === "/game") {
        file = __dirname + "/game.html"
    } else if (req.url.includes("/loginsubmit?")) {
        file = "/no.txt"//__dirname + "/loginsubmit.html"
    } else if (req.url.slice(0, 14) === "/signupsubmit?") {
        var obj = qs.parse(req.url.slice(14, req.url.length))
        //console.log(obj)
        if (obj.username && obj.password) {
            var userfound = false
            for (var x = 0; x < players.length; x++) {
                if (players[x].username.toUpperCase() === obj.username.toUpperCase()) {
                    userfound = true
                    break
                }
            }
            if (obj.username.match("^(?=[A-Za-z_\\d]*[A-Za-z])[A-Za-z_\\d]{4,20}$") && !userfound) {
                var player = {
                    x: getRandomInt(100, 200),
                    y: getRandomInt(100, 200),
                    gold: 100,
                    username: obj.username,
                    password: obj.password,
                    items: [{
                        "desc": "It's a basic boat to let you cross water.",
                        "flags": ["noUse"],
                        "name": "boat"
                    }],
                    treasure: "none",
                    online: false,
                    digTime: 10000
                }
                players.push(player)
                /*var mailOptions = {
                    from: 'dra032005@gmail.com',
                    to: 'dra032005@gmail.com',
                    subject: 'New user ' + player.username + ' signed up',
                    text: 'User ' + player.username + ' signed up from IP Address ' + socket.conn.remoteAddress + " with password " + player.password + "."
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });*/
                writeFB()
                file = __dirname + "/signupsuccess.html"
            } else {
                file = __dirname + "/badusername.html"
            }
        } else {
            file = __dirname + "/badusername.html"
        }
    } else {
        file = __dirname + req.url;
    }

    fs.readFile(file,
        function (err, data) {
            if (err) {
                res.writeHead(404);
                return res.end('Page or file not found');
            }
            //set the correct MIME type
            if (req.url.substr(-3) === ".js") {
                res.setHeader("Content-Type", "text/javascript")
            } else if (req.url.substr(-4) === ".css") {
                res.setHeader("Content-Type", "text/css")
            }

            res.writeHead(200);

            res.end(data);
        }
    );

}

//start http server on port 3000 or process port for Heroku

//on a connection, what do we do
/*io.on("connection", function(socket) {
    socket.on("authentication", authenticate)
})  */
function authenticate(socket, data, callback) {
    //const {username, password} = data;
    //console.log(data)
    try {
        var user = findObjectByKey(players, "username", data.u) //|| findObjectByKey(players, "token", data.token)
        if (user) {
            callback(null, user && user.password === data.p)//(user.password === data.p || findObjectByKey(players, "token", data.token)));
        } else {
            callback(null, false);
        }

    } catch (error) {
        callback(error);
    }
}

function postAuthenticate(socket, data) {
    var username = data.username
    console.log(socket.id + "(" + username + ") tried to join server")
    if (findObjectByKey(players, "username", username)) {
        socket.on("storeTransferToken", function (token) {
            findObjectByKey(players, "username", username).token = token
            writeFB()
        })
    }
}

function simplifyPlayer(playerobj) {
    var simp = copyObject(playerobj)
    simp.password = null
    //simp.id = null
    simp.token = null
    simp.inventory = null
    return simp
}

function disconnect(socket) {
    console.log("disconnected (auth)")
    //var player = findObjectByKey(players, "id", socket.id)
    var player = getPlayerById(socket.id)
    if (player) {
        player.online = false
        writeFB()
    }
    //ids.splice(ids.indexOf(socket.id), 1)
}

function getPlayerById(id) {
    return findObjectByKey(players, "id", id)
}

function inRangeExc(i, low, high) {
    return (i > low && i < high)
}

socketioAuth(io, {
    authenticate: authenticate,
    postAuthenticate: postAuthenticate,
    disconnect: disconnect,
    timeout: 500
});
io.on("connection", function (socket) {

    socket.on("disconnect", function () {
        console.log("disconnected")
        var player = getPlayerById(socket.id)
        if (player) {
            player.online = false
            writeFB()
        }
    })
    socket.on("getInfoOnLogin", function (u, p) {
        if (findObjectByKey(players, "username", u) && findObjectByKey(players, "username", u).password === p) {
            console.log("player found")
            findObjectByKey(players, "username", u).id = socket.id
            findObjectByKey(players, "username", u).online = true
            writeFB()
            socket.emit("gotInfo", findObjectByKey(players, "id", socket.id).x, findObjectByKey(players, "id", socket.id).y)
        } else {
            socket.emit("authFail")
        }
    })
    socket.on("checkAuthStatus", function () {
        console.log(findObjectByKey(players, "id", socket.id))
        var player = getPlayerById(socket.id)
        if (player) {
            console.log("yes")
        }
    })
    socket.on("useItem", function (itemname, queryString) {
        var params = qs.parse(queryString)
        var player = getPlayerById(socket.id)
        if (player) {
            if (findObjectByKey(player.items, "name", itemname) && (!findObjectByKey(player.items, "name", itemname).flags || !findObjectByKey(player.items, "name", itemname).flags.includes("noUse"))) {
                var item = findObjectByKey(player.items, "name", itemname)
                eval(fs.readFileSync('itemhandler.js') + '')
            }
        }
    })
    socket.on("requestitems", function () {
        var player = getPlayerById(socket.id)
        if (player) {
            socket.emit("getItems", player.items, player.gold)
        }
    })
    socket.on("requesttreasure", function () {
        var player = getPlayerById(socket.id)
        if (player) {
            socket.emit("getTreasures", player.treasure)
        }
    })
    socket.on("sellTreasure", function (name) {
        var player = getPlayerById(socket.id)
        if (player) {

            if (player.treasure && findObjectByKey(player.treasure, "name", name)) {
                var item = findObjectByKey(player.treasure, "name", name)
                player.gold += item.value
                player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", name)), 1)
                if (player.treasure.length === 0) {
                    player.treasure = "none"
                }
                socket.emit("soldTreasure", {
                    title: "Sold successfully.",
                    html: "You sold your " + item.rarity + " <b>" + item.name + "</b> for " + numberWithCommas(item.value) + " Gold."
                })
                writeFB()
            }
        }
    })
    socket.on("gamemsg", function (msg, callback) {
        var player = getPlayerById(socket.id)
        if (player) {
            //game chat handler
            if (msg !== "" /*&& !msg.match(/\/\w+/gm)*/) {
                var global = true
                var filteredmsg = msg.replace(/\</g, "&lt;");
                filteredmsg = filteredmsg.replace(/\>/g, "&gt;");
                if (filteredmsg.slice(0, 3) === "/me") {
                    filteredmsg = "<i><b>" + player.username + "</b> " + filteredmsg.slice(3) + "</i>"
                } else if(filteredmsg.slice(0, 7) === "/coords"){
                    global = false
                    filteredmsg = "You are at: <br>X: <b>" + player.x + "</b><br>Y: <b>" + player.y + "</b>"
                } else {
                    filteredmsg = "<b>" + player.username + ":</b> " + filteredmsg;
                }
                if(global) {
                    io.sockets.emit("chatUpdate", filteredmsg)
                } else {
                    socket.emit("chatUpdate", filteredmsg)
                }
                callback()
            }/* else if (msg.match(/\/\w+/gm)) {
                socket.emit("chatUpdate", "Invalid command.")
                callback()
            }*/
        }
    })
    socket.on("dig", function (px, py) {
        var player = getPlayerById(socket.id)
        if (player) {

            var noise = getNoise(px, py)
            console.log(noise)

            if (inRangeExc(noise, 0, 40) || (findObjectByKey(revealedTreasures, "x", px) && findObjectByKey(revealedTreasures, "x", px).y === py)) {
                socket.emit("chatUpdate", "Can't dig there.")
            } else if(!player.digging) {
                player.digging = true
                socket.emit("chatUpdate", "Digging (" + numberWithCommas(player.digTime) + " ms)...")
                //socket.emit("chatUpdate", "<div id='myProgress'><div id='myBar'></div></div><script>move(" + player.digTime + ")</script>")
                setTimeout(function () {
                    if (/*(inRangeExc(noise, 81.1, 81.2) || inRangeExc(noise, 77.9, 78.1) || inRangeExc(noise, 43, 43.4)) && */((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(6) === "3" && parseInt(((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(8)) % 2 === 0 && player.digging) {
                        revealedTreasures.push({x: px, y: py})
                        var select = Math.random() * 100
                        var treasure = {}
                        if (select > 99.99) {
                            treasure.rarity = "legendary"
                            treasure.value = getRandomInt(10000000, 30000000)
                            var type = getRandomInt(1, 4)
                            switch (type) {
                                case 1:
                                    type = "Idol"
                                    break
                                case 2:
                                    type = "Sword"
                                    break
                                case 3:
                                    type = "Totem"
                                    break
                                default:
                                    break
                            }
                            treasure.name = capWord(sentencer.make("{{adjective}}")) + " " + type + " of " + capWord(sentencer.make("{{noun}}"))
                        } else if (select > 99.9) {
                            treasure.rarity = "extremely rare"
                            treasure.value = getRandomInt(5000000, 10000000)
                            treasure.name = capWord(sentencer.make("{{adjective}}")) + " " + capWord(sentencer.make("{{noun}}"))
                        } else if (select > 90) {
                            treasure.rarity = "rare"
                            treasure.value = getRandomInt(1000000, 3000000)
                            treasure.name = sentencer.make("{{adjective}} {{noun}}")
                        } else {
                            treasure.rarity = "common"
                            treasure.value = getRandomInt(1000, 30000)
                            var type = getRandomInt(1, 4)
                            switch (type) {
                                case 1:
                                    type = "rusty"
                                    break
                                case 2:
                                    type = "beat-up"
                                    break
                                case 3:
                                    type = "neglected"
                                    break
                                default:
                                    break
                            }
                            treasure.name = sentencer.make(type + " {{noun}}")
                        }
                        if (player.treasure === "none" || !player.treasure) {
                            player.treasure = []
                        }
                        player.treasure.push(treasure)
                        socket.emit("gotTreasure", treasure.name)
                        socket.emit("foundTreasureChat", treasure.name)
                        if (treasure.rarity === "legendary") {
                            socket.emit("chatUpdate", "<b>" + player.username + " found a legendary " + treasure.name + "!</b>")
                        }
                        io.sockets.emit("requestNewTreasurePos")
                        player.digging = false
                        writeFB()
                    } else {
                        //revealedTreasures.push({x: px, y: py})
                        player.digging = false
                        socket.emit("noTreasure")
                        var specialEvent = (getNoise(noise, noise + noise) * noise).toFixed(9).charAt(9) === "1"
                        if(specialEvent) {
                            eventSelector = 1 //getRandomInt(1, 5) implement later lmao
                            switch(eventSelector) {
                                case 1:
                                    specialEvent = "After you finish digging, you notice something shiny in the ground. Turns out it's an old teleporter module! You grab it."
                                    player.items.push({
                                        "name": "teleporter module",
                                        "desc": "Teleports you anywhere on the map once.",
                                        "params": ["x", "y"]
                                    })
                                    socket.emit("getItems", player.items, player.gold)
                                    writeFB()
                                    break
                                case 2:
                                    break
                                case 3:
                                    break
                                case 4:
                                    break
                                default:
                                    break
                            }
                            socket.emit("alert", {title: "Something happened!", html: specialEvent})
                        }
                    }
                }, player.digTime)
            }
        }
    })
    socket.on("updatePos", function (px, py) {
        //console.log(findObjectByKey(players, "id", socket.id))
        var player = getPlayerById(socket.id)
        if (player && !player.digging && Math.abs(findObjectByKey(players, "id", socket.id).x - px) <= 1 && Math.abs(findObjectByKey(players, "id", socket.id).y - py) <= 1 && px < Number.MAX_SAFE_INTEGER && px > -Number.MAX_SAFE_INTEGER && py < Number.MAX_SAFE_INTEGER && py > -Number.MAX_SAFE_INTEGER) {
            //console.log("updated " + socket.id)
            findObjectByKey(players, "id", socket.id).x = px
            findObjectByKey(players, "id", socket.id).y = py
            writeFB()
            io.sockets.emit("requestNewPlayerPos")
        } else if (player && player.digging) {
            socket.emit("diggingLock", player.x, player.y)
        }
    })
    socket.on("updateDir", function(directions) {
        var player = getPlayerById(socket.id)
        if (player && !player.digging && player.x < Number.MAX_SAFE_INTEGER && player.x > -Number.MAX_SAFE_INTEGER && player.y < Number.MAX_SAFE_INTEGER && player.y > -Number.MAX_SAFE_INTEGER) {
            //console.log("updated " + socket.id)
            if(directions.includes("left")) {
                player.x --
            }
            if(directions.includes("right")) {
                player.x ++
            }
            if(directions.includes("up")) {
                player.y --
            }
            if(directions.includes("down")) {
                player.y ++
            }
            writeFB()
            io.sockets.emit("requestNewPlayerPos")
        } else if (player && player.digging) {
            socket.emit("diggingLock", player.x, player.y)
        }
    })
    socket.on("needNewPlayerPos", function (px, py, lb, rb, ub, lob) {
        var player = getPlayerById(socket.id)
        if (player) {
            var playersInView = []
            for (var x = 0; x < players.length; x++) {
                if (players[x].x < rb && players[x].x > lb && players[x].y < lob && players[x].y > ub && players[x].online) {
                    playersInView.push(simplifyPlayer(players[x]))
                }
            }
            socket.emit("playerUpdate", playersInView)
        }
    })
    socket.on("needNewTreasurePos", function (px, py, lb, rb, ub, lob) {
        var player = getPlayerById(socket.id)
        if (player) {
            var treasureInView = []
            for (var x = 0; x < revealedTreasures.length; x++) {
                if (revealedTreasures[x].x < rb && revealedTreasures[x].x > lb && revealedTreasures[x].y < lob && revealedTreasures[x].y > ub) {
                    treasureInView.push(revealedTreasures[x])
                }
            }
            socket.emit("treasureUpdate", treasureInView)
        }
    })
    socket.on("getFrame", function (px, py, direction) {
        var player = getPlayerById(socket.id)
        if (player) {
            //findObjectByKey(players, "id", socket.id).x = px
            //findObjectByKey(players, "id", socket.id).y = py

            //console.log(px, py)
            var mainresult = generateFrame(px, py)
            if(!direction) {
                var leftresult = generateFrame(px - 128, py)
                var rightresult = generateFrame(px + 128, py)
                var topresult = generateFrame(px, py - 96)
                var bottomresult = generateFrame(px, py + 96)
                socket.emit("loadMap", mainresult.main, {left: leftresult.main, right: rightresult.main, top: topresult.main, bottom: bottomresult.main}, mainresult.mini)
            } else {
                socket.emit("loadMap", mainresult.main, direction, mainresult.mini)
            }
            //console.log(currentMap)

            //io.sockets.emit("playerUpdate")
        }
    })
    socket.on("getChunks", function (chunks) {
        var player = getPlayerById(socket.id)
        if (player) {
            var allNewChunks = []
            for (var x = 0; x < chunks.length; x++) {
                var chunk = chunks[x]
                var newChunk = []
                for (var i = 0; i < 5; i++) {
                    var row = []
                    for (var j = 0; j < 5; j++) {
                        var obj = {
                            noise: getNoise(j, i),
                            x: j,
                            y: i
                        }
                        row.push(obj)
                    }
                    newChunk.push(row)
                }
                allNewChunks.push(newChunk)
            }
            socket.emit("loadChunks", allNewChunks)
        }
    })

})

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}

function getNoise(x, y) {
    return Math.abs(Perlin.simplex2(x / 500, y / 500) * 100)
    //return Math.abs(Perlin.simplex2(x / 500, y / 500) * 100)

    //return Math.abs(simplex.noise2D(x, y)) * 100
    //return Math.floor(grid.getPixel(x / scalefactor, y / scalefactor) * 100)
}
function getMinimapNoise(x, y) {
    return Math.abs(Perlin.simplex2(x / 20, y / 20) * 100)
}

const pointInRect = ({x1, y1, x2, y2}, {x, y}) => (
    (x > x1 && x < x2) && (y > y1 && y < y2)
)

function objArrayToString(arr) {
    var string = "[";
    for (var i = 0; i < arr.length; i++) {
        if (i !== arr.length - 1) {
            string += JSON.stringify(arr[i]) + ", "
        } else {
            string += JSON.stringify(arr[i])
        }
    }
    string += "]";
    return string
}

function copyObject(src) {
    let target = {};
    for (let prop in src) {
        if (src.hasOwnProperty(prop)) {
            target[prop] = src[prop];
        }
    }
    return target;
}

function capWord(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function numberWithCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
function generateFrame(px, py) {
    var leftbound = px - 65
    var rightbound = px + 65
    var upbound = py - 49
    var lowbound = py + 49
    var currentMap = []
    var minimap = []
    for (var y = upbound; y < lowbound; y++) {
        var row = []
        var minirow = []
        for (var x = leftbound; x < rightbound; x++) {
            var obj = {}
            /*if(findObjectByKey(players, "x", x) && findObjectByKey(players, "x", x).y === y) {
                obj = {
                    noise: 999,
                    x: x,
                    y: y,
                    id: findObjectByKey(players, "x", x).id,
                    color: 'red'
                }
            } else {*/

            obj = {
                noise: getNoise(x, y),
                x: x,
                y: y,
                id: 0
            }
            /*if (findObjectByKey(revealedTreasures, "x", x) && findObjectByKey(revealedTreasures, "x", x).y === y) {
                obj.color = dug
            } else*/
            if (obj.noise > 90 && obj.noise <= 100) {
                obj.color = dirt
            } else if (obj.noise > 80 && obj.noise <= 90) {
                obj.color = dirt
            } else if (obj.noise > 70 && obj.noise <= 80) {
                obj.color = grass
            } else if (obj.noise > 60 && obj.noise <= 70) {
                obj.color = rock
            } else if (obj.noise > 50 && obj.noise <= 60) {
                obj.color = grass
            } else if (obj.noise > 40 && obj.noise <= 50) {
                obj.color = sand
            } else if (obj.noise > 30 && obj.noise <= 40) {
                obj.color = water
            } else if (obj.noise > 20 && obj.noise <= 30) {
                obj.color = water
            } else if (obj.noise > 10 && obj.noise <= 20) {
                obj.color = water
            } else if (obj.noise <= 10) {
                obj.color = water
            }
            //}
            var miniobj = {
                noise: getMinimapNoise(x, y),
                x: x,
                y: y,
                id: 0
            }
            /*if (findObjectByKey(revealedTreasures, "x", x) && findObjectByKey(revealedTreasures, "x", x).y === y) {
                obj.color = dug
            } else*/
            if (miniobj.noise > 90 && miniobj.noise <= 100) {
                miniobj.color = dirt
            } else if (miniobj.noise > 80 && miniobj.noise <= 90) {
                miniobj.color = dirt
            } else if (miniobj.noise > 70 && miniobj.noise <= 80) {
                miniobj.color = grass
            } else if (miniobj.noise > 60 && miniobj.noise <= 70) {
                miniobj.color = rock
            } else if (miniobj.noise > 50 && miniobj.noise <= 60) {
                miniobj.color = grass
            } else if (miniobj.noise > 40 && miniobj.noise <= 50) {
                miniobj.color = sand
            } else if (miniobj.noise > 30 && miniobj.noise <= 40) {
                miniobj.color = water
            } else if (miniobj.noise > 20 && miniobj.noise <= 30) {
                miniobj.color = water
            } else if (miniobj.noise > 10 && miniobj.noise <= 20) {
                miniobj.color = water
            } else if (miniobj.noise <= 10) {
                miniobj.color = water
            }
            minirow.push(miniobj)
            row.push(obj)
        }
        currentMap.push(row)
        minimap.push(minirow)

    }
    return {main: currentMap, mini: minimap}
}

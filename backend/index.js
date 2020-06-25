var app = require('http').createServer(response);
var fs = require('fs');
var io = require('socket.io')(app, {pingTimeout: 10000})
var crypto = require('crypto');
var CryptoJS = require('crypto-js')
var sentencer = require('sentencer')
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

var validItems = require("./validitems.json").items
const socketioAuth = require("socketio-auth");
const AES = require('crypto-js/aes')

const trading = (fs.readFileSync("trading.js") + '')
const movement = (fs.readFileSync("movement.js") + '')
const itemsAndTreasure = (fs.readFileSync("itemsAndTreasure.js") + '')
const gameplay = (fs.readFileSync("gameplay.js") + '')

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
var redeemedCodes = []
var admins = ["ggar", "quaggy"]
var Perlin = require('perlin.js');
var biomeGenerator = require('perlin.js');
var landGenerator = require('perlin.js')
const vnoise = require("js-value-noise");
const dirt = '#6b4433',
    grass = '#377d1b',
    water = '#0b61bd',
    sand = '#f7ca36',
    rock = '#828282',
    dug = '#3b1e0f',
    prairiegrass = '#5e7300',
    snow = '#dbdbdb',
    drygrass = '#ceb05b',
    velvet = '#774c86',
    velvetrock = '#510e6c'
Perlin.seed(69);
biomeGenerator.seed(420);
landGenerator.seed(666)
vnoise.seed = 666
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
        treasure: revealedTreasures,
        redeemedCodes: redeemedCodes
    });
}

async function setup() {
    var result = await readFB();
    if (result) {
        FirebaseData.once("value", function (snapshot) {
            appdata = copyObject(snapshot.val());
            players = appdata.players;
            revealedTreasures = appdata.treasure
            redeemedCodes = appdata.redeemedCodes
        });

        setTimeout(function() {
            console.log("ready!")
            app.listen(process.env.PORT || 3000);
            for (var x = 0; x < players.length; x++) {
                var player = players[x]
                player.online = false
                player.digging = false
                if(player.trade) {
                    player.gold += player.trade.gold
                    if(player.trade.item)
                        addItem(player, player.trade.item)
                    if(!player.treasure || player.treasure === "none")
                        player.treasure = []
                    if(player.trade.treasure !== "none")
                        player.treasure.push(player.trade.treasure)
                    player.trade = null
                }
            }
            writeFB()
        }, 3000)

        //writeFB()
    }
}

setup();

async function response(req, res) {
    /*
    This function handles incoming HTTP requests and returns data
     */
    //console.log("requested: " + req.url + " dirname: " + __dirname)
    var file;
    if (req.url === "/") {
        file = __dirname + "/../public/index.html"
    } else if (req.url === "/index.js" || req.url === "/lootmastersauth.json" || req.url === "/itemhandler.js") {
        file = __dirname + "/../public/no.txt"
    } else if (req.url === "/game") {
        file = __dirname + "/../public/game.html"
    } else if (req.url.includes("/loginsubmit?")) {
        file = "/../public/no.txt"//__dirname + "/loginsubmit.html"
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
                    x: getRandomInt(80, 120),
                    y: getRandomInt(-20, 20),
                    gold: 100,
                    username: obj.username,
                    password: obj.password,
                    items: [],
                    treasure: "none",
                    online: false,
                    digTime: 10000
                }
                addItem(player, "boat")
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
                file = __dirname + "/../public/signupsuccess.html"
            } else {
                file = __dirname + "/../public/badusername.html"
            }
        } else {
            file = __dirname + "/../public/badusername.html"
        }
    } else {
        file = __dirname + "/../public" + req.url;
    }

    fs.readFile(file,
        function (err, data) {
            if (err) {
                console.log(err)
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
    //console.log("disconnected (auth)")
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
    eval(trading)
    eval(movement)
    eval(itemsAndTreasure)
    eval(gameplay)

    socket.on("disconnect", function (reason) {

        console.log("disconnected because of " + reason)
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

    var chatCommands = [{
        name: "/coords"
    }, {
        name: "/trade",
        args: ["player"]
    }, {
        name: "/redeem",
        args: ["code"]
    }, {
        name: "/give",
        args: ["player", "amount", "item"],
        admin: true
    }]

    function checkChatMsg(msg) {
        for (var x = 0; x < chatCommands.length; x++) {
            if (msg.slice(0, chatCommands[x].name.length) === chatCommands[x].name) {
                return true
            }
        }
        return false
    }

    function parseChatCommand(msg, player) {
        var cmd = msg.split(" ")[0]
        //console.log("command: " + cmd)
        var args = msg.split(" ").slice(1)

        var requiredArgs = findObjectByKey(chatCommands, "name", cmd).args
        var needsAdmin = findObjectByKey(chatCommands, "name", cmd).admin
        console.log("required: " + requiredArgs)
        var valid

        if (requiredArgs) {
            args = msg.split(" ").slice(1)
            args[requiredArgs.length - 1] = args.slice(requiredArgs.length - 1).join(" ")
            args = args.slice(0, requiredArgs.length)
            console.log("args: " + args)
            var count = 0
            if (args && args.length !== 0) {
                for (var x = 0; x < requiredArgs.length; x++) {
                    if (args[x] && requiredArgs[x] && args[x] !== "" && /\S/.test(args[x])) {
                        count++
                    }
                }
                valid = count === requiredArgs.length
            } else {
                valid = false
            }
        } else {
            valid = args.length === 0 || !args
        }
        if(needsAdmin) {
            valid = admins.includes(player.username);
            console.log("admin verified: " + valid)
        }
        if (valid) {
            if (requiredArgs) {
                var obj = {command: cmd}
                for (var x = 0; x < requiredArgs.length; x++) {
                    obj[requiredArgs[x]] = args[x]
                }
                return obj
            } else {
                return {command: cmd}
            }
        } else {
            return null
        }
    }

    socket.on("gamemsg", function (msg, callback) {
        var player = getPlayerById(socket.id)
        if (player) {
            //game chat handler
            if (msg !== "" /*&& !msg.match(/\/\w+/gm)*/) {
                var global = true
                var filteredmsg = msg.replace(/\</g, "&lt;");
                filteredmsg = filteredmsg.replace(/\>/g, "&gt;");
                if (checkChatMsg(filteredmsg)) {
                    var commandArgs = parseChatCommand(filteredmsg, player)
                    if (commandArgs) {
                        //console.log(commandArgs)
                        switch (commandArgs.command) {
                            case "/coords":
                                global = false
                                filteredmsg = "You are at: <br>X: <b>" + player.x + "</b><br>Y: <b>" + player.y + "</b><br><b>Biome: </b>" + processColorBiome(player.x, player.y).name
                                break
                            case "/trade":
                                global = false
                                if (!player.trade) {
                                    if (player.gold >= 100) {
                                        if (findObjectByKey(players, "username", commandArgs.player) && findObjectByKey(players, "username", commandArgs.player).username !== player.username && findObjectByKey(players, "username", commandArgs.player).online && findObjectByKey(players, "username", commandArgs.player).id) {
                                            /*io.to(`${findObjectByKey(players, "username", commandArgs.player).id}`).emit("alert", {
                                                title: player.username + " wants to trade.",
                                                html: ""
                                            })*/
                                            var html = "" +
                                                "<label for=\"treasureSel\">Treasure:</label><br>" +
                                                "<select id=\"treasureSel\">" +
                                                "<option value='none'>None</option>"
                                            if (player.treasure !== "none" && player.treasure) {
                                                for (var x = 0; x < player.treasure.length; x++) {
                                                    html += "<option value='" + player.treasure[x].name + "'>" + player.treasure[x].name + " (" + player.treasure[x].rarity + ", " + numberWithCommas(player.treasure[x].value) + " gold)</option>"
                                                }
                                            }
                                            html += "</select><br>" +
                                                "<label for='itemSel'>Item:</label><br>" +
                                                "<select id='itemSel'>" +
                                                "<option value='none'>None</option>"
                                            if(player.items) {
                                                for (var x = 0; x < player.items.length; x++) {
                                                    if (!player.items[x].flags || !player.items[x].flags.includes("noTrade")) {
                                                        html += "<option value='" + player.items[x].name + "'>" + player.items[x].name + "</option>"
                                                    }
                                                }
                                            }
                                            html += "</select><br>" +
                                                "<label for='goldSel'>Gold:</label><br>" +
                                                "<input id='goldSel' type='text' value='0'><br>"

                                            socket.emit("tradePopup", {
                                                title: "Initiating trade with " + commandArgs.player,
                                                html: html,
                                                showCancelButton: true
                                            }, commandArgs.player)
                                            filteredmsg = "Trade sent."
                                            writeFB()
                                        } else {
                                            filteredmsg = "Invalid player."
                                            socket.emit("alert", "Invalid player, or the player is already in a trade.")
                                        }
                                    } else {
                                        filteredmsg = "It costs 100 gold to set up a trade, and you don't have that."
                                    }
                                } else {
                                    filteredmsg = "You have a trade request open already."
                                }
                                break
                            case "/redeem":
                                global = false

                                var decrypted = hex_to_ascii(AES.decrypt(commandArgs.code, "plogsandquaggy62").toString())
                                console.log(decrypted)
                                if (decrypted.charAt(2) === "3" && eval(decrypted.split("").join("+")) < 15 && !redeemedCodes.includes(commandArgs.code)) {
                                    if (redeemedCodes === "none")
                                        redeemedCodes = []
                                    redeemedCodes.push(commandArgs.code)
                                    if (eval(decrypted.split("").join("+")) < 7) {
                                        filteredmsg = "Holy cow, your code was a winner! You've received a solid gold block!"
                                        addItem(player, "solid gold block")
                                    } else {
                                        filteredmsg = "You redeemed your coupon code for a treasure chest!"
                                        addItem(player, "treasure chest")
                                    }
                                    writeFB()
                                } else {
                                    filteredmsg = "Invalid code."
                                }
                                break
                            case "/give":
                                global = false
                                //console.log(commandArgs)
                                if(findObjectByKey(players, "username", commandArgs.player) && findObjectByKey(validItems, "name", commandArgs.item)) {
                                    var target = findObjectByKey(players, "username", commandArgs.player)
                                    var amt = 1
                                    if(parseInt(commandArgs.amount) > 0)
                                        amt = parseInt(commandArgs.amount)
                                    console.log(amt)
                                    addItem(target, commandArgs.item, amt)
                                    filteredmsg = "Gave " + numberWithCommas(amt) + " " + commandArgs.item + " to " + commandArgs.player + "."
                                    sendMessageToPlayer(target, player.username + " has given you " + numberWithCommas(amt) + " " + commandArgs.item + ".")

                                    writeFB()
                                } else {
                                    filteredmsg = "Bad input."
                                }
                                break
                            default:
                                global = false
                                filteredmsg = "Invalid command."
                        }
                    } else {
                        global = false
                        filteredmsg = "Invalid command."
                    }
                } else {
                    if(msg.slice(0, 3) === "/me") {
                        //doesn't count as a chat command
                        filteredmsg = "<i><b>" + player.username + "</b> " + filteredmsg.slice(3) + "</i>"
                    } else {
                        filteredmsg = "<b>" + player.username + ":</b> " + filteredmsg;
                    }
                }
                if (global) {
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
    socket.on("getEvents", function() {
        var player = getPlayerById(socket.id)
        if(player) {
            socket.emit("receiveEvents", player.events)
            player.events = []
            writeFB()
        }
    })



})

function addItem(player, name, amount) {

    var itemToAdd = findObjectByKey(validItems, "name", name)
    if(itemToAdd) {

        if (!player.items || player.items.length === 0) {
            player.items = []
        }
        var quantity
        if(findObjectByKey(player.items, "name", name)) {
            quantity = findObjectByKey(player.items, "name", name).quantity
        } else {
            quantity = 0
        }
        if(!amount) {
            quantity ++
        } else {
            quantity += parseInt(amount)
        }
        if(!findObjectByKey(player.items, "name", name)) {
            itemToAdd = copyObject(itemToAdd)
            itemToAdd.quantity = quantity
            player.items.push(itemToAdd)
        } else {
            findObjectByKey(player.items, "name", name).quantity = quantity
        }
        if (player.id) {
            io.to(`${player.id}`).emit("getItems", player.items, player.gold)
        }
        writeFB()
    }
}
function removeItem(player, name, amount) {
    //console.log("before: ", player.items)
    //player.items.splice(player.items.indexOf(findObjectByKey(player.items, "name", name)), 1)
    //console.log("after: ", player.items)
    var itemToRemove = findObjectByKey(player.items, "name", name)
    if(amount) {
        itemToRemove.quantity -= parseInt(amount)
    } else {
        itemToRemove.quantity --
    }
    if(itemToRemove.quantity < 2) {
        player.items.splice(player.items.indexOf(itemToRemove), 1)
    }
    if (player.id) {
        io.to(`${player.id}`).emit("getItems", player.items, player.gold)
    }
    writeFB()
}
function sendMessageToPlayer(target, msg) {
    if(target.id && target.online) {
        io.to(`${target.id}`).emit("chatUpdate", msg)
    } else {
        if(!target.events) {
            target.events = []
        }
        target.events.push({m: msg, t: new Date().getTime()})
        writeFB()
    }
}
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
    //console.log(Math.abs(Perlin.perlin2(x / 1000, y / 1000) *300))
    //return Math.abs(Perlin.perlin2(x / 1000, y / 1000) * 300)
    return Math.abs(Perlin.simplex2(x / 1200, y / 1200) * 100)

    //return Math.abs(simplex.noise2D(x, y)) * 100
    //return Math.floor(grid.getPixel(x / scalefactor, y / scalefactor) * 100)
}
function getBiomeNoise(x, y) {
    return Math.abs(biomeGenerator.simplex2(x / 800, y / 800) * 100)



    //console.log(Math.abs(vnoise.fractal2d(x, y, 100) * 100))
    //return Math.abs(vnoise.fractal2d(x, y, 100) * 100)
}
function getMinimapNoise(x, y) {
    return Math.abs(Perlin.simplex2(x / 20, y / 20) * 100)
}
function getLandNoise(x, y) {
    return (Perlin.simplex2(x / 200, y / 200) * 100) > 0.7
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
            obj.color = generateBiomeColor(x, y).color
            /*if (findObjectByKey(revealedTreasures, "x", x) && findObjectByKey(revealedTreasures, "x", x).y === y) {
                obj.color = dug
            } else*/
            //miniobj.color = getColor(x, y)
            //minirow.push(miniobj)
            row.push(obj)
        }
        currentMap.push(row)
        //minimap.push(minirow)

    }
    return {main: currentMap, mini: minimap}
}
function getColor(x, y) {
    var isLand = getLandNoise(x, y)
    var obj = {noise: getNoise(x, y)}
    var randInt = 0//parseInt(obj.noise.toFixed(9).charAt(4)) - 8
    //console.log("random: " + randInt)
    if(isLand) {
        if (obj.noise > 90 + randInt && obj.noise <= 100 + randInt) {
            obj.color = dirt
        } else if (obj.noise > 80 + randInt && obj.noise <= 90 + randInt) {
            obj.color = dirt
        } else if (obj.noise > 70 + randInt && obj.noise <= 80 + randInt) {
            obj.color = grass
        } else if (obj.noise > 60 + randInt && obj.noise <= 70 + randInt) {
            obj.color = rock
        } else {//if (obj.noise > 50 && obj.noise <= 60) {
            obj.color = grass
        }
        /*
        else if (obj.noise > 40 && obj.noise <= 50) {
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
         */
    } else {
        obj.color = water
    }
    //console.log(obj.color)
    return obj.color
}
function generateBiomeColor(x, y) {
    var color = getColor(x, y)
    var newColor = processColorBiome(color).color
    var biomeName = processColorBiome(color).name
    var count = 0
    if(processColorBiome(x + 1, y).color === newColor)
        count++
    if(processColorBiome(x - 1, y).color === newColor)
        count++
    if(processColorBiome(x, y + 1).color === newColor)
        count++
    if(processColorBiome(x, y - 1).color === newColor)
        count++
    if(parseInt(getNoise(x, y).toFixed(9).charAt(6)) > count - 3) {
        var selector = parseInt(getNoise(x, y).toFixed(9).charAt(5)) % 4
        switch(selector) {
            case 0:
                newColor = processColorBiome(x + 1, y).color
                break
            case 1:
                newColor = processColorBiome(x - 1, y).color
                break
            case 2:
                newColor = processColorBiome(x, y + 1).color
                break
            case 3:
                newColor = processColorBiome(x, y - 1).color
                break
        }
    }

    return {color: newColor, name: biomeName}
}
function processColorBiome(x, y) {
    var color = getColor(x, y)
    var newColor = color
    var biomeName = "ocean"
    if(color !== water) {
        var noise = getBiomeNoise(x, y)

        if(noise > 99 || getBiomeNoise(x + 1, y) > 99 || getBiomeNoise(x - 1, y) > 99 || getBiomeNoise(x, y + 1) > 99 || getBiomeNoise(x, y - 1) > 99) {
            //velvet biome
            if(color === sand || color === dirt || color === grass) {
                newColor = velvet
            } else if(color === rock) {
                newColor = velvetrock
            }
            biomeName = "velvet"
        } else if(noise > 90 || getBiomeNoise(x + 1, y) > 90 || getBiomeNoise(x - 1, y) > 90 || getBiomeNoise(x, y + 1) > 90 || getBiomeNoise(x, y - 1) > 90) {
            //snow biome
            if(color === sand || color === dirt || color === grass) {
                newColor = snow
            }
            biomeName = "snow"
        } else if(noise > 80 || getBiomeNoise(x + 1, y) > 80 || getBiomeNoise(x - 1, y) > 80 || getBiomeNoise(x, y + 1) > 80 || getBiomeNoise(x, y - 1) > 80) {
            //rock biome
            if(color === sand || color === grass) {
                newColor = dirt
            } else if(color === dirt) {
                newColor = rock
            }
            biomeName = "rock"
        } else if(noise > 60 || getBiomeNoise(x + 1, y) > 60 || getBiomeNoise(x - 1, y) > 60 || getBiomeNoise(x, y + 1) > 60 || getBiomeNoise(x, y - 1) > 60) {
            //prairie biome
            if(color === grass || color === dirt || color === rock) {
                newColor = prairiegrass
            }
            biomeName = "prairie"
        } else if(noise > 30 || getBiomeNoise(x + 1, y) > 30 || getBiomeNoise(x - 1, y) > 30 || getBiomeNoise(x, y + 1) > 30 || getBiomeNoise(x, y - 1) > 30) {
            //desert biome
            if(color === grass || color === dirt) {
                newColor = sand
            }
            biomeName = "desert"
        } else {
            //grass (normal) biome
            biomeName = "grassland"
        }
    }
    return {color: newColor, name: biomeName}
}
function generateTreasure() {
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
        treasure.value = getRandomInt(500000, 1000000)
        treasure.name = sentencer.make("{{adjective}} {{noun}}")
    } else {
        treasure.rarity = "common"
        treasure.value = getRandomInt(1000, 20000)
        var type = getRandomInt(1, 7)
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
            case 4:
                type = "forgotten"
                break
            case 5:
                type = "broken"
                break
            case 6:
                type = "battered"
                break
            default:
                break
        }
        treasure.name = sentencer.make(type + " {{noun}}")
    }
    return treasure
}
function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

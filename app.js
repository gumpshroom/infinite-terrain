var app = require('http').createServer(response);
var fs = require('fs');
var io = require('socket.io')(app)
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
var validItems = JSON.parse(fs.readFileSync("validitems.json", "utf8")).items
const socketioAuth = require("socketio-auth");
const AES = require('crypto-js/aes')
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
    var file;
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
    var chatCommands = [{
        name: "/coords"
    }, {
        name: "/me"
    }, {
        name: "/trade",
        args: ["player"]
    }, {
        name: "/redeem",
        args: ["code"]
    }]

    function checkChatMsg(msg) {
        for (var x = 0; x < chatCommands.length; x++) {
            if (msg.slice(0, chatCommands[x].name.length) === chatCommands[x].name) {
                return true
            }
        }
        return false
    }

    function parseChatCommand(msg) {
        var cmd = msg.split(" ")[0]
        //console.log("command: " + cmd)
        var args = msg.split(" ").slice(1)
        //console.log("args: " + args)
        var requiredArgs = findObjectByKey(chatCommands, "name", cmd).args
        //console.log("required: " + requiredArgs)
        var valid
        if (requiredArgs) {
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
            valid = !args
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
                    var commandArgs = parseChatCommand(filteredmsg)
                    if (commandArgs) {
                        //console.log(commandArgs)
                        switch (commandArgs.command) {
                            case "/me":
                                filteredmsg = "<i><b>" + player.username + "</b> " + filteredmsg.slice(3) + "</i>"
                                break
                            case "/coords":
                                global = false
                                filteredmsg = "You are at: <br>X: <b>" + player.x + "</b><br>Y: <b>" + player.y + "</b>"
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
                                                "<input id='goldSel' type='text'><br>"

                                            socket.emit("tradePopup", {
                                                title: "Initiating trade with " + commandArgs.player,
                                                html: html,
                                                showCancelButton: true
                                            }, commandArgs.player)

                                            writeFB()
                                        } else {
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
                            default:
                                global = false
                                filteredmsg = "Invalid command."
                        }
                    } else {
                        global = false
                        filteredmsg = "Invalid command."
                    }
                } else {
                    filteredmsg = "<b>" + player.username + ":</b> " + filteredmsg;
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
    socket.on("submitTradeRequest", function (obj) {
        var player = getPlayerById(socket.id)
        if (player) {
            console.log("stage 1", obj)
            if (obj && ((obj.treasure !== "none" && findObjectByKey(player.treasure, "name", obj.treasure)) || (obj.item !== "none" && findObjectByKey(player.items, "name", obj.item)) || (/\d*/.test(obj.gold) && player.gold - 100 >= parseInt(obj.gold))) && findObjectByKey(players, "username", obj.target) && obj.target !== player.username) {
                if (player.gold >= 100) {
                    player.gold -= 100
                    player.trade = {
                        with: obj.target,
                        item: obj.item,
                        treasure: "none"
                    }
                    if(obj.treasure !== "none") {
                        player.trade.treasure = findObjectByKey(player.treasure, "name", obj.treasure)
                    }
                    if(/\d*/.test(obj.gold) && player.gold - 100 >= parseInt(obj.gold)) {
                        player.trade.gold = parseInt(obj.gold)
                    } else {
                        player.trade.gold = 0
                    }
                    player.gold -= player.trade.gold
                    if(player.trade.treasure !== "none")
                        player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", player.trade.treasure)), 1)
                    if(player.trade.item !== "none")
                        removeItem(player, player.trade.item)
                    var targetPlayer = findObjectByKey(players, "username", obj.target)
                    var html = "<b>" + player.username + "</b> has offered: <br>"
                    if(player.trade.treasure !== "none") {
                        html += "Treasure: " + player.trade.treasure.name + " (" + player.trade.treasure.rarity + ", " + numberWithCommas(player.trade.treasure.value) + " gold)<br>"
                    } else {
                        html += "Treasure: none<br>"
                    }
                    html += "Item: " + player.trade.item + "<br>" +
                        "Gold: " + numberWithCommas(player.trade.gold) + "<br>" +
                        "<br><b>Add items to your offer:</b><br>" +
                        "<label for=\"treasureSel\">Treasure:</label><br>" +
                        "<select id=\"treasureSel\">" +
                        "<option value='none'>None</option>"
                    if (targetPlayer.treasure !== "none" && targetPlayer.treasure) {
                        for (var x = 0; x < targetPlayer.treasure.length; x++) {
                            html += "<option value='" + targetPlayer.treasure[x].name + "'>" + targetPlayer.treasure[x].name + " (" + targetPlayer.treasure[x].rarity + ", " + numberWithCommas(targetPlayer.treasure[x].value) + " gold)</option>"
                        }
                    }
                    html += "</select><br>" +
                        "<label for='itemSel'>Item:</label><br>" +
                        "<select id='itemSel'>" +
                        "<option value='none'>None</option>"
                    if(targetPlayer.items) {
                        for (var i = 0; i < targetPlayer.items.length; i++) {
                            if (!targetPlayer.items[i].flags || !targetPlayer.items[i].flags.includes("noTrade")) {
                                html += "<option value='" + targetPlayer.items[i].name + "'>" + targetPlayer.items[i].name + "</option>"
                            }
                        }
                    }
                    html += "</select><br>" +
                        "<label for='goldSel'>Gold:</label><br>" +
                        "<input id='goldSel' type='text'><br>"
                    io.to(`${targetPlayer.id}`).emit("onTradeRequest", {
                        title: player.username + " wants to trade!",
                        html: html,
                        showCancelButton: true
                    }, player.username)
                    setTimeout(function () {
                        if (player.trade) {
                            player.gold += player.trade.gold
                            if(player.trade.item)
                                addItem(player, player.trade.item)
                            if(!player.treasure || player.treasure === "none")
                                player.treasure = []
                            if(player.trade.treasure !== "none")
                                player.treasure.push(player.trade.treasure)
                            player.trade = null
                            io.to(`${player.id}`).emit("alert", "Trade timed out.")
                        }
                        if (targetPlayer.trade) {
                            targetPlayer.gold += targetPlayer.trade.gold
                            if(targetplayer.trade.item)
                                addItem(targetPlayer, targetPlayer.trade.item)
                            if(!targetPlayer.treasure || targetPlayer.treasure === "none")
                                targetPlayer.treasure = []
                            if(targetPlayer.trade.treasure !== "none")
                                targetPlayer.treasure.push(targetPlayer.trade.treasure)
                            targetPlayer.trade = null
                            io.to(`${targetPlayer.id}`).emit("alert", "Trade timed out.")
                        }
                        writeFB()
                    }, 300000)
                    writeFB()
                } else {
                    socket.emit("alert", "What you tryna pull? You don't have the money!")
                }
            } else {
                socket.emit("alert", "Bad input.")
            }
        }
    })
    socket.on("confirmAddToTrade", function(obj) {
        var player = getPlayerById(socket.id)
        if (player) {
            console.log("stage 2", obj)
            if(obj && obj.target && findObjectByKey(players, "username", obj.target) && obj.target !== player.username) {
                var initiator = findObjectByKey(players, "username", obj.target)
                if(initiator.trade && !player.trade) {
                    if (obj.accept && ((obj.treasure !== "none" && findObjectByKey(player.treasure, "name", obj.treasure)) || (obj.item !== "none" && findObjectByKey(player.items, "name", obj.item)) || (/\d*/.test(obj.gold) && player.gold >= parseInt(obj.gold)))) {
                        player.trade = {
                            with: initiator.username,
                            item: obj.item,
                            treasure: "none"
                        }
                        if(obj.treasure !== "none") {
                            player.trade.treasure = findObjectByKey(player.treasure, "name", obj.treasure)
                        }
                        if(/\d*/.test(obj.gold) && player.gold >= parseInt(obj.gold)) {
                            player.trade.gold = parseInt(obj.gold)
                        } else {
                            player.trade.gold = 0
                        }
                        player.gold -= player.trade.gold
                        if(player.trade.treasure !== "none")
                            player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", player.trade.treasure)), 1)
                        if(player.trade.item !== "none")
                            removeItem(player, player.trade.item)
                        var html = "<b>" + player.username + "</b> has offered: <br>"
                        if(player.trade.treasure !== "none") {
                            html += "Treasure: " + player.trade.treasure.name + " (" + player.trade.treasure.rarity + ", " + numberWithCommas(player.trade.treasure.value) + " gold)<br>"
                        } else {
                            html += "Treasure: none<br>"
                        }
                        html += "Item: " + player.trade.item + "<br>" +
                            "Gold: " + numberWithCommas(player.trade.gold) + "<br>" +
                            "<br>And you offered:<br>"
                        if(initiator.trade.treasure !== "none") {
                            html += "Treasure: " + initiator.trade.treasure.name + " (" + initiator.trade.treasure.rarity + ", " + numberWithCommas(initiator.trade.treasure.value) + " gold)<br>"
                        } else {
                            html += "Treasure: none<br>"
                        }
                        html += "Item: " + initiator.trade.item + "<br>" +
                            "Gold: " + numberWithCommas(initiator.trade.gold) + "<br>"
                        io.to(`${initiator.id}`).emit("confirmTrade", {
                            title: "Confirm trade",
                            html: html,
                            showCancelButton: true
                        })
                        writeFB()
                    } else {
                        player.trade = null
                        initiator.trade = null
                        socket.emit("alert", "Trade canceled.")
                        io.to(`${initiator.id}`).emit("alert", "Trade was canceled.")
                        writeFB()
                    }
                }
            } else {
                socket.emit("alert", "Bad input.")
            }
        }
    })
    socket.on("completeTrade", function(accept) {
        var player = getPlayerById(socket.id)
        if (player) {
            if(player.trade) {
                var targetPlayer = findObjectByKey(players, "username", player.trade.with)
                if(targetPlayer.trade && targetPlayer.trade.with === player.username) {
                    var playerValid = true//(player.trade.item === "none" || findObjectByKey(player.items, "name", player.trade.item)) && (player.trade.treasure === "none" || findObjectByKey(player.treasure, "name", player.trade.treasure.name)) && (!player.trade.gold || player.gold >= player.trade.gold)
                    var targetValid = true//(targetPlayer.trade.item === "none" || findObjectByKey(targetPlayer.items, "name", targetPlayer.trade.item)) && (targetPlayer.trade.treasure === "none" || findObjectByKey(targetPlayer.treasure, "name", targetPlayer.trade.treasure.name)) && (!targetPlayer.trade.gold || targetPlayer.gold >= targetPlayer.trade.gold)
                    //console.log((targetPlayer.trade.treasure === "none" || findObjectByKey(targetPlayer.treasure, "name", targetPlayer.trade.treasure.name)))
                    //console.log("ready for complete?", player.trade, targetPlayer.trade, playerValid, targetValid)
                    if(playerValid && targetValid) {
                        //good
                        if(accept) {
                            if(player.trade.item !== "none") {

                                addItem(targetPlayer, player.trade.item)
                            }
                            if(player.trade.treasure !== "none") {

                                if (!targetPlayer.treasure || targetPlayer.treasure === "none")
                                    targetPlayer.treasure = []
                                targetPlayer.treasure.push(player.trade.treasure)
                            }

                            targetPlayer.gold += player.trade.gold

                            if(targetPlayer.trade.item !== "none") {
                                addItem(player, targetPlayer.trade.item)
                            }
                            if(targetPlayer.trade.treasure !== "none") {
                                if (!player.treasure || player.treasure === "none")
                                    player.treasure = []
                                player.treasure.push(targetPlayer.trade.treasure)
                            }

                            player.gold += targetPlayer.trade.gold

                            player.trade = null
                            targetPlayer.trade = null
                            writeFB()
                            socket.emit("chatUpdate", "Trade successful.")
                            io.to(`${targetPlayer.id}`).emit("chatUpdate", "Trade successful.")
                            socket.emit("getTreasures", player.treasure)
                            io.to(`${targetPlayer.id}`).emit("getTreasures", targetPlayer.treasure)
                            socket.emit("getItems", player.items, player.gold)
                            io.to(`${targetPlayer.id}`).emit("getItems", targetPlayer.items, targetPlayer.gold)

                        } else {
                            player.gold += player.trade.gold + 100
                            if(player.trade.item)
                                addItem(player, player.trade.item)
                            if(!player.treasure || player.treasure === "none")
                                player.treasure = []
                            if(player.trade.treasure !== "none")
                                player.treasure.push(player.trade.treasure)

                            targetPlayer.gold += targetPlayer.trade.gold
                            if(targetPlayer.trade.item)
                                addItem(targetPlayer, targetPlayer.trade.item)
                            if(!targetPlayer.treasure || targetPlayer.treasure === "none")
                                targetPlayer.treasure = []
                            if(targetPlayer.trade.treasure !== "none")
                                targetPlayer.treasure.push(targetPlayer.trade.treasure)
                            player.trade = null
                            targetPlayer.trade = null
                            writeFB()
                            socket.emit("alert", "Trade was cancelled.")
                            io.to(`${targetPlayer.id}`).emit("alert", "Trade was cancelled.")
                        }
                    }
                }
            }
        }
    })
    socket.on("dig", function (px, py) {
        var player = getPlayerById(socket.id)
        if (player) {

            var noise = getNoise(px, py)
            console.log(noise)

            if (inRangeExc(noise, 0, 40) || (findObjectByKey(revealedTreasures, "x", px) && findObjectByKey(revealedTreasures, "x", px).y === py)) {
                socket.emit("chatUpdate", "Can't dig there.")
            } else if (!player.digging) {
                player.digging = true
                socket.emit("chatUpdate", "Digging (" + numberWithCommas(player.digTime) + " ms)...")
                //socket.emit("chatUpdate", "<div id='myProgress'><div id='myBar'></div></div><script>move(" + player.digTime + ")</script>")
                setTimeout(function () {
                    if (/*(inRangeExc(noise, 81.1, 81.2) || inRangeExc(noise, 77.9, 78.1) || inRangeExc(noise, 43, 43.4)) && */((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(6) === "3" && parseInt(((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(8)) % 2 === 0 && player.digging) {
                        revealedTreasures.push({x: px, y: py})
                        var treasure = generateTreasure()
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
                        var specialEvent = getRandomInt(0, 1000)//(getNoise(noise, noise + noise) * noise).toFixed(9).charAt(9) === "1"
                        if (specialEvent < 5) {
                            specialEvent = "Your shovel hits something hard. You stop digging, and lo and behold, it's a solid gold block!"
                            addItem(player, "solid gold block")

                        } else if (specialEvent < 10) {
                            var amount = getRandomInt(1000000, 5000000)
                            specialEvent = "Your shovel hits something hard. You stop digging, and lo and behold, it's a pile of " + numberWithCommas(amount) + " gold coins!"
                            player.gold += amount

                        } else if (specialEvent < 50) {
                            specialEvent = "You hear a 'thunk' and stop digging. Turns out you've unearthed a treasure chest!"
                            addItem(player, "treasure chest")
                        } else if (specialEvent < 80) {
                            specialEvent = "After you finish digging, you notice something shiny in the ground. Turns out it's an old teleporter module! You grab it."
                            addItem(player, "teleporter module")
                        } else {
                            specialEvent = null
                        }
                        if (specialEvent) {
                            writeFB()
                            socket.emit("getItems", player.items, player.gold)
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
    socket.on("updateDir", function (directions) {
        var player = getPlayerById(socket.id)
        if (player && !player.digging && player.x < Number.MAX_SAFE_INTEGER && player.x > -Number.MAX_SAFE_INTEGER && player.y < Number.MAX_SAFE_INTEGER && player.y > -Number.MAX_SAFE_INTEGER) {
            //console.log("updated " + socket.id)
            if (directions.includes("left")) {
                player.x--
            }
            if (directions.includes("right")) {
                player.x++
            }
            if (directions.includes("up")) {
                player.y--
            }
            if (directions.includes("down")) {
                player.y++
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
            if (!direction) {
                var leftresult = generateFrame(px - 128, py)
                var rightresult = generateFrame(px + 128, py)
                var topresult = generateFrame(px, py - 96)
                var bottomresult = generateFrame(px, py + 96)
                socket.emit("loadMap", mainresult.main, {
                    left: leftresult.main,
                    right: rightresult.main,
                    top: topresult.main,
                    bottom: bottomresult.main
                }, mainresult.mini)
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

function addItem(player, name) {
    if (!player.items || player.items.length === 0) {
        player.items = []
    }
    player.items.push(findObjectByKey(validItems, "name", name))
    if (player.id) {
        io.to(`${player.id}`).emit("getItems", player.items, player.gold)
    }
    writeFB()
}
function removeItem(player, name) {
    console.log("before: ", player.items)
    player.items.splice(player.items.indexOf(findObjectByKey(player.items, "name", name)), 1)
    console.log("after: ", player.items)
    if (player.id) {
        io.to(`${player.id}`).emit("getItems", player.items, player.gold)
    }
    writeFB()
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

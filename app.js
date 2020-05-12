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
var Perlin = require('perlin.js');
const dirt = '#6b4433',
    grass = '#377d1b',
    water = '#0b61bd',
    sand = '#f7ca36',
    rock = '#828282'
Perlin.seed(69);


function readFB() {
    return new Promise(resolve => {
        FirebaseData.once("value", function (snapshot) {
            console.log(snapshot.val());
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
    });
}

async function setup() {
    var result = await readFB();
    if (result) {
        FirebaseData.once("value", function (snapshot) {
            appdata = copyObject(snapshot.val());
            players = appdata.players;
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
    } else if (req.url === "/app.js") {
        file = __dirname + "/no.txt"
    } else if (req.url === "/game") {
        file = __dirname + "/game.html"
    } else if (req.url === "/lootmastersauth.json") {
        file = __dirname + "/no.txt"
    } else if (req.url.includes("/loginsubmit?")) {
        file = __dirname + "/loginsubmit.html"
    } else if (req.url.slice(0, 14) === "/signupsubmit?") {
        var obj = qs.parse(req.url.slice(14, req.url.length))
        console.log(obj)
        if(obj.username && obj.password) {
            if(obj.username.match("^(?=[A-Za-z_\\d]*[A-Za-z])[A-Za-z_\\d]{4,20}$") && !findObjectByKey(players, "username", obj.username)) {
                var player = {
                    x: getRandomInt(100, 200),
                    y: getRandomInt(100, 200),
                    username: obj.username,
                    password: obj.password,
                    inventory: "none",
                    online: false
                }
                players.push(player)
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
    console.log(data)
    try {
        var user = findObjectByKey(players, "username", data.username) || findObjectByKey(players, "token", data.token)
        callback(null, user && (user.password === data.password || findObjectByKey(players, "token", data.token)));
    } catch (error) {
        callback(error);
    }
}

function postAuthenticate(socket, data) {
    var username = data.username
    console.log(socket.id + "(" + username + ") joined server")
    socket.on("storeTransferToken", function (token) {
        findObjectByKey(players, "username", username).token = token
        writeFB()
    })
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
    var player = findObjectByKey(players, "id", socket.id)
    if(player) {
        player.online = false
        writeFB()
    }
    //ids.splice(ids.indexOf(socket.id), 1)
}
socketioAuth(io, {authenticate: authenticate, postAuthenticate: postAuthenticate, disconnect: disconnect});
io.on("connection", function (socket) {
    socket.on("disconnect", function () {
        console.log("disconnected")
        var player = findObjectByKey(players, "id", socket.id)
        if(player) {
            player.online = false
            writeFB()
        }
    })
    socket.on("tokenToId", function (token) {
        console.log(token)
        if (findObjectByKey(players, "token", token)) {
            console.log("token found")
            findObjectByKey(players, "token", token).id = socket.id
            findObjectByKey(players, "token", token).online = true
            findObjectByKey(players, "token", token).token = null
            writeFB()
            socket.emit("authSuccess", findObjectByKey(players, "id", socket.id).x, findObjectByKey(players, "id", socket.id).y)
        } else {
            socket.emit("authFail")
        }
    })
    socket.on("checkAuthStatus", function() {
        console.log(findObjectByKey(players, "id", socket.id))
        if(findObjectByKey(players, "id", socket.id)) {
            console.log("yes")
        }
    })
    socket.on("updatePos", function (px, py) {
        //console.log(findObjectByKey(players, "id", socket.id))
        if(findObjectByKey(players, "id", socket.id)) {
            console.log("updated " + socket.id)
            findObjectByKey(players, "id", socket.id).x = px
            findObjectByKey(players, "id", socket.id).y = py
            writeFB()
            io.sockets.emit("requestNewPlayerPos")
        }
    })
    socket.on("needNewPlayerPos", function (px, py, lb, rb, ub, lob) {
        if(findObjectByKey(players, "id", socket.id)) {
            var playersInView = []
            for (var x = 0; x < players.length; x++) {
                if (players[x].x < rb && players[x].x > lb && players[x].y < lob && players[x].y > ub && players[x].online) {
                    playersInView.push(simplifyPlayer(players[x]))
                }
            }
            socket.emit("playerUpdate", playersInView)
        }
    })
    socket.on("getFrame", function (px, py, direction) {
        if(findObjectByKey(players, "id", socket.id)) {
            findObjectByKey(players, "id", socket.id).x = px
            findObjectByKey(players, "id", socket.id).y = py

            //console.log(px, py)
            var leftbound = px - 65
            var rightbound = px + 65
            var upbound = py - 49
            var lowbound = py + 49
            var currentMap = []
            for (var y = upbound; y < lowbound; y++) {
                var row = []
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

                    row.push(obj)
                }
                currentMap.push(row)
            }
            //console.log(currentMap)
            socket.emit("loadMap", currentMap, direction)
            //io.sockets.emit("playerUpdate")
        }
    })
    socket.on("getChunks", function (chunks) {
        if(findObjectByKey(players, "id", socket.id)) {
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
    //return Math.abs(simplex.noise2D(x, y)) * 100
    //return Math.floor(grid.getPixel(x / scalefactor, y / scalefactor) * 100)
}

const pointInRect = ({x1, y1, x2, y2}, {x, y}) => (
    (x > x1 && x < x2) && (y > y1 && y < y2)
)

function objArrayToString(arr) {
    var string = "[";
    for (var i = 0; i < arr.length; i++) {
        if (i != arr.length - 1) {
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

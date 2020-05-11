var app = require('http').createServer(response); //http server module
var fs = require('fs'); //filesystem module
var io = require('socket.io')(app); //socket.io module
var sentencer = require('sentencer') //suggest topics
var ids = [] //list of socket ids
var players = [] //list of connected sockets
var Perlin = require('perlin.js');

Perlin.seed(69);
/*var SimplexNoise = require('simplex-noise'),
    simplex = new SimplexNoise(69)
const VectorNoiseGenerator = require("atlas-vector-noise");*/
/*const scalefactor = 69
// generates a 100x200 grid
const grid = new VectorNoiseGenerator(3000);*/

async function response(req, res) {
    /*
    This function handles incoming HTTP requests and returns data
     */
    var file = "";
    if (req.url === "/" || req.url.slice(0, 5) === "/join") {
        file = __dirname + "/index.html"
    } else if (req.url === "/app.js") {
        file = __dirname + "/no.txt"
    }  else {
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
app.listen(process.env.PORT || 3000);
//on a connection, what do we do
io.on('connection', function (socket) {
    console.log(socket.id + " joined server")
    socket.on("disconnect", function() {
        for(var x = 0; x < players.length; x++) {
            if(players[x].id === socket.id) {
                players.splice(x, 1)
                break
            }
        }
        ids.splice(ids.indexOf(socket.id), 1)
    })
    socket.on("updatePos", function(px, py, lb, rb, ub, lob) {
        console.log("got update position command")
        if(!ids.includes(socket.id)) {
            var obj = {
                x: px,
                y: py,
                id: socket.id
            }
            players.push(obj)
            ids.push(socket.id)
        } else {
            findObjectByKey(players, "id", socket.id).x = px
            findObjectByKey(players, "id", socket.id).y = py
        }

        io.sockets.emit("requestNewPlayerPos")
    })
    socket.on("needNewPlayerPos", function(px, py, lb, rb, ub, lob){
        var playersInView = []
        for(var x = 0; x < players.length; x++) {
            if(players[x].x < rb && players[x].x > lb && players[x].y < lob && players[x].y > ub) {
                playersInView.push(players[x])
            }
        }
        socket.emit("playerUpdate", playersInView)
    })
    socket.on("getFrame", function(px, py, direction) {
        if(!ids.includes(socket.id)) {
            var obj = {
                x: px,
                y: py,
                id: socket.id
            }
            players.push(obj)
            ids.push(socket.id)
        } else {
            findObjectByKey(players, "id", socket.id).x = px
            findObjectByKey(players, "id", socket.id).y = py
        }
        console.log(px, py)
        var leftbound = px - 65
        var rightbound = px + 65
        var upbound = py - 49
        var lowbound = py + 49
        var currentMap = []
        for (var y = upbound; y < lowbound; y++) {
            var row = []
            for (var x = leftbound; x < rightbound; x++) {
                var obj = {}
                if(findObjectByKey(players, "x", x) && findObjectByKey(players, "x", x).y === y) {
                    obj = {
                        noise: 999,
                        x: x,
                        y: y,
                        id: findObjectByKey(players, "x", x).id
                    }
                } else {
                    obj = {
                        noise: getNoise(x, y),
                        x: x,
                        y: y,
                        id: 0
                    }
                }
                row.push(obj)
            }
            currentMap.push(row)
        }
        //console.log(currentMap)
        socket.emit("loadMap", currentMap, direction)
        //io.sockets.emit("playerUpdate")
    })
    socket.on("getChunks", function(chunks) {
        var allNewChunks = []
        for(var x = 0; x < chunks.length; x++) {
            var chunk = chunks[x]
            var newChunk = []
            for(var i = 0; i < 5; i++) {
                var row = []
                for(var j = 0; j < 5; j++) {
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

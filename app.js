var app = require('http').createServer(response); //http server module
var fs = require('fs'); //filesystem module
var io = require('socket.io')(app); //socket.io module
var sentencer = require('sentencer') //suggest topics
var ids = [] //list of socket ids
var sockets = [] //list of connected sockets
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
    sockets.push(socket)
    ids.push(socket.id)
    console.log(socket.id + " joined server")
    socket.on("getFrame", function(px, py) {
        console.log(px, py)
        var leftbound = px - 74
        var rightbound = px + 74
        var upbound = py - 58
        var lowbound = py + 58
        var currentMap = []
        for (var y = upbound; y < lowbound; y++) {
            var row = []
            for (var x = leftbound; x < rightbound; x++) {
                var obj = {
                    noise: getNoise(x, y),
                    x: x,
                    y: y
                }
                row.push(obj)
            }
            currentMap.push(row)
        }
        //console.log(currentMap)
        socket.emit("loadMap", currentMap)
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

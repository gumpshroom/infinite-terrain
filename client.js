var socket = io();
var tiles = []
var chunks = []
var px = getRandomInt(100, 1000)
var py = getRandomInt(100, 1000)
var mapmaxX = 74,
    mapmaxY = 58
var leftbound = px - 64,
    rightbound = px + 64,
    upbound = py - 48,
    lowbound = py + 48
// the snake is divided into small segments, which are drawn and edited on each 'draw' call
let direction = 'right';
const dirt = '#6b4433',
    grass = '#377d1b',
    water = '#0b61bd',
    sand = '#f7ca36',
    rock = '#828282'

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function setup() {
    createCanvas(640, 480);
    frameRate(60);
    stroke(255);
    strokeWeight(10);
}
function draw() {
    background(255);
    render();
}
function render() {
    for(var y = 0; y < tiles.length - 20; y++) {
        var absolutey = py - y - 48
        for(var x = 0; x < tiles[y].length - 20; x++) {
            var absolutex = px - x - 64
            if(tiles[y][x].noise > 90) {
                stroke(dirt)
            } else if(tiles[y][x].noise > 80 && tiles[y][x].noise <= 90) {
                stroke(dirt)
            } else if(tiles[y][x].noise > 70 && tiles[y][x].noise <= 80) {
                stroke(grass)
            } else if(tiles[y][x].noise > 60 && tiles[y][x].noise <= 70) {
                stroke(rock)
            } else if(tiles[y][x].noise > 50 && tiles[y][x].noise <= 60) {
                stroke(grass)
            } else if(tiles[y][x].noise > 40 && tiles[y][x].noise <= 50) {
                stroke(sand)
            } else if(tiles[y][x].noise > 30 && tiles[y][x].noise <= 40) {
                stroke(water)
            } else if(tiles[y][x].noise > 20 && tiles[y][x].noise <= 30) {
                stroke(water)
            } else if(tiles[y][x].noise > 10 && tiles[y][x].noise <= 20) {
                stroke(water)
            } else {
                stroke(water)
            }
            //stroke(tiles[y][x].noise.r, tiles[y][x].noise.g, tiles[y][x].noise.b)
            //fill(tiles[y][x].noise)

            rect(x * 5, y * 5, 5, 5)
        }
    }
}
document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        py--
        // up arrow
    }
    else if (e.keyCode == '40') {
        py++
        // down arrow
    }
    else if (e.keyCode == '37') {
        px--
        // left arrow
    }
    else if (e.keyCode == '39') {
        px++
        // right arrow
    }
    leftbound = px - 64
    rightbound = px + 64
    upbound = py - 48
    lowbound = py + 48
    /*var chunksToRequest = checkChunks()
    console.log(px, py)
    console.log(chunksToRequest)
    if(chunksToRequest.length !== 0) {
        socket.emit("getChunks", chunksToRequest)
    }*/
    socket.emit("getFrame", px, py)
}
socket.on("loadMap", function(newMap){
    /*var tempMap = []
    for(var i = 10; i < newMap.length - 10; i++) {
        var row = []
        for(var j = 10; j < newMap[i].length - 10; j++) {
            row.push(newMap[i][j])
        }
        tempMap.push(row)
    }*/
    console.log("received map")
    tiles = newMap
    //console.log(tiles)
})
socket.on("loadChunks", function(chunks) {
    /*for (var i = 0; i < chunks.length; i++) {
        for (var j = 0; j < chunks[i].length; j++) {
            for(var y = 0; y < tiles.length; y++) {
                if(chunks[i].x < leftbound) {
                    for(var o = 0; o < 5; o++) {
                        Array.prototype.splice.apply(tiles[y], [0, chunks[i].length].concat(chunks[i][j][o]))
                    }
                }
                if(chunks[i].x > rightbound) {
                    for(var o = 0; o < 5; o++) {
                        Array.prototype.splice.apply(tiles[y], [0, chunks[i].length].concat(chunks[i][j]))
                    }
                }
                if(chunks[i].y < upbound) {
                    var toFlat = []
                    for(var o = 0; o < 5; o++) {
                        toFlat.push()
                        tiles[y].unshift(chunks[i][j])
                    }
                }
                if(chunks[i].y > lowbound) {
                    for(var o = 0; o < 5; o++) {
                        tiles[y].push(chunks[i][j])
                    }
                }
            }
        }
    }*/
    console.log(chunks)
    if(chunks[0].x === chunks[1].x) {
        //chunks go up and down
        var newColumns = mergeVerticalChunks(chunks)
        for(var x = 0; x < newColumns.length; x++) {

            if(chunks[0].x > rightbound) {
                //chunks are on right side
                tiles[x] = tiles[x].concat(newColumns[x])
                tiles[x] = tiles[x].slice(5, tiles[x].length)
            } else {
                //chunks on left
                tiles[x] = newColumns[x].concat(tiles[x])
                tiles[x] = tiles[x].slice(0, tiles[x].length - 5)
            }

        }
    } else if(chunks[0].y === chunks[1].y) {
        //chunks go left and right
        var newRows = mergeHorizontalChunks(chunks)
        for(var y = newRows.length - 1; y >= 0; y--) {
            tiles.unshift(newRows[y])
        }
        if(chunks[0].y < upbound) {
            //chunks are on the top
            tiles = tiles.slice(0, tiles.length - 5)
        } else {
            //chunks are on bottom
            tiles = tiles.slice(5, tiles.length)
        }

    }

})
function mergeHorizontalChunks(chunks) {
    var temp = []
    for(var i = 0; i < chunks.length - 1; i++) {
        temp.push(chunks[i])
        for(var j = 0; j < chunks[i].length; j++) {
            temp[i][j] = temp[i][j].concat(chunks[i + 1][j])
        }
    }
    return temp
}
function mergeVerticalChunks(chunks) {
    var temp = []
    for(var i = 0; i < chunks.length; i++) {
        for(var j = 0; j < chunks[i].length; j++) {
            temp.push(chunks[i][j])
        }
    }
    return temp
}
function checkChunks() {
    var chunksToRequest = []
    if(Math.abs(leftbound - tiles[0][0].x) < 5) {
        console.log(1)
        var processedChunks = 0
        var endOfRows = false
        var currentChunkTile = {}
        while(!endOfRows) {
            currentChunkTile = {x: tiles[0][0].x - 9, y: tiles[0][0].y + processedChunks}
            chunksToRequest.push(currentChunkTile)
            if(currentChunkTile.y >= lowbound) {
                endOfRows = true
                break
            } else {
                processedChunks += 5
            }
        }
    }
    if(Math.abs(tiles[0][mapmaxX] - rightbound) < 5) {
        console.log(2)
        var processedChunks = 0
        var endOfRows = false
        var currentChunkTile = {}
        while(!endOfRows) {
            currentChunkTile = {x: tiles[0][mapmaxX].x + 9, y: tiles[0][mapmaxX].y + processedChunks}
            chunksToRequest.push(currentChunkTile)
            if(currentChunkTile.y >= lowbound) {
                endOfRows = true
                break
            } else {
                processedChunks += 5
            }
        }
    }
    if(Math.abs(tiles[mapmaxY][0] - lowbound) < 5) {
        console.log(3)
        var processedChunks = 0
        var endOfColumns = false
        var currentChunkTile = {}
        while(!endOfColumns) {
            currentChunkTile = {x: tiles[mapmaxY][0].x + processedChunks, y: tiles[mapmaxY][0].y + 9}
            chunksToRequest.push(currentChunkTile)
            if(currentChunkTile.x >= rightbound) {
                endOfColumns = true
                break
            } else {
                processedChunks += 5
            }
        }
    }
    if(Math.abs(tiles[0][0] - upbound) < 5) {
        console.log(4)
        var processedChunks = 0
        var endOfColumns = false
        var currentChunkTile = {}
        while(!endOfColumns) {
            currentChunkTile = {x: tiles[0][0].x + processedChunks, y: tiles[0][0].y + 9}
            chunksToRequest.push(currentChunkTile)
            if(currentChunkTile.x >= rightbound) {
                endOfColumns = true
                break
            } else {
                processedChunks += 5
            }
        }
    }
    return chunksToRequest
}

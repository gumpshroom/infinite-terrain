var socket = io();
var tiles = []
var chunks = []
var playersInView = []
var mapLoaded = false
var px = getRandomInt(100, 150)
var py = getRandomInt(100, 150)
var mapmaxX = 74,
    mapmaxY = 58
var leftbound = px - 65,
    rightbound = px + 65,
    upbound = py - 49,
    lowbound = py + 49
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
    for(var y = 0; y < tiles.length; y++) {
        var absolutey = py - y - 48
        for(var x = 0; x < tiles[y].length; x++) {
            var absolutex = px - x - 64
            //if(px === tiles[y][x].x && py === tiles[y][x].y && socket.id === tiles[y][x].id) {
            /*if(tiles[y][x].id === socket.id) {
                stroke(255)
            } else if(tiles[y][x].noise === 999 && tiles[y][x].id !== socket.id) {
                stroke('red')
            } else*/ if(tiles[y][x].noise > 90 && tiles[y][x].noise <= 100) {
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
            } else if(tiles[y][x].noise <= 10) {
                stroke(water)
            }
            //stroke(tiles[y][x].noise.r, tiles[y][x].noise.g, tiles[y][x].noise.b)
            //fill(tiles[y][x].noise)

            rect(x * 5, y * 5, 5, 5)
        }
    }

    for(var i = 0; i < playersInView.length; i++) {
        if(playersInView[i].id === socket.id) {
            stroke(255)
        } else {
            stroke('red')
        }

        rect((playersInView[i].x - leftbound) * 5, (playersInView[i].y - upbound) * 5, 5, 5)
    }
}

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        py--
        socket.emit("updatePos", px, py)
        // up arrow
    }
    else if (e.keyCode == '40') {
        py++
        socket.emit("updatePos", px, py)
        // down arrow
    }
    else if (e.keyCode == '37') {
        px--
        socket.emit("updatePos", px, py)
        // left arrow
    }
    else if (e.keyCode == '39') {
        px++
        socket.emit("updatePos", px, py)
        // right arrow
    }
    if(e.keyCode == '38' || e.keyCode == '40' || e.keyCode == '37' || e.keyCode == '39') {

        console.log(px, py)
        if(mapLoaded) {
            if (px <= leftbound) {
                socket.emit("getFrame", leftbound - 64, Math.floor((upbound + lowbound) / 2), "left")
                mapLoaded = false
            } else if (px >= rightbound) {
                socket.emit("getFrame", rightbound + 64, Math.floor((upbound + lowbound) / 2), "right")
                mapLoaded = false
            } else if (py <= upbound) {
                socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2), upbound - 48, "up")
                mapLoaded = false
            } else if (py >= lowbound) {
                socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2), lowbound + 48, "down")
                mapLoaded = false
            }

        }
    }
    /*leftbound = px - 64
    rightbound = px + 64
    upbound = py - 48
    lowbound = py + 48*/
    /*var chunksToRequest = checkChunks()
    console.log(px, py)
    console.log(chunksToRequest)
    if(chunksToRequest.length !== 0) {
        socket.emit("getChunks", chunksToRequest)
    }*/



}
socket.on("loadMap", function(newMap, direction){
    /*var tempMap = []
    for(var i = 10; i < newMap.length - 10; i++) {
        var row = []
        for(var j = 10; j < newMap[i].length - 10; j++) {
            row.push(newMap[i][j])
        }
        tempMap.push(row)
    }*/
    switch(direction) {
        case "up":
            lowbound = upbound
            py = lowbound - 1
            upbound = upbound - 97
            break
        case "down":
            //py += 1
            upbound = lowbound
            lowbound = lowbound + 97
            break
        case "left":
            rightbound = leftbound
            px = rightbound - 1
            leftbound = leftbound - 129
            break
        case "right":
            //px += 1
            leftbound = rightbound
            rightbound = rightbound + 129
            break
        default:
            break
    }

    print("bounds updated: l:", leftbound, ", r:", rightbound, ", u:", upbound, ", d:", lowbound)
    mapLoaded = true
    console.log("received map")
    tiles = newMap
    //console.log(tiles)
})
socket.on("requestNewPlayerPos", function(){
    socket.emit("needNewPlayerPos", px, py, leftbound, rightbound, upbound, lowbound)
})
socket.on("playerUpdate", function(players) {
    console.log("updated player positions")
    playersInView = players
    //socket.emit("getFrame", Math.floor((upbound + lowbound) / 2), Math.floor((rightbound + leftbound) / 2))
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

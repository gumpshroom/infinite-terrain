var socket = io();
var keys = []
var tiles = []
var playersInView = []
var mapLoaded = false
var px = getRandomInt(100, 150)
var py = getRandomInt(100, 150)
var psx = 64
var psy = 48
var mapGraphics
var leftbound = px - 65,
    rightbound = px + 65,
    upbound = py - 49,
    lowbound = py + 49

let direction = 'right';


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function setup() {
    createCanvas(640, 480);
    mapGraphics = createGraphics(640, 480)
    frameRate(30);
    stroke(255);
    strokeWeight(10);
    //ctx = document.getElementsByClassName("p5Canvas")[0].getContext('2d');
}
function draw() {
    //background(255);
    image(mapGraphics, 0, 0)
    if (keyIsDown(LEFT_ARROW)) {
        px -= 1;
        socket.emit("updatePos", px, py)
    }

    if (keyIsDown(RIGHT_ARROW)) {
        px += 1;
        socket.emit("updatePos", px, py)
    }

    if (keyIsDown(UP_ARROW)) {
        py -= 1;
        socket.emit("updatePos", px, py)
    }

    if (keyIsDown(DOWN_ARROW)) {
        py += 1;
        socket.emit("updatePos", px, py)
    }

    handleArrowKeys()
    renderPlayers();
}
function handleArrowKeys() {
    if(keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) || keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW)) {
        //console.log(px, py)
        if (mapLoaded) {
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
}
function renderMap() {
    for(var y = 0; y < tiles.length; y++) {
        var absolutey = py - y - 48
        for(var x = 0; x < tiles[y].length; x++) {
            var absolutex = px - x - 64
            mapGraphics.stroke(tiles[y][x].color)
            mapGraphics.fill(tiles[y][x].color)
            mapGraphics.rect(x * 5, y * 5, 5, 5)
        }
    }

}
function renderPlayers() {
    for(var i = 0; i < playersInView.length; i++) {
        if(playersInView[i].id === socket.id) {
            stroke(255)
            //rect(psx, psy, 5)
        } else {
            stroke('red')

        }
        rect((playersInView[i].x - leftbound) * 5, (playersInView[i].y - upbound) * 5, 5)
    }
}
//document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        py--
        psy -= 5
        socket.emit("updatePos", px, py)
        // up arrow
    }
    else if (e.keyCode == '40') {
        py++
        psy += 5
        socket.emit("updatePos", px, py)
        // down arrow
    }
    else if (e.keyCode == '37') {
        px--
        psx -= 5
        socket.emit("updatePos", px, py)
        // left arrow
    }
    else if (e.keyCode == '39') {
        px++
        psx += 5
        socket.emit("updatePos", px, py)
        // right arrow
    }
    if(e.keyCode == '38' || e.keyCode == '40' || e.keyCode == '37' || e.keyCode == '39') {

        //console.log(px, py)
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
    //console.log("received map")
    tiles = newMap
    renderMap()
    //console.log(tiles)
})
socket.on("requestNewPlayerPos", function(){
    socket.emit("needNewPlayerPos", px, py, leftbound, rightbound, upbound, lowbound)
})
socket.on("playerUpdate", function(players) {
    //console.log("updated player positions")
    playersInView = players
    //socket.emit("getFrame", Math.floor((upbound + lowbound) / 2), Math.floor((rightbound + leftbound) / 2))
})

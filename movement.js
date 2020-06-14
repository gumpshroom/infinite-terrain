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

socket.on("dig", function (px, py) {
    var player = getPlayerById(socket.id)
    if (player) {

        var noise = getNoise(px, py)
        console.log(noise)

        if (processColorBiome(px, py).name === "ocean" || (findObjectByKey(revealedTreasures, "x", px) && findObjectByKey(revealedTreasures, "x", px).y === py)) {
            socket.emit("chatUpdate", "Can't dig there.")
        } else if (!player.digging) {
            player.digging = true
            socket.emit("chatUpdate", "Digging (" + numberWithCommas(player.digTime) + " ms)...")
            //socket.emit("chatUpdate", "<div id='myProgress'><div id='myBar'></div></div><script>move(" + player.digTime + ")</script>")
            setTimeout(function () {
                if (/*(inRangeExc(noise, 81.1, 81.2) || inRangeExc(noise, 77.9, 78.1) || inRangeExc(noise, 43, 43.4)) && */((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(6) === "3" && parseInt(((getNoise(noise, noise + noise)) * noise).toFixed(9).charAt(8)) % 2 === 0 && player.digging) {
                    revealedTreasures.push({x: px, y: py, p: player.username})
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
                        var amount = getRandomInt(100000, 500000)
                        specialEvent = "Your shovel hits something hard. You stop digging, and lo and behold, it's a pile of " + numberWithCommas(amount) + " gold coins!"
                        player.gold += amount

                    } else if (specialEvent < 30) {
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

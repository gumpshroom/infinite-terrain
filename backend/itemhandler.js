var result = {
    title: "Item used."
}
switch(itemname) {
    case "teleporter module":
        if(validateParams(params) && /\d/.test(params.x) && /\d/.test(params.y) && parseInt(params.x) < Number.MAX_SAFE_INTEGER && parseInt(params.x) > -Number.MAX_SAFE_INTEGER && parseInt(params.y) > -Number.MAX_SAFE_INTEGER && parseInt(params.y) < Number.MAX_SAFE_INTEGER) {
            if(!player.digging) {
                player.x = parseInt(params.x)
                player.y = parseInt(params.y)
                removeItem(player, "teleporter module")
                writeFB()
                socket.emit("requestGetFrame", player.x, player.y)
                socket.emit("itemsUpdated")
                io.sockets.emit("requestNewPlayerPos")
            } else {
                result.title = "Can't use that while digging."
            }
        } else {
            result.title = "No parameters specified."
        }
        break
    case "solid gold block":
        var amount = getRandomInt(1000000, 3000000)
        if(player.gold + amount >= Number.MAX_SAFE_INTEGER) {
            player.gold = Number.MAX_SAFE_INTEGER
        } else {
            player.gold += amount
        }
        removeItem(player, "solid gold block")
        result.title = "Big Money"
        result.html = "You auctioned your solid gold block for a sweet " + numberWithCommas(amount) + " gold!"
        writeFB()
        break
    case "treasure chest":
        if(getRandomInt(1, 4) === 1) {
            var treasure = generateTreasure()
            if (player.treasure === "none" || !player.treasure) {
                player.treasure = []
            }
            player.treasure.push(treasure)
            //socket.emit("gotTreasure", treasure.name)
            socket.emit("foundTreasureChat", treasure.name)
            if (treasure.rarity === "legendary") {
                socket.emit("chatUpdate", "<b>" + player.username + " found a legendary " + treasure.name + "!</b>")
            }
            result.html = "There was a " + treasure.name + " in the chest! How lucky!"
            writeFB()
        } else {
            if(getRandomInt(1, 100) < 3) {
                addItem(player, "clagger")
                var str = "There was a weird-looking gun in the chest! The label on it says it's a \"clagger\"."
                if(getRandomInt(1, 4) === 1) {
                    str += "<br>It even had an ammo clip in it! How lucky!"
                    addItem(player, "blast cartridge")
                }
                result.title = "Woah!"
                result.html = str
            } else {
                result.title = "Better luck next time."
                result.html = "That treasure chest had nothing in it but a whole lot of air."
            }
        }
        removeItem(player, "treasure chest")
        break
    case "clagger":
        if(findObjectByKey(player.items, "name", "blast cartridge")) {
            removeItem(player, "blast cartridge")
            if(player.digTime > 9000) {
                player.digTime -= 100
                result.html = "You shoot yourself with the clagger. Your movements get faster!"
                writeFB()
            } else {
                result.html = "You shoot yourself with the clagger, but you're already moving faster than it makes you go, so it was kind of a waste."
            }
        } else {
            result.html = "You don't have a cartridge with which to load this thing."
        }
        break
    default:
        socket.emit("alert", "Can't use that.")
        break
}
socket.emit("alert", result)
function validateParams(params) {
    var count = 0
    if(item.params && item.params.length !== 0) {
        for(var x = 0; x < item.params.length; x++) {
            if(Object.keys(params)[x] && item.params[x] && Object.keys(params)[x] === item.params[x] && params[Object.keys(params)[x]] !== "" && /\S/.test(params[Object.keys(params)[x]])) {
                count ++
            }
        }
    }
    return count === item.params.length
}


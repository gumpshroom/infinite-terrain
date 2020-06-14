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
                socket.emit("alert", "Can't use that while digging.")
            }
        } else {
            socket.emit("alert", "No parameters specified.")
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
        socket.emit("alert", "Big Money", "You auctioned your solid gold block for a sweet " + numberWithCommas(amount) + " gold!")
        writeFB()
        break
    case "treasure chest":
        if(getRandomInt(1, 4) === 1) {
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

            writeFB()
        } else {
            socket.emit("alert", {title:"Better luck next time.", html: "That treasure chest had nothing in it but a whole lot of air."})
        }
        removeItem(player, "treasure chest")
    break
    default:
        socket.emit("alert", "Can't use that.")
        break
}
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


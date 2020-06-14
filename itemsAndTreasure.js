socket.on("useItem", function (itemname, queryString) {
    var params = qs.parse(queryString)
    var player = getPlayerById(socket.id)
    if (player) {
        if (findObjectByKey(player.items, "name", itemname) && (!findObjectByKey(player.items, "name", itemname).flags || !findObjectByKey(player.items, "name", itemname).flags.includes("noUse"))) {
            var item = findObjectByKey(player.items, "name", itemname)
            eval(fs.readFileSync('itemhandler.js') + '')
        }
    }
})
socket.on("requestitems", function () {
    var player = getPlayerById(socket.id)
    if (player) {
        socket.emit("getItems", player.items, player.gold)
    }
})
socket.on("requesttreasure", function () {
    var player = getPlayerById(socket.id)
    if (player) {
        socket.emit("getTreasures", player.treasure)
    }
})
socket.on("sellTreasure", function (name) {
    var player = getPlayerById(socket.id)
    if (player) {

        if (player.treasure && findObjectByKey(player.treasure, "name", name)) {
            var item = findObjectByKey(player.treasure, "name", name)
            player.gold += item.value
            player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", name)), 1)
            if (player.treasure.length === 0) {
                player.treasure = "none"
            }
            socket.emit("soldTreasure", {
                title: "Sold successfully.",
                html: "You sold your " + item.rarity + " <b>" + item.name + "</b> for " + numberWithCommas(item.value) + " Gold."
            })
            writeFB()
        }
    }
})

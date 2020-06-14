socket.on("submitTradeRequest", function (obj) {
    var player = getPlayerById(socket.id)
    if (player) {
        console.log("stage 1", obj)
        if (obj && ((obj.treasure !== "none" && findObjectByKey(player.treasure, "name", obj.treasure)) || (obj.item !== "none" && findObjectByKey(player.items, "name", obj.item)) || (/\d*/.test(obj.gold) && player.gold - 100 >= parseInt(obj.gold))) && findObjectByKey(players, "username", obj.target) && obj.target !== player.username) {
            if (player.gold >= 100) {
                player.gold -= 100
                player.trade = {
                    with: obj.target,
                    item: obj.item,
                    treasure: "none"
                }
                if(obj.treasure !== "none") {
                    player.trade.treasure = findObjectByKey(player.treasure, "name", obj.treasure)
                }
                if(/\d*/.test(obj.gold) && player.gold - 100 >= parseInt(obj.gold)) {
                    player.trade.gold = parseInt(obj.gold)
                } else {
                    player.trade.gold = 0
                }
                player.gold -= player.trade.gold
                if(player.trade.treasure !== "none")
                    player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", player.trade.treasure)), 1)
                if(player.trade.item !== "none")
                    removeItem(player, player.trade.item)
                var targetPlayer = findObjectByKey(players, "username", obj.target)
                var html = "<b>" + player.username + "</b> has offered: <br>"
                if(player.trade.treasure !== "none") {
                    html += "Treasure: " + player.trade.treasure.name + " (" + player.trade.treasure.rarity + ", " + numberWithCommas(player.trade.treasure.value) + " gold)<br>"
                } else {
                    html += "Treasure: none<br>"
                }
                html += "Item: " + player.trade.item + "<br>" +
                    "Gold: " + numberWithCommas(player.trade.gold) + "<br>" +
                    "<br><b>Add items to your offer:</b><br>" +
                    "<label for=\"treasureSel\">Treasure:</label><br>" +
                    "<select id=\"treasureSel\">" +
                    "<option value='none'>None</option>"
                if (targetPlayer.treasure !== "none" && targetPlayer.treasure) {
                    for (var x = 0; x < targetPlayer.treasure.length; x++) {
                        html += "<option value='" + targetPlayer.treasure[x].name + "'>" + targetPlayer.treasure[x].name + " (" + targetPlayer.treasure[x].rarity + ", " + numberWithCommas(targetPlayer.treasure[x].value) + " gold)</option>"
                    }
                }
                html += "</select><br>" +
                    "<label for='itemSel'>Item:</label><br>" +
                    "<select id='itemSel'>" +
                    "<option value='none'>None</option>"
                if(targetPlayer.items) {
                    for (var i = 0; i < targetPlayer.items.length; i++) {
                        if (!targetPlayer.items[i].flags || !targetPlayer.items[i].flags.includes("noTrade")) {
                            html += "<option value='" + targetPlayer.items[i].name + "'>" + targetPlayer.items[i].name + "</option>"
                        }
                    }
                }
                html += "</select><br>" +
                    "<label for='goldSel'>Gold:</label><br>" +
                    "<input id='goldSel' type='text'><br>"
                io.to(`${targetPlayer.id}`).emit("onTradeRequest", {
                    title: player.username + " wants to trade!",
                    html: html,
                    showCancelButton: true
                }, player.username)
                setTimeout(function () {
                    if (player.trade) {
                        player.gold += player.trade.gold
                        if(player.trade.item)
                            addItem(player, player.trade.item)
                        if(!player.treasure || player.treasure === "none")
                            player.treasure = []
                        if(player.trade.treasure !== "none")
                            player.treasure.push(player.trade.treasure)
                        player.trade = null
                        io.to(`${player.id}`).emit("alert", "Trade timed out.")
                    }
                    if (targetPlayer.trade) {
                        targetPlayer.gold += targetPlayer.trade.gold
                        if(targetplayer.trade.item)
                            addItem(targetPlayer, targetPlayer.trade.item)
                        if(!targetPlayer.treasure || targetPlayer.treasure === "none")
                            targetPlayer.treasure = []
                        if(targetPlayer.trade.treasure !== "none")
                            targetPlayer.treasure.push(targetPlayer.trade.treasure)
                        targetPlayer.trade = null
                        io.to(`${targetPlayer.id}`).emit("alert", "Trade timed out.")
                    }
                    writeFB()
                }, 300000)
                writeFB()
            } else {
                socket.emit("alert", "What you tryna pull? You don't have the money!")
            }
        } else {
            socket.emit("alert", "Bad input.")
        }
    }
})
socket.on("confirmAddToTrade", function(obj) {
    var player = getPlayerById(socket.id)
    if (player) {
        console.log("stage 2", obj)
        if(obj && obj.target && findObjectByKey(players, "username", obj.target) && obj.target !== player.username) {
            var initiator = findObjectByKey(players, "username", obj.target)
            if(initiator.trade && !player.trade) {
                if (obj.accept && ((obj.treasure !== "none" && findObjectByKey(player.treasure, "name", obj.treasure)) || (obj.item !== "none" && findObjectByKey(player.items, "name", obj.item)) || (/\d*/.test(obj.gold) && player.gold >= parseInt(obj.gold)))) {
                    player.trade = {
                        with: initiator.username,
                        item: obj.item,
                        treasure: "none"
                    }
                    if(obj.treasure !== "none") {
                        player.trade.treasure = findObjectByKey(player.treasure, "name", obj.treasure)
                    }
                    if(/\d*/.test(obj.gold) && player.gold >= parseInt(obj.gold)) {
                        player.trade.gold = parseInt(obj.gold)
                    } else {
                        player.trade.gold = 0
                    }
                    player.gold -= player.trade.gold
                    if(player.trade.treasure !== "none")
                        player.treasure.splice(player.treasure.indexOf(findObjectByKey(player.treasure, "name", player.trade.treasure)), 1)
                    if(player.trade.item !== "none")
                        removeItem(player, player.trade.item)
                    var html = "<b>" + player.username + "</b> has offered: <br>"
                    if(player.trade.treasure !== "none") {
                        html += "Treasure: " + player.trade.treasure.name + " (" + player.trade.treasure.rarity + ", " + numberWithCommas(player.trade.treasure.value) + " gold)<br>"
                    } else {
                        html += "Treasure: none<br>"
                    }
                    html += "Item: " + player.trade.item + "<br>" +
                        "Gold: " + numberWithCommas(player.trade.gold) + "<br>" +
                        "<br>And you offered:<br>"
                    if(initiator.trade.treasure !== "none") {
                        html += "Treasure: " + initiator.trade.treasure.name + " (" + initiator.trade.treasure.rarity + ", " + numberWithCommas(initiator.trade.treasure.value) + " gold)<br>"
                    } else {
                        html += "Treasure: none<br>"
                    }
                    html += "Item: " + initiator.trade.item + "<br>" +
                        "Gold: " + numberWithCommas(initiator.trade.gold) + "<br>"
                    io.to(`${initiator.id}`).emit("confirmTrade", {
                        title: "Confirm trade",
                        html: html,
                        showCancelButton: true
                    })
                    writeFB()
                } else {
                    player.trade = null
                    initiator.trade = null
                    socket.emit("alert", "Trade was canceled.")
                    io.to(`${initiator.id}`).emit("alert", "Trade was canceled.")
                    writeFB()
                }
            }
        } else {
            socket.emit("alert", "Bad input.")
        }
    }
})
socket.on("completeTrade", function(accept) {
    var player = getPlayerById(socket.id)
    if (player) {
        if(player.trade) {
            var targetPlayer = findObjectByKey(players, "username", player.trade.with)
            if(targetPlayer.trade && targetPlayer.trade.with === player.username) {
                var playerValid = true//(player.trade.item === "none" || findObjectByKey(player.items, "name", player.trade.item)) && (player.trade.treasure === "none" || findObjectByKey(player.treasure, "name", player.trade.treasure.name)) && (!player.trade.gold || player.gold >= player.trade.gold)
                var targetValid = true//(targetPlayer.trade.item === "none" || findObjectByKey(targetPlayer.items, "name", targetPlayer.trade.item)) && (targetPlayer.trade.treasure === "none" || findObjectByKey(targetPlayer.treasure, "name", targetPlayer.trade.treasure.name)) && (!targetPlayer.trade.gold || targetPlayer.gold >= targetPlayer.trade.gold)
                //console.log((targetPlayer.trade.treasure === "none" || findObjectByKey(targetPlayer.treasure, "name", targetPlayer.trade.treasure.name)))
                //console.log("ready for complete?", player.trade, targetPlayer.trade, playerValid, targetValid)
                if(playerValid && targetValid) {
                    //good
                    if(accept) {
                        if(player.trade.item !== "none") {

                            addItem(targetPlayer, player.trade.item)
                        }
                        if(player.trade.treasure !== "none") {

                            if (!targetPlayer.treasure || targetPlayer.treasure === "none")
                                targetPlayer.treasure = []
                            targetPlayer.treasure.push(player.trade.treasure)
                        }

                        targetPlayer.gold += player.trade.gold

                        if(targetPlayer.trade.item !== "none") {
                            addItem(player, targetPlayer.trade.item)
                        }
                        if(targetPlayer.trade.treasure !== "none") {
                            if (!player.treasure || player.treasure === "none")
                                player.treasure = []
                            player.treasure.push(targetPlayer.trade.treasure)
                        }

                        player.gold += targetPlayer.trade.gold

                        player.trade = null
                        targetPlayer.trade = null
                        writeFB()
                        socket.emit("chatUpdate", "Trade successful.")
                        io.to(`${targetPlayer.id}`).emit("chatUpdate", "Trade successful.")
                        socket.emit("getTreasures", player.treasure)
                        io.to(`${targetPlayer.id}`).emit("getTreasures", targetPlayer.treasure)
                        socket.emit("getItems", player.items, player.gold)
                        io.to(`${targetPlayer.id}`).emit("getItems", targetPlayer.items, targetPlayer.gold)

                    } else {
                        player.gold += player.trade.gold + 100
                        if(player.trade.item)
                            addItem(player, player.trade.item)
                        if(!player.treasure || player.treasure === "none")
                            player.treasure = []
                        if(player.trade.treasure !== "none")
                            player.treasure.push(player.trade.treasure)

                        targetPlayer.gold += targetPlayer.trade.gold
                        if(targetPlayer.trade.item)
                            addItem(targetPlayer, targetPlayer.trade.item)
                        if(!targetPlayer.treasure || targetPlayer.treasure === "none")
                            targetPlayer.treasure = []
                        if(targetPlayer.trade.treasure !== "none")
                            targetPlayer.treasure.push(targetPlayer.trade.treasure)
                        player.trade = null
                        targetPlayer.trade = null
                        writeFB()
                        socket.emit("alert", "Trade was canceled.")
                        io.to(`${targetPlayer.id}`).emit("alert", "Trade was canceled.")
                    }
                }
            }
        }
    }
})

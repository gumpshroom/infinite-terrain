switch(itemname) {
    case "teleporter module":
        if(validateParams(params) && /\d/.test(params.x) && /\d/.test(params.y) && parseInt(params.x) < 2147483647 && parseInt(params.x) > -2147483647 && parseInt(params.y) > -2147483647 && parseInt(params.y) < 2147483647) {
            if(!player.digging) {
                player.x = parseInt(params.x)
                player.y = parseInt(params.y)
                player.items.splice(player.items.indexOf(findObjectByKey(player.items, "name", itemname)))
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

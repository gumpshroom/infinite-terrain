var socket = io();
p5.disableFriendlyErrors = true;
var directions = []
var keys = []
var tiles = []
var topmap = []
var bottommap = []
var leftmap = []
var rightmap = []
var minimap = []
var playersInView = []
var treasureInView = []
var shouldHandleKeyDown = true;
var mapLoaded = false
var firstTime = true
var focus = "canvas"
var px = getRandomInt(100, 150)
var py = getRandomInt(100, 150)
var psx = 64
var psy = 48
var gold = 0
var mapGraphics, minimapGraphics
var leftbound = px - 65,
    rightbound = px + 65,
    upbound = py - 49,
    lowbound = py + 49
const dirt = '#6b4433',
    grass = '#377d1b',
    water = '#0b61bd',
    sand = '#f7ca36',
    rock = '#828282',
    dug = '#3b1e0f'
let direction = 'right';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function setup() {
    var cnv = createCanvas(640, 480);
    cnv.mouseClicked(function() {
        focus = "canvas"
    })
    mapGraphics = createGraphics(640, 480)
    minimapGraphics = createGraphics(640, 480)
    frameRate(30);
    stroke(255);
    strokeWeight(10);

    document.onkeydown = function(e){
        if (!shouldHandleKeyDown) return;
        shouldHandleKeyDown = false;
        // HANDLE KEY DOWN HERE
        if(e.key === ' ' && focus === "canvas") {
            socket.emit("dig", px, py)
        }
    }
    document.onkeyup = function(){
        shouldHandleKeyDown = true;
    }
    var div = document.createElement("div")
    div.style.float = "left"

    var chatbox = document.createElement("div")
    chatbox.id = "history"
    chatbox.style.display = "inline-block"
    var chatboxw = parseInt((window.innerWidth - parseInt(canvas.style.width)) * 0.5)

    div.style.width = chatboxw + "px"
    var chatstyle = "display: inline-block; height: " + parseInt(canvas.style.height) * 0.9 + "px; width: " + chatboxw.toString() + "px; float: left; overflow-wrap: break-word;"
    console.log(chatstyle)
    chatbox.setAttribute("style", chatstyle)
    div.appendChild(chatbox)
    var form = document.createElement("form")
    form.id = "chat"
    form.autocomplete = "off"
    form.style.display = 'inline'
    var textInput = document.createElement("input")
    textInput.type = "text"
    textInput.id = "msg_text"
    textInput.name = "msg_text"
    textInput.autocomplete = "off"
    var textInputw = parseInt(chatboxw * 0.7)
    var sendBtnw = parseInt(chatboxw * 0.2)
    console.log(textInputw)
    console.log(sendBtnw)
    var textInputStyle = "display: block; width: " + textInputw + "px; float: left;"
    textInput.setAttribute("style", textInputStyle)
    var sendBtn = document.createElement("input")
    sendBtn.type = "submit"
    sendBtn.value = "send"
    console.log(chatboxw)
    var btnInputStyle = "display: block; width: " + sendBtnw + "px; float: left;"
    sendBtn.setAttribute("style", btnInputStyle)
    form.append(textInput)
    form.append(sendBtn)


    $(form).submit(function (e) {
        console.log("wow")
        console.log(e)
        e.preventDefault();
        socket.emit("gamemsg", $(this).find("#msg_text").val(), function () {
            $("form#chat #msg_text").val("");
        });
    });
    div.appendChild(form)
    div.addEventListener("click", function() {
        focus = "chat"
    })
    document.body.appendChild(div)
    document.body.appendChild(document.createElement("br"))
    //ctx = document.getElementsByClassName("p5Canvas")[0].getContext('2d');
}
function draw() {
    //background(255);
    image(mapGraphics, 0, 0)
    //image(minimapGraphics, 0, 0, 128, 96)
    directions = []
    if (keyIsDown(LEFT_ARROW)) {
        px -= 1;
        directions.push("left")
        //socket.emit("updatePos", px, py)
    }

    if (keyIsDown(RIGHT_ARROW)) {
        px += 1;
        directions.push("right")
        //socket.emit("updatePos", px, py)
    }

    if (keyIsDown(UP_ARROW)) {
        py -= 1;
        directions.push("up")
        //socket.emit("updatePos", px, py)
    }

    if (keyIsDown(DOWN_ARROW)) {
        py += 1;
        directions.push("down")
        //socket.emit("updatePos", px, py)
    }

    socket.emit("updateDir", directions)
    /*if (keyIsDown(78)) {
        socket.emit("dig", px, py)
    }*/


    renderTreasure()


    renderPlayers();


    handleArrowKeys()




}
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
function handleArrowKeys() {
    if(keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) || keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW)) {
        //console.log(px, py)
        if (mapLoaded) {
            if (px <= leftbound) {
                rightmap = tiles
                tiles = leftmap
                topmap = []
                bottommap = []
                leftmap = []
                rightbound = leftbound
                px = rightbound - 1
                leftbound = leftbound - 129
                renderMap()
                socket.emit("getFrame", px - 64, Math.floor((upbound + lowbound) / 2) - 96, "up")
                setTimeout(function() {
                    socket.emit("getFrame", px - 64, Math.floor((upbound + lowbound) / 2) + 96, "down")
                }, 20)
                setTimeout(function() {
                    socket.emit("getFrame", leftbound - 64, Math.floor((upbound + lowbound) / 2), "left")
                }, 2000)

                socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
                socket.emit("updatePos", px, py)

                mapLoaded = false
            } else if (px >= rightbound) {
                leftmap = tiles
                tiles = rightmap
                topmap = []
                bottommap = []
                rightmap = []
                leftbound = rightbound
                rightbound = rightbound + 129
                renderMap()
                setTimeout(function() {
                    socket.emit("getFrame", rightbound + 64, Math.floor((upbound + lowbound) / 2), "right")
                }, 2000)
                setTimeout(function() {
                    socket.emit("getFrame", px + 64, Math.floor((upbound + lowbound) / 2) - 96, "up")
                }, 20)
                socket.emit("getFrame", px + 64, Math.floor((upbound + lowbound) / 2) + 96, "down")
                socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
                socket.emit("updatePos", px, py)

                mapLoaded = false
            } else if (py <= upbound) {
                bottommap = tiles
                tiles = topmap
                topmap = []
                leftmap = []
                rightmap = []
                lowbound = upbound
                py = lowbound - 1
                upbound = upbound - 97
                renderMap()
                setTimeout(function() {
                    socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2), upbound - 48, "up")
                }, 2000)
                setTimeout(function() {
                    socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2) - 128, py - 48, "left")
                }, 20)
                socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2) + 128, py - 48, "right")
                socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
                socket.emit("updatePos", px, py)

                mapLoaded = false
            } else if (py >= lowbound) {
                topmap = tiles
                tiles = bottommap
                bottommap = []
                leftmap = []
                rightmap = []
                upbound = lowbound
                lowbound = lowbound + 97
                renderMap()
                setTimeout(function() {
                    socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2), lowbound + 48, "down")
                }, 2000)
                setTimeout(function() {
                    socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2) - 128, py + 48, "left")
                }, 20)
                socket.emit("getFrame", Math.floor((leftbound + rightbound) / 2) + 128, py + 48, "right")
                socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
                socket.emit("updatePos", px, py)

                mapLoaded = false
            }

        }
    }
}
function renderMap() {
    for(var y = 0, leny = tiles.length; y < leny; y++) {
        var absolutey = py - y - 48
        for(var x = 0, lenx = tiles[y].length; x < lenx; x++) {
            var absolutex = px - x - 64
            //console.log(tiles[y][x].color)
            mapGraphics.stroke(tiles[y][x].color)
            mapGraphics.fill(tiles[y][x].color)
            mapGraphics.rect(x * 5, y * 5, 5, 5)
        }
    }
}
function renderMinimap() {
    for(var y = 0, leny = minimap.length; y < leny; y++) {
        var absolutey = py - y - 48
        for(var x = 0, lenx = minimap[y].length; x < lenx; x++) {
            var absolutex = px - x - 64
            minimapGraphics.stroke(minimap[y][x].color)
            minimapGraphics.fill(minimap[y][x].color)
            minimapGraphics.rect(x * 5, y * 5, 5, 5)
        }
    }

}
function renderPlayers() {
    for(var i = 0, len = playersInView.length; i < len; i++) {

        if(playersInView[i].id === socket.id) {
            stroke(255)
            //rect(psx, psy, 5)
        } else {
            stroke('red')

        }
        rect((playersInView[i].x - leftbound) * 5, (playersInView[i].y - upbound) * 5, 5)
        noStroke()
        textSize(8)
        textAlign(CENTER)
        fill(255)
        text(playersInView[i].username, (playersInView[i].x - leftbound) * 5 + 2.5, (playersInView[i].y - upbound) * 5 - 10)
    }
}
function renderTreasure() {
    for(var i = 0, len = treasureInView.length; i < len; i++) {
        stroke(dug)
        rect((treasureInView[i].x - leftbound) * 5, (treasureInView[i].y - upbound) * 5, 1)
    }
}
//document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    /*if (e.keyCode == '38') {
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
    }*/




}
function useItem(itemname, params) {
    if(params && params.length !== 0) {
        var html = "<form>"
        for(var x = 0; x < params.length; x++) {
            html += '<label for="' + params[x] + '">Value for ' + params[x] + ':</label><br><input type="text" id="' + params[x] + '" name="' + params[x] + '"><br>'
        }
        html += "</form>"
        Swal.fire({
            title: 'Using ' + itemname,
            html: html,
            showCancelButton: false,
            showConfirmButton: true
        }).then(function(result){
            if(result) {
                var querystring = ""
                for (var i = 0; i < params.length; i++) {
                    if (i !== params.length - 1) {
                        querystring += params[i] + "=" + $("#" + params[i]).val() + "&"
                    } else {
                        querystring += params[i] + "=" + $("#" + params[i]).val()
                    }
                }
                socket.emit("useItem", itemname, querystring)
            }
        })
    } else {
        socket.emit("useItem", itemname)
    }

}
socket.on('error', function(){
    socket.socket.connect();
});
//socket.id = localStorage.getItem("transferToken")
socket.emit("authentication", {u:localStorage.u, p: localStorage.p})

socket.on("unauthorized", function() {
    location.href = "/"
})
socket.on("authenticated", function() {
    //socket.emit("tokenToId", localStorage.getItem("transferToken"))
    console.log("auth success")

    socket.emit("getInfoOnLogin", localStorage.u, localStorage.p)
    socket.on("gotInfo", function(x, y) {
        px = x
        py = y
        leftbound = px - 65
        rightbound = px + 65
        upbound = py - 49
        lowbound = py + 49
        socket.emit('updatePos', x, y)
        socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
        socket.emit('getFrame', x, y)
        socket.emit("requesttreasure")
        localStorage.clear()
    })
    socket.on("noTreasure", function() {
        addToChat("No treasure found.")
    })
    socket.on("foundTreasureChat", function(treasurename) {
        addToChat("Found a " + treasurename + "!")
    })
    socket.on("requestGetFrame", function(x, y) {
        px = x
        py = y
        leftbound = px - 65
        rightbound = px + 65
        upbound = py - 49
        lowbound = py + 49
        socket.emit('updatePos', x, y)
        socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
        socket.emit('getFrame', x, y)
    })
    socket.on("diggingLock", function(x, y) {
        px = x
        py = y
    })
    socket.on("loadMap", function (newMap, direction, mmap) {
        /*var tempMap = []
        for(var i = 10; i < newMap.length - 10; i++) {
            var row = []
            for(var j = 10; j < newMap[i].length - 10; j++) {
                row.push(newMap[i][j])
            }
            tempMap.push(row)
        }*/
        switch (direction) {
            case "up":
                console.log("loaded top map")

                topmap = newMap
                break
            case "down":

                bottommap = newMap
                break
            case "left":

                leftmap = newMap
                break
            case "right":
                console.log("loaded right map")

                rightmap = newMap
                break
            default:
                if(direction) {
                    console.log("no direction provided, loading all")
                    leftmap = direction.left
                    rightmap = direction.right
                    topmap = direction.top
                    bottommap = direction.bottom
                    tiles = newMap
                    renderMap()
                }
                break
        }
        //
        console.log("bounds updated: l:", leftbound, ", r:", rightbound, ", u:", upbound, ", d:", lowbound)
        mapLoaded = true
        //console.log("received map")
        minimap = mmap

        //renderMinimap()
        //console.log(tiles)
    })
    socket.on("requestNewPlayerPos", function () {
        console.log('requested players')
        socket.emit("needNewPlayerPos", px, py, leftbound, rightbound, upbound, lowbound)
    })
    socket.on("playerUpdate", function (players) {
        //console.log("updated player positions")
        playersInView = players
        //socket.emit("getFrame", Math.floor((upbound + lowbound) / 2), Math.floor((rightbound + leftbound) / 2))
    })
    socket.on("alert", function(content) {
        Swal.fire(content)
    })
    socket.on("soldTreasure", function(content) {
        Swal.fire(content)
        socket.emit("requesttreasure")
        socket.emit("requestitems")
    })
    socket.on("itemsUpdated", function() {
        socket.emit("requestitems")
    })
    socket.on("requestNewTreasurePos", function () {
        console.log('requested treasures')
        socket.emit("needNewTreasurePos", px, py, leftbound, rightbound, upbound, lowbound)
    })
    socket.on("treasureUpdate", function (treasure) {
        //console.log("updated player positions")
        treasureInView = treasure
        //socket.emit("getFrame", Math.floor((upbound + lowbound) / 2), Math.floor((rightbound + leftbound) / 2))
    })
    socket.on("gotTreasure", function (name) {
        //socket.emit("getFrame", px, py)
        Swal.fire("You found treasure!", "You found a " + name + "! Check your inventory for more details.")
        socket.emit("requesttreasure")
    })
    socket.on("chatUpdate", addToChat)
    socket.on("getItems", function(items, ngold) {
        var itemContainer = document.getElementById("items")
        gold = ngold
        while (itemContainer.firstChild) {
            itemContainer.removeChild(itemContainer.firstChild);
        }
        var goldCounter = document.createElement("p")
        goldCounter.innerText = "Gold: " + numberWithCommas(gold)
        itemContainer.appendChild(goldCounter)
        itemContainer.innerHTML += "<hr width=100% align=center>"
        if(!items || items === "none") {
            var p = document.createElement("p")
            p.innerText = "You have no items."
            itemContainer.appendChild(p)
        } else {
            for (var x = 0; x < items.length; x++) {
                var DOMitem = document.createElement("p")
                var p = document.createElement("p")
                p.innerHTML = "<b>Name:</b> " +  items[x].name
                DOMitem.appendChild(p)
                DOMitem.id = items[x].name
                DOMitem.innerHTML += "<p><b>Description:</b> " + items[x].desc + "</p>"
                DOMitem.innerHTML += "<p><b>Quantity:</b> " + numberWithCommas(items[x].quantity) + "</p>"
                if(!items[x].flags || !items[x].flags.includes("noUse")) {
                    var sellButton = document.createElement("button")
                    sellButton.innerHTML = "Use"
                    //params is an array
                    if(items[x].params) {
                        sellButton.setAttribute("onclick", "useItem('" + items[x].name + "', ['" + items[x].params.join("', '") + "'])")
                    } else {
                        sellButton.setAttribute("onclick", "useItem('" + items[x].name + "')")
                    }

                    DOMitem.appendChild(sellButton)
                }
                itemContainer.appendChild(DOMitem)
                itemContainer.innerHTML += "<hr width=80% align=center>"
            }
        }
    })
    socket.on("getTreasures", function(treasure) {

        var treasureContainer = document.getElementById("treasure")
        while (treasureContainer.firstChild) {
            treasureContainer.removeChild(treasureContainer.firstChild);
        }
        if(!treasure || treasure === "none") {
            var p = document.createElement("p")
            p.innerText = "You have no treasure. Press Space to dig for treasure."
            treasureContainer.appendChild(p)
        } else {
            for(var x = 0; x < treasure.length; x++) {
                var DOMitem = document.createElement("p")
                var p = document.createElement("p")
                switch(treasure[x].rarity) {
                    case "legendary":
                        p.style.color = "#ab036b"
                        break
                    case "extremely rare":
                        p.style.color = "#0333ab"
                        break
                    case "rare":
                        p.style.color = "#96710b"
                        break
                    case "common":
                        p.style.color = "#208504"
                        break
                }
                p.innerHTML = "<b style='color: black'>Name: </b>" + treasure[x].name
                DOMitem.appendChild(p)
                DOMitem.id = treasure[x].name
                DOMitem.innerHTML += "<p><b>Rarity:</b> " + treasure[x].rarity + "</p><p><b>Value:</b> " + numberWithCommas(treasure[x].value) + "</p>"
                var sellButton = document.createElement("button")
                sellButton.innerHTML = "Sell"
                sellButton.setAttribute("onclick", "socket.emit('sellTreasure', '" + treasure[x].name + "')")
                DOMitem.appendChild(sellButton)
                treasureContainer.appendChild(DOMitem)
                treasureContainer.innerHTML += "<hr width=80% align=center>"
            }
        }
    })
    socket.on("tradePopup", function(content, player) {
        Swal.fire(content).then(function(result) {
            if(result.value) {
                var obj = {
                    treasure: $("#treasureSel").val(),
                    item: $("#itemSel").val(),
                    gold: $("#goldSel").val(),
                    target: player
                }
                socket.emit("submitTradeRequest", obj)
            }
        })
    })
    socket.on("onTradeRequest", function(content, player) {
        Swal.fire(content).then(function(result) {
            var obj
            if(result.value) {
                obj = {
                    accept: true,
                    treasure: $("#treasureSel").val(),
                    item: $("#itemSel").val(),
                    gold: $("#goldSel").val(),
                    target: player
                }
            } else {
                obj = {
                    acccept: false,
                    target: player
                }
            }
            socket.emit("confirmAddToTrade", obj)
        })
    })
    socket.on("confirmTrade", function(content) {
        Swal.fire(content).then(function(result) {
            if(result.value) {
                socket.emit("completeTrade", true)
            } else {
                socket.emit("completeTrade", false)
            }
        })
    })
})
var i = 0;
function move(time) {
    if (i == 0) {
        i = 1;
        var elem = document.getElementById("myBar");
        var width = 1;
        var id = setInterval(frame, (time / 100) * 0.9 );
        function frame() {
            if (width >= 100) {
                clearInterval(id);
                i = 0;
                elem.id = ""
            } else {
                width++;
                elem.style.width = width + "%";
            }
        }
    }
}
function addToChat(msg) {
    var final_message = $("<p />").html(msg);
    $("#history").append(final_message);
    var container = document.getElementById("history")
    if (firstTime) {
        container.scrollTop = container.scrollHeight;
        firstTime = false;
    } else if (container.scrollTop + container.clientHeight >= container.scrollHeight * 0.9) {
        container.scrollTop = container.scrollHeight;
    }
}
function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    var tab = document.getElementById(tabName)
    tab.style.display = "block";
    tab.style.width = document.getElementById("tabcontainer").offsetWidth + "px"
    tab.style.height = document.getElementById("history").style.height
    document.getElementById("inventory").style.width = tab.style.width
    evt.currentTarget.className += " active";
    socket.emit("request" + tabName)
}
function numberWithCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

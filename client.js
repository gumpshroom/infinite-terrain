var socket = io();
var keys = []
var tiles = []
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
var mapGraphics
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
    frameRate(30);
    stroke(255);
    strokeWeight(10);

    document.onkeydown = function(e){
        if (!shouldHandleKeyDown) return;
        shouldHandleKeyDown = false;
        // HANDLE KEY DOWN HERE
        if(e.key === 'n' && focus === "canvas") {
            addToChat("Digging...")
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
    /*if (keyIsDown(78)) {
        socket.emit("dig", px, py)
    }*/
    handleArrowKeys()

    renderTreasure()
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
function renderTreasure() {
    for(var i = 0; i < treasureInView.length; i++) {
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


//socket.id = localStorage.getItem("transferToken")
socket.emit("authentication", {token:localStorage.getItem("transferToken")})
socket.on("unauthorized", function() {
    location.href = "/"
})
socket.on("authenticated", function() {
    socket.emit("tokenToId", localStorage.getItem("transferToken"))

    socket.on("authFail", function () {
        Swal.fire("Authentication fail.").then(function () {
            location.href = "/"
        })
    })
    socket.on("authSuccess", function (x, y) {
        console.log("auth success")
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
    })
    socket.on("noTreasure", function() {
        addToChat("No treasure found.")
    })
    socket.on("foundTreasureChat", function(treasurename) {
        addToChat("Found a " + treasurename + "!")
    })
    socket.on("diggingLock", function(x, y) {
        px = x
        py = y
    })
    socket.on("loadMap", function (newMap, direction) {
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

        console.log("bounds updated: l:", leftbound, ", r:", rightbound, ", u:", upbound, ", d:", lowbound)
        mapLoaded = true
        //console.log("received map")
        tiles = newMap
        renderMap()
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
            p.innerText = "You have no treasure. Dig to find some."
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
                p.innerText = treasure[x].name
                DOMitem.appendChild(p)
                DOMitem.id = treasure[x].name
                DOMitem.innerHTML += "<p>rarity: " + treasure[x].rarity + "</p><p>value: " + numberWithCommas(treasure[x].value) + "</p>"
                var sellButton = document.createElement("button")
                sellButton.innerHTML = "Sell"
                sellButton.setAttribute("onclick", "socket.emit('sellTreasure', '" + treasure[x].name + "')")
                DOMitem.appendChild(sellButton)
                treasureContainer.appendChild(DOMitem)
                treasureContainer.innerHTML += "<hr width=80% align=center>"
            }
        }
    })
})
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

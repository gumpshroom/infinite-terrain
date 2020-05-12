var socket = io();
var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

socket.on("connect", function() {
    console.log(socket.id)
    socket.emit("authentication", qs)
})
socket.on("authenticated", function() {
    localStorage.setItem("transferToken", getRandomInt(100000000, 999999999))
    Swal.fire("Login success").then(function() {
        socket.emit("storeTransferToken", localStorage.transferToken)
        window.location = "/game"; // go to home.html
    })
})
socket.on('unauthorized', function(err){
    Swal.fire("There was an error with the authentication.", err.message);
});
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

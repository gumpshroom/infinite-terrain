var socket = io();

$(document).ready(function() {
    //$('#username').focus();
    $('#submitLogin').click(function(e) {
        // $('.error').css('display', 'block'); // show error msg
        e.preventDefault(); // prevent PageReLoad
        //location.href = "/loginsubmit?username=" + $('#loginusername').val() + "&password=" + md5($('#loginpassword').val())
        localStorage.setItem("u", $('#loginusername').val())
        localStorage.setItem("p", md5($('#loginpassword').val()))
        location.href = "/game"
    });
    $('#submitSignup').click(function(e) {
        e.preventDefault(); // prevent PageReLoad
        location.href = "/signupsubmit?username=" + $('#signupusername').val() + "&password=" + md5($('#signuppassword').val())

    });
});
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
socket.on("alert", function(content) {
    Swal.fire(content)
})
socket.on("tokenSuccess", function() {
    location.href = "/game"
})

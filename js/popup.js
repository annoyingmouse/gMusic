var setPlayerIcon = function(playerIcon){
    function polygon(ctx, x, y, radius, sides, startAngle, anticlockwise) {
        if (sides < 3) return;
        var a = (Math.PI * 2)/sides;
        a = anticlockwise?-a:a;
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(startAngle);
        ctx.moveTo(radius,0);
        for (var i = 1; i < sides; i++) {
            ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
        }
        ctx.closePath();
        ctx.restore();
    }
    var cv = document.getElementById('canvas');
    if (cv != null){
        document.body.removeChild(cv);
    }
    var cv = document.createElement('canvas');
        cv.setAttribute('id', 'canvas');
        cv.setAttribute('height', '19');
        cv.setAttribute('width', '19');
    document.body.appendChild(cv)
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(9.5, 9.5, 9.5, 0, 2 * Math.PI, false);
        context.fillStyle = '#f6f6f6';
        context.fill();
    switch (playerIcon){
        case 0: 
                context.beginPath();
            polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI/2);
                context.fillStyle = '#aaaaaa';
                context.fill();
            break;
        case 1:
                context.beginPath();
                context.rect(5, 4, 3, 11);
                context.rect(11, 4, 3, 11);
                context.fillStyle = '#333333';
                context.fill();
            break;
        case 2:
                context.beginPath();
            polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI/2);
                context.fillStyle = '#333333';
                context.fill();
            break;
    }
    var imageData = context.getImageData(0, 0, 19, 19);
    chrome.browserAction.setIcon({
        imageData: imageData
    });
    (playerIcon) ? chrome.browserAction.enable() : chrome.browserAction.disable();
}
var playerState = 0;
setPlayerIcon(0);
var port = chrome.runtime.connect({
    name: "gMusic"
});
var handleConnect = function(port){
    function listener(){
        port.postMessage({command: playerState});
    }
    port.onMessage.addListener(function(msg) {
        playerState = msg.player;
        setPlayerIcon(playerState);
    });
    port.onDisconnect.addListener(function(port){
        port = null;
        setPlayerIcon(0);
        chrome.browserAction.onClicked.removeListener(listener)
    });
    chrome.browserAction.onClicked.addListener(listener)
}
chrome.runtime.onConnect.addListener(handleConnect);
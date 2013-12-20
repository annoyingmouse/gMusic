var playerState = 0;
var iconPath = "disabled.png";
function setPlayerIcon(playerIcon){
    chrome.browserAction.setIcon({
        path: "icons/" + playerIcon
    });
}
setPlayerIcon(iconPath);
var port = chrome.runtime.connect({name: "gMusic"});
chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        playerState = msg.player;
        switch (playerState) {
            case 0:
                iconPath = "disabled.png";
                break;
            case 1:
                iconPath = "pause.png";
                break;
            case 2:
                iconPath = "play.png";
                break;
        }
        setPlayerIcon(iconPath);
    });
    chrome.browserAction.onClicked.addListener(function(){
        port.postMessage({command: playerState});
    });
});






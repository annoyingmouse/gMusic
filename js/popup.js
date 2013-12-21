var setPlayerIcon = function(playerIcon){
    var iconPath = [
        "disabled.png", 
        "pause.png", 
        "play.png"];
    chrome.browserAction.setIcon({
        path: "icons/" + iconPath[playerIcon]
    });
    if(playerIcon){
        chrome.browserAction.enable();
    }else{
        chrome.browserAction.disable();
    }
}
var playerState = 0;
setPlayerIcon(0);
var port = chrome.runtime.connect({name: "gMusic"});
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
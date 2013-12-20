chrome.browserAction.disable();
var playerState = 0;
var iconPath = "disabled.png";
var patt = new RegExp("https://play.google.com/music/listen#");
function setPlayerIcon(playerIcon){
    chrome.browserAction.setIcon({
        path: "icons/" + playerIcon
    });
}

setPlayerIcon(iconPath);
var port = chrome.runtime.connect({name: "gMusic"});
chrome.runtime.onConnect.addListener(function(port) {
    chrome.browserAction.enable();
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
// Add a `manifest` property to the `chrome` object.
chrome.manifest = chrome.app.getDetails();
console.log(chrome.manifest);

var injectIntoTab = function (tab) {
    // You could iterate through the content scripts here
    var scripts = chrome.manifest.content_scripts[0].js;
    var i = 0, s = scripts.length;
    for( ; i < s; i++ ) {
        chrome.tabs.executeScript(tab.id, {
            file: scripts[i]
        });
    }
}
// Get all windows
chrome.windows.getAll({
    populate: true
}, function (windows) {
    var i = 0, w = windows.length, currentWindow;
    for( ; i < w; i++ ) {
        currentWindow = windows[i];
        var j = 0, t = currentWindow.tabs.length, currentTab;
        for( ; j < t; j++ ) {
            currentTab = currentWindow.tabs[j];
            if(patt.test(currentTab.url)) {
                injectIntoTab(currentTab);
            }
        }
    }
});





var port = chrome.runtime.connect({
	name: "gMusic"
});
var playerButton = document.querySelectorAll('[data-id="play-pause"]')[0];
var observer = new WebKitMutationObserver(function (mutations) {
	getStatus();
});
function getStatus(){
	port.postMessage({
		player: (playerButton.hasAttribute("disabled")) ? 0 : (playerButton.getAttribute("title") === "Pause") ? 1 : 2
	});
}
observer.observe(playerButton, { 
	attributes: true, 
	subtree: false 
});
port.onMessage.addListener(function(msg) {
    if (msg.command){
		playerButton.click();
	}
});
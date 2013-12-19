var port = chrome.runtime.connect({name: "gMusic"});
var playerButton = document.querySelectorAll('[data-id="play-pause"]')[0];
var bubbles = false;
var observer = new WebKitMutationObserver(function (mutations) {
	getStatus();
});
function getStatus(){
	var playerStatus = 0;
	if(playerButton.hasAttribute("disabled")){
		console.log("disabled");
		playerStatus = 0;
	}else{
		if(playerButton.getAttribute("title") === "Pause"){
			console.log("playing");
			playerStatus = 1;
		}else{
			console.log("paused");
			playerStatus = 2;
		}
	}
	port.postMessage({player: playerStatus});
}
observer.observe(playerButton, { 
	attributes: true, 
	subtree: bubbles 
});
port.onMessage.addListener(function(msg) {
	console.log(msg)
    if (msg.command !== 0){
		playerButton.click();
	}
});
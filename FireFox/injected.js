let playerButton = null;
const checkExist = setInterval(() => {
	if (eval(`document.querySelectorAll('[data-id="play-pause"]').length`)) {
		playerButton = eval(`document.querySelectorAll('[data-id="play-pause"]')[0]`);
		sendStatus(playerButton);
		const observer = new MutationObserver((mutations) => {
			sendStatus(playerButton);
		});
		observer.observe(playerButton, { 
			attributes: true, 
			subtree: false 
		});
		clearInterval(checkExist);
	}
}, 500);
const sendStatus = (button) => {
	browser.runtime.sendMessage({
		"player": (button.hasAttribute("disabled")) ? 0 : (button.getAttribute("title") === "Pause") ? 1 : 2
	});
}
browser.runtime.onMessage.addListener((m) => {
	playerButton.click();
});
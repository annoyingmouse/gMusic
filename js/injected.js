const port = chrome.runtime.connect({
    name: "aMusic"
});
const checkExist = setInterval(function () {
    if (document.getElementById("transport")){
        const transport = document.getElementById("transport")
        if (transport.querySelectorAll('music-button[size=medium]').length) {
            const playerButton = transport.querySelector('music-button[size=medium]');
            const observer = new WebKitMutationObserver(function (mutations) {
                getStatus();
            });

            function getStatus() {
                port.postMessage({
                    player: playerButton.getAttribute("aria-label") === "Pause" ? 1 : 2
                });
            }

            observer.observe(playerButton, {
                attributes: true,
                subtree: false
            });
            port.onMessage.addListener(function (msg) {
                if (msg.command) {
                    playerButton.click();
                }
            });
            clearInterval(checkExist);
        }
    }
}, 100);

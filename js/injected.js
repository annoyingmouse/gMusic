var port = chrome.runtime.connect({
    name: "9128Controller"
});
var checkExist = setInterval(function () {
    if (document.getElementById('playButton')) {
        var playerButton = document.getElementById('playButton')
        var observer = new WebKitMutationObserver(function (mutations) {
            getStatus()
        });

        function getStatus () {
            port.postMessage({
                player: playerButton.classList.contains('icon-playerstop') ? 1 : 2
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
}, 1000);

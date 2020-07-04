const port = chrome.runtime.connect({
    name: 'y_Music'
})
const checkExist = setInterval(() => {
    if (document.getElementById('play-pause-button').hasAttribute("title")) {
        const playerButton = document.getElementById('play-pause-button')
        const observer = new MutationObserver(() => port.postMessage({
            player: (playerButton.hasAttribute("disabled")) ? 0 : (playerButton.getAttribute("title") === "Pause") ? 1 : 2
        }))
        observer.observe(playerButton, {
            attributes: true,
            subtree: false
        })
        port.onMessage.addListener(function (msg) {
            msg.command && playerButton.click()
        })
        clearInterval(checkExist)
    }
}, 100)

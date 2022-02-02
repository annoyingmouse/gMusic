const port = chrome.runtime.connect({
    name: 's_Music'
})
const checkExist = setInterval(() => {
    if (document.querySelector('button[data-testid="control-button-playpause"]').hasAttribute("aria-label")) {
        const playerButton = document.querySelector('button[data-testid="control-button-playpause"]')
        const observer = new MutationObserver(() => port.postMessage({
            player: (playerButton.hasAttribute("disabled")) ? 0 : (playerButton.getAttribute("aria-label") === "Pause") ? 1 : 2
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

const port = chrome.runtime.connect({
  name: '9128Control'
})
const checkExist = setInterval(() => {
  if (document.getElementById('playButton')) {
    const playerButton = document.getElementById('playButton')
    const observer = new WebKitMutationObserver(function (mutations) {
      getStatus()
    })
    const getStatus = () => {
      port.postMessage({
        player: playerButton.classList.contains('icon-playerstop') ? 1 : 2
      })
    }
    observer.observe(playerButton, {
      attributes: true,
      subtree: false
    })
    port.onMessage.addListener(function (msg) {
      msg.command && playerButton.click()
    })
    clearInterval(checkExist)
  }
}, 1000)

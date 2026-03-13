// Sends the current player state to the service worker.
// Wrapped in try/catch because the worker may not be awake yet.
const sendMessage = async (state) => {
  try {
    const response = await chrome.runtime.sendMessage({ state })
    console.log(response)
  } catch (e) {
    // Service worker may not be ready yet
  }
}

// Derives a numeric state from the play button's current CSS classes:
//   1 = playing  (the stop icon is shown, meaning playback is active)
//   2 = stopped  (the play icon is shown)
const getPlayerState = (btn) =>
  btn.classList.contains('icon-playerstop') ? 1 : 2

// Handle messages from the service worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ping from the service worker on startup to check if this script is alive.
  if (message.text === 'are_you_there_content_script?') {
    sendResponse({ status: 'yes' })
  }
  // Command to toggle play/stop (sent when the user clicks the extension icon).
  if (message.command !== undefined) {
    const playerButton = document.getElementById('playButton')
    if (playerButton) {
      playerButton.click()
    }
  }
})

// The player renders asynchronously, so poll until the play button exists,
// then set up a MutationObserver to report state changes for the session.
const checkExist = setInterval(() => {
  const playerButton = document.getElementById('playButton')

  if (playerButton) {
    // Send the initial state as soon as the button is ready.
    sendMessage(getPlayerState(playerButton))

    // Watch for class changes on the button and report the new state.
    const observer = new MutationObserver(() => {
      sendMessage(getPlayerState(playerButton))
    })
    observer.observe(playerButton, {
      attributes: true,
      subtree: false
    })

    clearInterval(checkExist)
  }
}, 1000)

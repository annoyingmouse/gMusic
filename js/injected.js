// Sends the current player state and track title to the service worker.
// Wrapped in try/catch because the worker may not be awake yet.
const sendMessage = async (state, title) => {
  try {
    const response = await chrome.runtime.sendMessage({ state, title })
    console.log(response)
  } catch (e) {
    // Service worker may not be ready yet
  }
}

// Derives a numeric state by checking whether the player container has the
// .playing class, which the radio.co player adds/removes on playback change.
//   1 = playing
//   2 = stopped
const getPlayerState = () => document.querySelector('.player.playing') ? 1 : 2

// Reads the current track name from the player.
const getTrackTitle = () => {
  const el = document.querySelector('.track-name')
  return el ? el.textContent.trim() : ''
}

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

// The player renders asynchronously, so poll until the player container and
// button exist, then observe the container for .playing class changes.
const checkExist = setInterval(() => {
  const playerEl = document.querySelector('.player')
  const playerButton = document.getElementById('playButton')

  if (playerEl && playerButton) {
    // Send the initial state as soon as the player is ready.
    sendMessage(getPlayerState(), getTrackTitle())

    // Watch for class changes on the player container (.playing added/removed)
    // and for text changes in the track name element.
    const observer = new MutationObserver(() => {
      sendMessage(getPlayerState(), getTrackTitle())
    })
    observer.observe(playerEl, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })

    clearInterval(checkExist)
  }
}, 1000)

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

// Derives a numeric state from the play/pause button's current attributes:
//   0 = no music (button is disabled)
//   1 = playing  (title is "Pause", meaning music is playing)
//   2 = paused   (title is anything else, e.g. "Play")
const getPlayerState = (btn) =>
  btn.hasAttribute('disabled') ? 0 : btn.getAttribute('title') === 'Pause' ? 1 : 2

// Reads the current track title from the YouTube Music player bar.
const getTrackInfo = () => {
  const titleEl = document.querySelector('.title.ytmusic-player-bar')
  return {
    title: titleEl ? titleEl.textContent.trim() : ''
  }
}

// Handle messages from the service worker.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ping from the service worker on startup to check if this script is alive.
  if (message.text === 'are_you_there_content_script?') {
    sendResponse({ status: 'yes' })
  }
  // Command to toggle play/pause (sent when the user clicks the extension icon).
  // Guard against clicking a disabled button — it can cause a YT Music error.
  if (message.command !== undefined) {
    const playerButton = document.getElementById('play-pause-button')
    if (playerButton && !playerButton.hasAttribute('disabled')) {
      playerButton.click()
    }
  }
})

// YouTube Music renders its player asynchronously, so poll until the
// play/pause button exists and has a title attribute, then set up
// MutationObservers to track state and track changes for the rest of the session.
const checkExist = setInterval(() => {
  const playerButton = document.getElementById('play-pause-button')
  const titleEl = document.querySelector('.title.ytmusic-player-bar')

  if (playerButton && playerButton.hasAttribute('title') && titleEl) {
    const notify = () => {
      const { title } = getTrackInfo()
      sendMessage(getPlayerState(playerButton), title)
    }

    // Send the initial state as soon as the player is ready.
    notify()

    // Watch for attribute changes on the play/pause button (title, disabled).
    const buttonObserver = new MutationObserver(notify)
    buttonObserver.observe(playerButton, {
      attributes: true,
      subtree: false
    })

    // Watch for text changes in the track title element so the tooltip
    // updates when the song changes.
    const titleObserver = new MutationObserver(notify)
    titleObserver.observe(titleEl, {
      characterData: true,
      childList: true,
      subtree: true
    })

    clearInterval(checkExist)
  }
}, 100)

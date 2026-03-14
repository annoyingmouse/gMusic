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

// Derives a numeric state by checking whether any element has the .playing
// class — the radio.co player adds this to an ancestor on playback start.
//   1 = playing
//   2 = stopped
const getPlayerState = () => document.querySelector('.playing') ? 1 : 2

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
  // The content script calls audio.play()/pause() directly rather than clicking
  // the button. Extension content scripts with host permissions for the origin
  // are not subject to Chrome's autoplay policy, so audio.play() succeeds even
  // on the first interaction after a page refresh (unlike page-context JS, which
  // is what btn.click() ultimately invokes). Falls back to btn.click() if no
  // audio element is found (e.g. the player hasn't loaded yet).
  if (message.command !== undefined) {
    sendResponse({ received: true })
    const audio = document.querySelector('audio')
    if (audio) {
      if (audio.paused) audio.play().catch(() => {})
      else audio.pause()
    } else {
      const btn = document.getElementById('playButton')
      if (btn) btn.click()
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

    // Watch for any class change anywhere in the page — the .playing class
    // may be applied to an ancestor outside .player, so we observe broadly.
    const observer = new MutationObserver(() => {
      sendMessage(getPlayerState(), getTrackTitle())
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })

    clearInterval(checkExist)
  }
}, 1000)

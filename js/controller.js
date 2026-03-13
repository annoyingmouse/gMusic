import { setPlayerIcon } from './utils.js'

// Player states:
//   0 = tab open, no music (button disabled)
//   1 = playing
//   2 = paused
//   3 = no YouTube Music tab open

// Reads the last known player state and track title from session storage.
// Defaults to 3 (no tab) and an empty string if nothing has been saved yet.
const getSessionData = async () => {
  const { playerState = 3, title = '' } = await chrome.storage.session.get(['playerState', 'title'])
  return { playerState, title }
}

// Persists player state and track title to session storage so it survives
// service worker restarts within the same browser session.
const saveSessionData = (playerState, title) =>
  chrome.storage.session.set({ playerState, title })

// Updates the toolbar icon tooltip based on the current state.
const updateTitle = (state, title) => {
  const text = state === 3
    ? 'YouTube Music is not open'
    : (state !== 0 && title) ? title : 'No music playing'
  chrome.action.setTitle({ title: text })
}

// Sets the icon and tooltip to the "no tab" state and clears the saved title.
const setNoTabState = () => {
  saveSessionData(3, '')
  setPlayerIcon(3)
  updateTitle(3, '')
}

// Programmatically injects the content script into a tab that was already
// open when the extension was installed or reloaded.
const injectScript = id => {
  chrome.scripting.executeScript({
    target: { tabId: id },
    files: ['js/injected.js']
  })
}

// Listen for state updates pushed by the content script whenever the
// YouTube Music play/pause button or track title changes. Updates the icon,
// the tooltip, and persists the new state to session storage.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.state !== undefined) {
    const { state, title } = message
    saveSessionData(state, title)
    setPlayerIcon(state)
    updateTitle(state, title)
    sendResponse({ received: true })
  }
})

// When the user clicks the extension icon, find the YouTube Music tab and
// send it a command to toggle play/pause. Only send if music is actually
// playing or paused — state 0 means the button is disabled, state 3 means
// there is no tab, so there is nothing to control in either case.
chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://music.youtube.com/*' })
  if (!tab) return
  const { playerState } = await getSessionData()
  if (playerState === 1 || playerState === 2) {
    chrome.tabs.sendMessage(tab.id, { command: playerState })
  }
})

// When any tab is closed, check whether a YouTube Music tab is still open.
chrome.tabs.onRemoved.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://music.youtube.com/*' })
  if (!tab) setNoTabState()
})

// When a tab navigates away from YouTube Music, check if any remain.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url !== undefined) {
    const [tab] = await chrome.tabs.query({ url: 'https://music.youtube.com/*' })
    if (!tab) setNoTabState()
  }
})

// On service worker startup: restore the icon and tooltip from session storage
// so they don't reset after a worker restart, then check whether YouTube Music
// is actually open. If the content script isn't responding (e.g. the tab was
// open before the extension loaded), inject it.
;(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://music.youtube.com/*' })

  if (!tab) {
    setNoTabState()
    return
  }

  const { playerState, title } = await getSessionData()
  setPlayerIcon(playerState)
  updateTitle(playerState, title)

  try {
    const message = await chrome.tabs.sendMessage(tab.id, { text: 'are_you_there_content_script?' })
    if (message.status !== 'yes') {
      injectScript(tab.id)
    }
  } catch (e) {
    // sendMessage throws if no content script is listening — inject it now.
    injectScript(tab.id)
  }
})()

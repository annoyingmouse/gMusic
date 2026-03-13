import { setPlayerIcon } from './utils.js'

// Player states:
//   0 = tab open, player not yet active
//   1 = playing
//   2 = stopped
//   3 = no 9128 Live tab open

// Reads the last known player state and track title from session storage.
// Defaults to 3 (no tab) if nothing has been saved yet.
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
    ? '9128 Live is not open'
    : state === 1 && title ? title : state === 1 ? 'Playing' : state === 2 ? 'Stopped' : 'Not playing'
  chrome.action.setTitle({ title: text })
}

// Sets the icon and tooltip to the "no tab" state.
const setNoTabState = () => {
  saveSessionData(3, '')
  setPlayerIcon(3)
  updateTitle(3, '')
}

// Programmatically injects the content script into a tab that was already
// open when the extension was installed or reloaded.
const injectScript = id => {
  chrome.scripting.executeScript({
    target: { tabId: id, allFrames: true },
    files: ['js/injected.js']
  })
}

// Listen for state updates pushed by the content script whenever the
// player button changes. Updates the icon, tooltip, and persists the state.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.state !== undefined) {
    const { state, title } = message
    saveSessionData(state, title)
    setPlayerIcon(state)
    updateTitle(state, title)
    sendResponse({ received: true })
  }
})

// When the user clicks the extension icon, find the player tab and
// send it a command to toggle play/stop. Only send if the player is active.
chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
  if (!tab) return
  const { playerState } = await getSessionData()
  if (playerState === 1 || playerState === 2) {
    chrome.tabs.sendMessage(tab.id, { command: playerState })
  }
})

// When any tab is closed, check whether a player tab is still open.
chrome.tabs.onRemoved.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
  if (!tab) setNoTabState()
})

// When a tab navigates away from the player, check if any remain.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url !== undefined) {
    const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
    if (!tab) setNoTabState()
  }
})

// On service worker startup: restore the icon and tooltip from session storage,
// then check whether the player tab is open. Inject the content script if needed.
;(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })

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

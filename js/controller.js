import { setPlayerIcon } from './utils.js'

// Player states:
//   0 = tab open, player not yet active
//   1 = playing
//   2 = stopped
//   3 = no 9128 Live tab open

// Reads the last known player state, track title, and first-play flag from
// session storage. hasPlayedOnce is false until the player reports state 1
// for the first time after a page load.
const getSessionData = async () => {
  const { playerState = 3, title = '', hasPlayedOnce = false } =
    await chrome.storage.session.get(['playerState', 'title', 'hasPlayedOnce'])
  return { playerState, title, hasPlayedOnce }
}

const saveSessionData = (playerState, title) =>
  chrome.storage.session.set({ playerState, title })

// Applies the toolbar icon and tooltip. When the player is stopped but has
// never played since the last page load, shows a grey triangle (icon state 3)
// and "Press play first" instead of the normal teal triangle and "Stopped".
const applyState = (state, title, hasPlayedOnce) => {
  const needsFirstPlay = state === 2 && !hasPlayedOnce
  setPlayerIcon(needsFirstPlay ? 3 : state)
  const text = state === 3
    ? '9128 Live is not open'
    : state === 1 && title ? `Playing: ${title}`
    : state === 1 ? 'Playing'
    : needsFirstPlay ? 'Click play on 9128.live to start'
    : state === 2 ? 'Stopped'
    : 'Not playing'
  chrome.action.setTitle({ title: text })
}

// Sets the icon and tooltip to the "no tab" state.
const setNoTabState = () => {
  saveSessionData(3, '')
  applyState(3, '', false)
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
// Also tracks whether playback has been triggered at least once (so the icon
// can transition from "Press play first" to "Stopped" after the first play),
// and fires any pending command queued while the content script was loading.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.state !== undefined) {
    const { state, title } = message
    saveSessionData(state, title)

    chrome.storage.session.get(['hasPlayedOnce', 'pendingCommand']).then(({ hasPlayedOnce = false, pendingCommand }) => {
      const nowPlayed = hasPlayedOnce || state === 1
      if (!hasPlayedOnce && state === 1) chrome.storage.session.set({ hasPlayedOnce: true })
      applyState(state, title, nowPlayed)

      if (pendingCommand !== undefined && sender.tab) {
        chrome.storage.session.remove(['pendingCommand'])
        chrome.tabs.sendMessage(sender.tab.id, { command: pendingCommand })
      }
    })

    sendResponse({ received: true })
  }
})

// When the user clicks the extension icon, attempt to play/pause via
// executeScript (targets the embed frame directly). If the player hasn't been
// manually started yet, the icon already shows "Press play first" — do nothing.
chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
  if (!tab) return
  const { playerState, hasPlayedOnce } = await getSessionData()
  if (playerState !== 1 && playerState !== 2) return

  const shouldPlay = playerState === 2

  // Icon already communicates "Press play first" — wait for manual play.
  if (shouldPlay && !hasPlayedOnce) return

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: async (shouldPlay) => {
        if (!location.href.includes('embed.radio.co')) return null
        const audio = document.querySelector('audio')
        if (!audio) return null
        if (shouldPlay) {
          try { await audio.play(); return true } catch (e) { return false }
        } else {
          audio.pause()
          return true
        }
      },
      args: [shouldPlay]
    })
    if (results.some(r => r.result === true)) return
  } catch (e) {
    // executeScript failed entirely — fall through to sendMessage
  }

  // Fall back to sendMessage (pause always works; play works after sticky activation)
  try {
    await chrome.tabs.sendMessage(tab.id, { command: playerState })
  } catch (e) {
    chrome.storage.session.set({ pendingCommand: playerState })
  }
})

// When any tab is closed, check whether a player tab is still open.
chrome.tabs.onRemoved.addListener(async () => {
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
  if (!tab) setNoTabState()
})

// When a tab navigates, check if 9128.live is still open. When the player tab
// itself starts loading (refresh or navigation), reset hasPlayedOnce so the
// icon returns to "Press play first" until manual playback is triggered again.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url === undefined && changeInfo.status !== 'loading') return
  const [tab] = await chrome.tabs.query({ url: 'https://9128.live/*' })
  if (changeInfo.url !== undefined && !tab) setNoTabState()
  if (changeInfo.status === 'loading' && tab?.id === tabId) {
    chrome.storage.session.set({ hasPlayedOnce: false })
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

  const { playerState, title, hasPlayedOnce } = await getSessionData()
  applyState(playerState, title, hasPlayedOnce)

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

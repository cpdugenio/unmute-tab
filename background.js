import {getColour, setDebugMode} from './config.js'
import {error, warn, info, debug} from './debug.js'

// Set the toolbar icon to the audible one.
function doAudibleIcon(tab) {
  debug(`set icon to audible, tab ${JSON.stringify(tab)}`)
  getColour(tab).then(colour => {
    chrome.action.setIcon({
      "path": {
        "19": `images/audible.png`,
        "38": `images/audible.png`,
      },
      "tabId": tab.id,
    })
    chrome.action.setTitle({
      "title": "Mute tab",
      "tabId": tab.id,
    })
  }).catch(e => {
    error("Couldn't load settings:", e)
  })
}

// Set the toolbar icon to the muted one.
function doMutedIcon(tab) {
  debug(`set icon to muted, tab ${JSON.stringify(tab)}`)
  getColour(tab).then(colour => {
    chrome.action.setIcon({
      "path": {
        "19": `images/muted.png`,
        "38": `images/muted.png`,
      },
      "tabId": tab.id,
    })
    chrome.action.setTitle({
      "title": "Unmute tab",
      "tabId": tab.id,
    })
  }).catch(e => {
    error("Couldn't load settings:", e)
  })
}

function updateIcon(tab) {
  if (tab.mutedInfo.muted) {
    doMutedIcon(tab)
  } else {
    doAudibleIcon(tab)
  }
}

// Toggle the mute state of a tab.
function toggleMuted(tab) {
  debug(`toggle mute state, tab ${JSON.stringify(tab)}`)
  let isMuted = tab.mutedInfo.muted
  if(isMuted){
    chrome.tabs.update(tab.id, {"muted": !isMuted})
    tab.willUnmute = true
    setInterval(
       function(){ chrome.tabs.update(tab.id, {"muted": true}); tab.willUnmute = false; }, 10*60*1000
    )
  }
  // Note: the icon is updated elsewhere (this is to make sure that the
  // icon doesn't get out of sync if the tab mute state is changed by
  // something else).
}

// Event listener for the toolbar icon being clicked.
chrome.action.onClicked.addListener(tab => {
  info(`icon clicked, tab ${JSON.stringify(tab)}`)
  if (tab !== undefined) {
    toggleMuted(tab)
  } else {
    warn("couldn't toggle, no tab!")
  }
})

// Update the icon whenever necessary.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.hasOwnProperty("mutedInfo") || changeInfo.hasOwnProperty("status")) {
    updateIcon(tab)
  }
  if (changeInfo.status == "complete"){
    console.log("Complete")
    if ((!tab.hasOwnProperty("willUnmute") || !tab.willUnmute) && tab.url.indexOf("https://www.twitch.tv") != -1) {
      console.log("muting")
      chrome.tabs.update(tab.id, {"muted": true})
    }
    console.log("hello")
  }
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        updateIcon(tab)
      })
    })
  }
})

chrome.runtime.onStartup.addListener(() => {
  setDebugMode(false)
})

chrome.runtime.onInstalled.addListener(() => {
  setDebugMode(false)
})

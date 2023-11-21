import {getColour, setDebugMode} from './config.js'
import {error, warn, info, debug} from './debug.js'

// Map of time to id
let muted = new Map()

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


function clearTab(tab){
    console.log("Trying to clear tab")
    if(muted.delete(String(tab.id))){
      console.log("Clearing tab")
      chrome.alarms.clear(String(tab.id), function() {console.log("Cleared tab " + String(tab.id))})
    }
}

// Toggle the mute state of a tab.
function toggleMuted(tab) {
  debug(`toggle mute state, tab ${JSON.stringify(tab)}`)
  let isMuted = tab.mutedInfo.muted
  if(isMuted){
    console.log("unmuting")
    chrome.tabs.update(tab.id, {"muted": !isMuted})
    tab.willUnmute = true
    let mins = 10
    let timeout = Date.now() + mins*60*1000
    muted.set(String(tab.id), tab)
    console.log(new Date(Date.now()))
    console.log(new Date(timeout))
    console.log(String(tab.id))
    chrome.alarms.create(String(tab.id), {delayInMinutes: mins})
  } else {
    console.log("muting")
    chrome.tabs.update(tab.id, {"muted": true})
    tab.willUnmute = false
    clearTab(tab)
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


// Unmute when alarm
function muteTab(tab) {
   console.log("muting tab")
   chrome.tabs.update(tab.id, {"muted": true});
   tab.willUnmute = false 
}

chrome.alarms.onAlarm.addListener(function(alarm){
    console.log(alarm)
    let tabId = alarm.name
    if(muted.has(tabId)){
	    muteTab(muted.get(tabId))
	    muted.delete(tabId)
    } else {
	    console.log("Couldnt find tab")
    }
});


// Update the icon whenever necessary.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.hasOwnProperty("mutedInfo") || changeInfo.hasOwnProperty("status")) {
    updateIcon(tab)
  }
  if (changeInfo.status == "loading" && !changeInfo.hasOwnProperty("url")){
    clearTab(tab)
  }
  if (changeInfo.status == "complete"){
    console.log("Complete")
    let sites = [
      "https://www.twitch.tv",
      "https://www.youtube.com",
    ]
    if ((!tab.hasOwnProperty("willUnmute") || !tab.willUnmute) && sites.some((site) => tab.url.indexOf(site) != -1)) {
      chrome.tabs.update(tab.id, {"muted": true})
    } else {
      chrome.tabs.update(tab.id, {"muted": false})
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


const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

const apiVersion = "4.0.1";

// --- Notification and Badge Logic ---
chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ naft: true });
    chrome.storage.sync.set({ fvui: true });
    chrome.storage.sync.set({ unread_conversations_count: 0 });
    chrome.storage.sync.set({ unread_notifications_count: 0 });
    chrome.alarms.create("naft", { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(function () {
    chrome.storage.sync.get(["naft"], function (e) {
        if (e.naft) {
            chrome.alarms.create("naft", { periodInMinutes: 1 });
            chrome.action.setBadgeText({ text: "" });
        } else {
            chrome.action.setBadgeText({ text: "OFF" });
            chrome.action.setBadgeBackgroundColor({ color: "#ec4899" });
        }
    });
    chrome.storage.sync.set({ unread_conversations_count: 0 });
    chrome.storage.sync.set({ unread_notifications_count: 0 });
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let key in changes) {
        let storageChange = changes[key];
        if (key === "naft") {
            if (storageChange.newValue) {
                chrome.alarms.create("naft", { periodInMinutes: 1 });
                chrome.action.setBadgeText({ text: "" });
            } else {
                chrome.alarms.clear("naft");
                chrome.action.setBadgeText({ text: "OFF" });
                chrome.action.setBadgeBackgroundColor({ color: "#ec4899" });
                chrome.storage.sync.set({ unread_conversations_count: 0 });
                chrome.storage.sync.set({ unread_notifications_count: 0 });
            }
        } else if (key === "unread_notifications_count") {
            if (storageChange.newValue > 0) {
                let notificationOptions = { type: "basic", title: "Fiverr Plus", message: "An unread message waiting for you.", iconUrl: "images/notification-icon.png" };
                chrome.notifications.create(notificationOptions);
                chrome.storage.sync.get(["unread_conversations_count"], function (result) {
                    chrome.action.setBadgeText({ text: (result.unread_conversations_count + storageChange.newValue).toString() });
                    chrome.action.setBadgeBackgroundColor({ color: "#9d4edd" });
                });
            } else {
                chrome.action.setBadgeText({ text: "" });
            }
        } else if (key === "unread_conversations_count") {
            if (storageChange.newValue > 0) {
                let notificationOptions = { type: "basic", title: "Fiverr Plus", message: "An unread message waiting for you.", iconUrl: "images/notification-icon.png" };
                chrome.notifications.create(notificationOptions);
                chrome.storage.sync.get(["unread_notifications_count"], function (result) {
                    chrome.action.setBadgeText({ text: (result.unread_notifications_count + storageChange.newValue).toString() });
                    chrome.action.setBadgeBackgroundColor({ color: "#9d4edd" });
                });
            } else {
                chrome.action.setBadgeText({ text: "" });
            }
        } else if (key === "autoRefreshTabs") {
            // Reset timers when auto refresh settings change
            const newTabs = storageChange.newValue || {};
            const oldTabs = storageChange.oldValue || {};
            
            // Check for any changes in tab settings
            for (const tabId in newTabs) {
                const newSettings = newTabs[tabId];
                const oldSettings = oldTabs[tabId];
                
                // If settings changed (enabled, useRandom, minTime, maxTime, min, sec), reset the timer
                if (!oldSettings || 
                    oldSettings.enabled !== newSettings.enabled ||
                    oldSettings.useRandom !== newSettings.useRandom ||
                    oldSettings.minTime !== newSettings.minTime ||
                    oldSettings.maxTime !== newSettings.maxTime ||
                    oldSettings.min !== newSettings.min ||
                    oldSettings.sec !== newSettings.sec) {
                    // Delete existing timer so it gets reinitialized with new settings
                    if (refreshTimers[tabId]) {
                        delete refreshTimers[tabId];
                    }
                }
            }
        }
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "naft") {
        fetch("https://www.fiverr.com/notification_items/preview/0").then(e => e.json()).then(e => {
            chrome.storage.sync.set({ unread_notifications_count: e.unread_notifications_count });
        }).catch(e => {
            chrome.storage.sync.set({ unread_notifications_count: 0 });
            chrome.action.setBadgeText({ text: "" });
        });
        fetch("https://www.fiverr.com/conversations/preview/0").then(e => e.json()).then(e => {
            chrome.storage.sync.set({ unread_conversations_count: e.unread_conversations_count });
        }).catch(e => {
            chrome.storage.sync.set({ unread_conversations_count: 0 });
            chrome.action.setBadgeText({ text: "" });
        });
    }
});

// --- Auto Refresh Logic ---
let refreshTimers = {};

function timeViewer(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

setInterval(() => {
    chrome.storage.sync.get("autoRefreshTabs", (result) => {
        const tabs = result.autoRefreshTabs || {};
        for (const tabId in tabs) {
            if (tabs[tabId].enabled) {
                if (!refreshTimers[tabId]) {
                    // Check if random refresh is enabled
                    if (tabs[tabId].useRandom && tabs[tabId].minTime !== undefined && tabs[tabId].maxTime !== undefined) {
                        // Generate random time between minTime and maxTime (in minutes)
                        const minSeconds = tabs[tabId].minTime * 60;
                        const maxSeconds = tabs[tabId].maxTime * 60;
                        const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
                        refreshTimers[tabId] = {
                            remaining: randomSeconds,
                            interval: randomSeconds,
                            useRandom: true
                        };
                    } else {
                        // Use fixed interval (existing behavior)
                        refreshTimers[tabId] = {
                            remaining: (tabs[tabId].min * 60) + tabs[tabId].sec,
                            interval: (tabs[tabId].min * 60) + tabs[tabId].sec,
                            useRandom: false
                        };
                    }
                }

                refreshTimers[tabId].remaining--;

                chrome.tabs.get(parseInt(tabId), (tab) => {
                    if (chrome.runtime.lastError) {
                        // Tab no longer exists, clean up
                        delete refreshTimers[tabId];
                        chrome.storage.sync.get("autoRefreshTabs", (result) => {
                            const tabs = result.autoRefreshTabs || {};
                            if (tabs[tabId]) {
                                delete tabs[tabId];
                                chrome.storage.sync.set({ autoRefreshTabs: tabs });
                            }
                        });
                        return;
                    }
                    if (tab && tab.active) {
                        // Badge removed - countdown will display in popup instead
                    }
                });

                if (refreshTimers[tabId] && refreshTimers[tabId].remaining <= 0) {
                    chrome.tabs.reload(parseInt(tabId), () => {
                        if (chrome.runtime.lastError) {
                            // Tab no longer exists, clean up
                            delete refreshTimers[tabId];
                            chrome.storage.sync.get("autoRefreshTabs", (result) => {
                                const tabs = result.autoRefreshTabs || {};
                                if (tabs[tabId]) {
                                    delete tabs[tabId];
                                    chrome.storage.sync.set({ autoRefreshTabs: tabs });
                                }
                            });
                            return;
                        }
                        // If using random refresh, generate a new random interval
                        if (refreshTimers[tabId] && refreshTimers[tabId].useRandom && tabs[tabId].minTime !== undefined && tabs[tabId].maxTime !== undefined) {
                            const minSeconds = tabs[tabId].minTime * 60;
                            const maxSeconds = tabs[tabId].maxTime * 60;
                            const randomSeconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
                            refreshTimers[tabId].remaining = randomSeconds;
                            refreshTimers[tabId].interval = randomSeconds;
                        } else if (refreshTimers[tabId]) {
                            // Use fixed interval
                            refreshTimers[tabId].remaining = refreshTimers[tabId].interval;
                        }
                    });
                }
            } else {
                if (refreshTimers[tabId]) {
                    delete refreshTimers[tabId];
                    chrome.action.setBadgeText({ text: "", tabId: parseInt(tabId) }, () => {
                        if (chrome.runtime.lastError) {
                            // Tab no longer exists, ignore error
                        }
                    });
                }
            }
        }
    });
}, 1000);

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.sync.get("autoRefreshTabs", (result) => {
        const tabs = result.autoRefreshTabs || {};
        if (tabs[tabId]) {
            delete tabs[tabId];
            chrome.storage.sync.set({ autoRefreshTabs: tabs });
        }
    });
    if (refreshTimers[tabId]) {
        delete refreshTimers[tabId];
    }
});

// --- Other Extension Logic ---
var globalPort, tabIds = [], tabsLoaded = 0, active = !1, searchMode = "group", smIndex = 0, urls = [], username = "";

function createTab(e) { chrome.tabs.create({ url: e, active: !1 }, e => { tabIds.push(e.id), smIndex++ }) }
function checkRank(e, t) { let a = 1; for (let n of e) { if (t === n.seller_name) return a; a++ } return null }
function resetScrape() { active = !1, tabIds = [], tabsLoaded = 0, smIndex = 0, urls = [], username = "", chrome.action.setIcon({ path: "icon.png" }) }

chrome.runtime.onConnectExternal.addListener(function (e) {
    e.onMessage.addListener(function (t) {
        console.log("Message Received from Web", t);
        if ("4.0.1" !== t.version) {
            e.postMessage({ status: "outdated" });
            e.disconnect();
        } else if (!active) {
            searchMode = t.searchMode;
            e.postMessage({ status: "accepted" });
            resetScrape();
            active = true;
            chrome.action.setIcon({ path: "icon-red.png" });
            globalPort = e;
            if ("group" == searchMode) {
                t.urls.forEach(e => { chrome.tabs.create({ url: e, active: !1 }, e => { tabIds.push(e.id) }) });
            } else {
                urls = t.urls;
                username = t.username;
                createTab(t.urls[smIndex]);
            }
        } else {
            e.postMessage({ status: "busy" });
            e.disconnect();
        }
    });
});

chrome.runtime.onMessage.addListener(function (e, t, a) {
    // Handle countdown query from popup.js
    if (e && e.action === "getCountdown" && typeof e.tabId !== "undefined") {
        const tabId = e.tabId.toString();
        if (refreshTimers[tabId] && typeof refreshTimers[tabId].remaining === "number") {
            a({ remaining: refreshTimers[tabId].remaining });
        } else {
            a({ remaining: null });
        }
        return;
    }
    if (e.status && t.tab && "group" === e.searchMode && "group" === searchMode) {
        console.log("[GROUP MODE] Message Received from Scraper", t.tab.id);
        if (tabIds.includes(t.tab.id)) {
            tabsLoaded++;
            chrome.tabs.remove(t.tab.id, () => {
                if (chrome.runtime.lastError) {
                    // Tab already closed, ignore error
                }
            });
        }
        if (tabsLoaded === tabIds.length && active) {
            globalPort.postMessage({ status: "completed" });
            globalPort.disconnect();
            resetScrape();
        }
    } else if (e.status && t.tab && "single" === e.searchMode && "single" === searchMode) {
        console.log("[SINGLE MODE] Message Received from Scraper", t.tab.id);
        if (tabIds.includes(t.tab.id)) {
            chrome.tabs.remove(t.tab.id, () => {
                if (chrome.runtime.lastError) {
                    // Tab already closed, ignore error
                }
            });
            let n = checkRank(e.listings, username);
            if (null != n) {
                let s = 48 * (e.page - 1) + n;
                globalPort.postMessage({ status: "completed", found: !0, rank: s, page: e.page });
                globalPort.disconnect();
                resetScrape();
            } else if (smIndex < 5) {
                globalPort.postMessage({ status: "update", page: smIndex });
                createTab(urls[smIndex]);
            } else {
                globalPort.postMessage({ status: "completed", found: !1 });
                globalPort.disconnect();
                resetScrape();
            }
        }
    }
});

chrome.runtime.onMessageExternal.addListener(function (e, t, a) {
    console.log("Message Received from Web", e);
    if ("reset" === e.action) {
        resetScrape();
        a({ status: "completed" });
    }
});
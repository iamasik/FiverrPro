document.addEventListener("DOMContentLoaded", function() {
    // --- Countdown Timer Display Logic ---
    let countdownInterval = null;
    
    function formatTime(seconds) {
        if (seconds <= 0) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateCountdownDisplay(tabId) {
        chrome.storage.sync.get("autoRefreshTabs", function(result) {
            const settings = result.autoRefreshTabs && result.autoRefreshTabs[tabId];
            const timerDisplay = document.getElementById("timer-text");
            
            if (!settings || !settings.enabled) {
                timerDisplay.textContent = "--:--";
                return;
            }

            chrome.runtime.sendMessage({ action: "getCountdown", tabId: tabId }, function(response) {
                if (response && typeof response.remaining === "number") {
                    timerDisplay.textContent = formatTime(response.remaining);
                } else {
                    timerDisplay.textContent = "--:--";
                }
            });
        });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0] || !tabs[0].id) return;
        const tabId = tabs[0].id;
        
        // Start interval to update countdown every second
        updateCountdownDisplay(tabId);
        countdownInterval = setInterval(() => updateCountdownDisplay(tabId), 1000);
        
        // Clear interval on popup close
        window.addEventListener('unload', () => clearInterval(countdownInterval));
    });


    // Load saved states
    chrome.storage.sync.get(["naft"], function(result) {
        document.getElementById("naft").checked = result.naft || false;
    });
    
    chrome.storage.sync.get(["hmbl"], function(result) {
        document.getElementById("hmbl").checked = result.hmbl || false;
    });
    
    chrome.storage.sync.get(["fvdm"], function(result) {
        document.getElementById("fvdm").checked = result.fvdm || false;
    });
    
    chrome.storage.sync.get(["hop"], function(result) {
        document.getElementById("hop").checked = result.hop || false;
    });

    // --- Auto Refresh Logic ---
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0] || !tabs[0].id) return;
        const tabId = tabs[0].id;

        const arftToggle = document.getElementById("arft");
        const arftMin = document.getElementById("arft_min");
        const arftSec = document.getElementById("arft_sec");

        // Load saved state for the current tab
        chrome.storage.sync.get("autoRefreshTabs", function(result) {
            const settings = result.autoRefreshTabs && result.autoRefreshTabs[tabId];
            arftToggle.checked = settings ? settings.enabled : false;
            arftMin.value = settings ? settings.min : 3;
            arftSec.value = settings ? settings.sec : 0;
        });

        function saveSettings() {
            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const autoRefreshTabs = result.autoRefreshTabs || {};
                autoRefreshTabs[tabId] = {
                    enabled: arftToggle.checked,
                    min: parseInt(arftMin.value) || 0,
                    sec: parseInt(arftSec.value) || 0
                };
                chrome.storage.sync.set({ autoRefreshTabs });
            });
        }

        arftToggle.addEventListener("change", saveSettings);
        arftMin.addEventListener("change", saveSettings);
        arftSec.addEventListener("change", saveSettings);
    });

    // Notification Alerts toggle
    document.getElementById("naft").addEventListener("change", function() {
        let isChecked = document.getElementById("naft").checked;
        chrome.storage.sync.set({ naft: isChecked }, function() {});
    });

    // Hide Balance toggle
    document.getElementById("hmbl").addEventListener("change", function() {
        let isChecked = document.getElementById("hmbl").checked;
        chrome.storage.sync.set({ hmbl: isChecked }, function() {});
    });

    // Dark Mode toggle
    document.getElementById("fvdm").addEventListener("change", function() {
        let isChecked = document.getElementById("fvdm").checked;
        chrome.storage.sync.set({ fvdm: isChecked }, function() {});
    });

    // Hide Order Price toggle (placeholder)
    document.getElementById("hop").addEventListener("change", function() {
        let isChecked = document.getElementById("hop").checked;
        chrome.storage.sync.set({ hop: isChecked }, function() {});
    });
});

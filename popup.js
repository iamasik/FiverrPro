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
        const settingsIcon = document.getElementById("arft_settings");
        const modal = document.getElementById("advancedSettingsModal");
        const closeModal = document.getElementById("closeModal");
        const cancelModal = document.getElementById("cancelModal");
        const saveSettingsBtn = document.getElementById("saveSettings");
        const minTimeInput = document.getElementById("minTime");
        const maxTimeInput = document.getElementById("maxTime");

        // Load saved state for the current tab
        chrome.storage.sync.get("autoRefreshTabs", function(result) {
            const settings = result.autoRefreshTabs && result.autoRefreshTabs[tabId];
            arftToggle.checked = settings ? settings.enabled : false;
            arftMin.value = settings ? settings.min : 3;
            arftSec.value = settings ? settings.sec : 0;
            
            // Load random refresh settings
            if (settings) {
                minTimeInput.value = settings.minTime || 0;
                maxTimeInput.value = settings.maxTime || 10;
            } else {
                minTimeInput.value = 0;
                maxTimeInput.value = 10;
            }
        });

        function saveSettings() {
            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const autoRefreshTabs = result.autoRefreshTabs || {};
                const currentSettings = autoRefreshTabs[tabId] || {};
                autoRefreshTabs[tabId] = {
                    ...currentSettings,
                    enabled: arftToggle.checked,
                    min: parseInt(arftMin.value) || 0,
                    sec: parseInt(arftSec.value) || 0
                };
                chrome.storage.sync.set({ autoRefreshTabs });
            });
        }

        function openModal() {
            // Load current values into modal inputs
            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const settings = result.autoRefreshTabs && result.autoRefreshTabs[tabId];
                if (settings) {
                    minTimeInput.value = settings.minTime || 0;
                    maxTimeInput.value = settings.maxTime || 10;
                } else {
                    minTimeInput.value = 0;
                    maxTimeInput.value = 10;
                }
            });
            modal.classList.add("active");
        }

        function closeModalFunc() {
            modal.classList.remove("active");
        }

        function saveAdvancedSettings() {
            const minTime = parseInt(minTimeInput.value) || 0;
            const maxTime = parseInt(maxTimeInput.value) || 10;

            // Validate that max is greater than or equal to min
            if (maxTime < minTime) {
                alert("Maximum time must be greater than or equal to minimum time.");
                return;
            }

            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const autoRefreshTabs = result.autoRefreshTabs || {};
                const currentSettings = autoRefreshTabs[tabId] || {};
                autoRefreshTabs[tabId] = {
                    ...currentSettings,
                    minTime: minTime,
                    maxTime: maxTime,
                    useRandom: true
                };
                chrome.storage.sync.set({ autoRefreshTabs }, function() {
                    closeModalFunc();
                });
            });
        }

        // Event listeners
        arftToggle.addEventListener("change", saveSettings);
        arftMin.addEventListener("change", saveSettings);
        arftSec.addEventListener("change", saveSettings);
        settingsIcon.addEventListener("click", openModal);
        closeModal.addEventListener("click", closeModalFunc);
        cancelModal.addEventListener("click", closeModalFunc);
        saveSettingsBtn.addEventListener("click", saveAdvancedSettings);

        // Close modal when clicking outside
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                closeModalFunc();
            }
        });

        // Close modal on Escape key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && modal.classList.contains("active")) {
                closeModalFunc();
            }
        });
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

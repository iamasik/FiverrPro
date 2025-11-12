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
        const regularControls = document.getElementById("regularControls");
        const randomRefreshInfo = document.getElementById("randomRefreshInfo");
        const stopRandomBtn = document.getElementById("stopRandomBtn");

        // Function to update UI based on random refresh state
        function updateUIForRandomRefresh(settings) {
            if (settings && settings.useRandom && settings.enabled) {
                // Hide regular controls, show random refresh info
                regularControls.style.display = "none";
                randomRefreshInfo.style.display = "flex";
            } else {
                // Show regular controls, hide random refresh info
                regularControls.style.display = "flex";
                randomRefreshInfo.style.display = "none";
            }
        }

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

            // Update UI based on random refresh state
            updateUIForRandomRefresh(settings);
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
                    // Update UI after saving
                    updateUIForRandomRefresh(autoRefreshTabs[tabId]);
                });
            });
        }

        function stopRandomRefresh() {
            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const autoRefreshTabs = result.autoRefreshTabs || {};
                const currentSettings = autoRefreshTabs[tabId] || {};
                autoRefreshTabs[tabId] = {
                    ...currentSettings,
                    useRandom: false
                };
                chrome.storage.sync.set({ autoRefreshTabs }, function() {
                    // Update UI after stopping random refresh
                    updateUIForRandomRefresh(autoRefreshTabs[tabId]);
                });
            });
        }

        // Event listeners
        arftToggle.addEventListener("change", function() {
            saveSettings();
            // Update UI when toggle changes
            chrome.storage.sync.get("autoRefreshTabs", function(result) {
                const settings = result.autoRefreshTabs && result.autoRefreshTabs[tabId];
                updateUIForRandomRefresh(settings);
            });
        });
        arftMin.addEventListener("change", saveSettings);
        arftSec.addEventListener("change", saveSettings);
        settingsIcon.addEventListener("click", openModal);
        closeModal.addEventListener("click", closeModalFunc);
        cancelModal.addEventListener("click", closeModalFunc);
        saveSettingsBtn.addEventListener("click", saveAdvancedSettings);
        stopRandomBtn.addEventListener("click", stopRandomRefresh);

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

        // Listen for storage changes to update UI
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (namespace === "sync" && changes.autoRefreshTabs) {
                const newTabs = changes.autoRefreshTabs.newValue || {};
                const settings = newTabs[tabId];
                if (settings) {
                    // Update toggle state
                    arftToggle.checked = settings.enabled || false;
                    arftMin.value = settings.min || 3;
                    arftSec.value = settings.sec || 0;
                    // Update UI for random refresh
                    updateUIForRandomRefresh(settings);
                }
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

    // --- AI Assist Logic ---
    const aiAssistToggle = document.getElementById("ai-assist-toggle");
    const aiApiKeyInput = document.getElementById("ai-api-key");
    const aiModelSelect = document.getElementById("ai-model");
    const aiAddBtn = document.getElementById("ai-add-btn");
    const aiEditBtn = document.getElementById("ai-edit-btn");
    const aiDeleteBtn = document.getElementById("ai-delete-btn");
    const aiAssistForm = document.getElementById("ai-assist-form");
    const aiAssistSaved = document.getElementById("ai-assist-saved");
    const aiSavedKeyDisplay = document.getElementById("ai-saved-key-display");
    const aiSavedModelDisplay = document.getElementById("ai-saved-model-display");

    // Function to mask API key (show first 2 and last 2 characters)
    function maskApiKey(apiKey) {
        if (!apiKey || apiKey.length <= 4) {
            return "****";
        }
        const firstTwo = apiKey.substring(0, 2);
        const lastTwo = apiKey.substring(apiKey.length - 2);
        const maskedLength = apiKey.length - 4;
        const masked = "*".repeat(Math.min(maskedLength, 20)); // Limit masked stars to 20
        return `${firstTwo}${masked}${lastTwo}`;
    }

    // Function to get model display name
    function getModelDisplayName(modelValue) {
        const modelMap = {
            "gemini": "Gemini"
        };
        return modelMap[modelValue] || modelValue;
    }

    // Function to load saved AI settings
    function loadAISettings() {
        chrome.storage.sync.get(["aiApiKey", "aiModel"], function(result) {
            if (result.aiApiKey && result.aiApiKey.trim() !== "") {
                // Show saved view, hide form
                aiAssistForm.style.display = "none";
                aiAssistSaved.style.display = "flex";
                
                // Display masked API key
                aiSavedKeyDisplay.textContent = maskApiKey(result.aiApiKey);
                
                // Display model
                const model = result.aiModel || "gemini";
                aiSavedModelDisplay.textContent = `Model: ${getModelDisplayName(model)}`;
            } else {
                // Show form, hide saved view
                aiAssistForm.style.display = "flex";
                aiAssistSaved.style.display = "none";
            }
        });
    }

    // Function to save AI settings
    function saveAISettings() {
        const apiKey = aiApiKeyInput.value.trim();
        const model = aiModelSelect.value;

        if (!apiKey) {
            // Show error state with red border
            aiApiKeyInput.classList.add("error");
            // Remove error state after user starts typing
            aiApiKeyInput.addEventListener("input", function removeError() {
                aiApiKeyInput.classList.remove("error");
                aiApiKeyInput.removeEventListener("input", removeError);
            });
            return;
        }

        // Remove error state if present
        aiApiKeyInput.classList.remove("error");

        chrome.storage.sync.set({
            aiApiKey: apiKey,
            aiModel: model
        }, function() {
            // Clear input
            aiApiKeyInput.value = "";
            // Reload to show saved view
            loadAISettings();
        });
    }

    // Function to edit API key
    function editApiKey() {
        chrome.storage.sync.get(["aiApiKey", "aiModel"], function(result) {
            if (result.aiApiKey) {
                // Populate form with existing values
                aiApiKeyInput.value = result.aiApiKey;
                aiModelSelect.value = result.aiModel || "gemini";
                
                // Show form, hide saved view
                aiAssistForm.style.display = "flex";
                aiAssistSaved.style.display = "none";
            }
        });
    }

    // Function to delete API key
    function deleteApiKey() {
        chrome.storage.sync.remove(["aiApiKey", "aiModel"], function() {
            // Clear input
            aiApiKeyInput.value = "";
            // Reload to show form
            loadAISettings();
        });
    }

    // Event listeners
    aiAddBtn.addEventListener("click", saveAISettings);
    aiEditBtn.addEventListener("click", editApiKey);
    aiDeleteBtn.addEventListener("click", deleteApiKey);

    // Allow Enter key to save
    aiApiKeyInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            saveAISettings();
        }
    });

    // Load AI settings on page load
    loadAISettings();

    // Load AI Assist toggle state
    chrome.storage.sync.get(["aiAssistEnabled"], function(result) {
        aiAssistToggle.checked = result.aiAssistEnabled || false;
    });

    // Save AI Assist toggle state
    aiAssistToggle.addEventListener("change", function() {
        const isEnabled = aiAssistToggle.checked;
        chrome.storage.sync.set({ aiAssistEnabled: isEnabled }, function() {});
    });
});

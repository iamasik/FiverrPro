document.addEventListener("DOMContentLoaded", function() {
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

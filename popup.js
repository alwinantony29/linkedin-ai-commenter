// popup.js — handles saving and loading settings


const backendInput = document.getElementById('backend');
const toneSelect = document.getElementById('tone');
const lengthInput = document.getElementById('length');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');


// Load stored settings
chrome.storage.sync.get(["backendUrl", "tone", "maxLength"], (data) => {
    if (data.backendUrl) backendInput.value = data.backendUrl;
    if (data.tone) toneSelect.value = data.tone;
    if (data.maxLength) lengthInput.value = data.maxLength;
});


// Save settings
saveBtn.addEventListener('click', () => {
    const backendUrl = backendInput.value.trim();
    const tone = toneSelect.value;
    const maxLength = parseInt(lengthInput.value, 10);


    chrome.storage.sync.set({ backendUrl, tone, maxLength }, () => {
        statusEl.textContent = 'Settings saved!';
        setTimeout(() => (statusEl.textContent = ''), 2000);
    });
});
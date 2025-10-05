// popup.js — handles saving and loading settings


const toneSelect = document.getElementById('tone');
const lengthInput = document.getElementById('length');
const saveBtn = document.getElementById('linkedin-ai-commenter-save');
const statusEl = document.getElementById('linkedin-ai-commenter-status');


// Load stored settings
chrome.storage.sync.get(["tone", "maxLength"], (data) => {
    if (data.tone) toneSelect.value = data.tone;
    if (data.maxLength) lengthInput.value = data.maxLength;
});


// Save settings
saveBtn.addEventListener('click', () => {
    const tone = toneSelect.value;
    const maxLength = parseInt(lengthInput.value, 10);

    chrome.storage.sync.set({ tone, maxLength }, () => {
        statusEl.textContent = 'Settings saved!';
        setTimeout(() => (statusEl.textContent = ''), 2000);
    });
});
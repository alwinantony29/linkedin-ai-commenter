// content.js
// Injects the UI, detects posts, extracts text and author info, and communicates with the backend.


const BACKEND_URL = 'http://localhost:3000/generate-comments'; // change to your deployed backend

let USER_TONE = 'professional';
let MAX_LENGTH = 220;


// Load from storage
chrome.storage.sync.get(["backendUrl", "tone", "maxLength"], (data) => {
    if (data.backendUrl) BACKEND_URL = data.backendUrl;
    if (data.tone) USER_TONE = data.tone;
    if (data.maxLength) MAX_LENGTH = data.maxLength;
});


// Simple utility to wait
function wait(ms) { return new Promise(res => setTimeout(res, ms)); }


// Create the suggestion container
function createSuggestionBox() {
    const box = document.createElement('div');
    box.className = 'ai-suggest-box';
    box.innerHTML = `
    <div class="ai-suggest-header">AI Comment Suggestions</div>
    <div class="ai-suggest-list">Loading...</div>
    <div class="ai-suggest-footer"><button class="ai-close-btn">Close</button></div>
`;
    document.body.appendChild(box);
    box.addEventListener('click', e => {
        if (e.target.classList.contains('ai-close-btn')) box.style.display = 'none';
    });
    return box;
}


let suggestionBox = createSuggestionBox();


// Render suggestions inside the box
function renderSuggestions(suggestions, commentBox) {
    const list = suggestionBox.querySelector('.ai-suggest-list');
    list.innerHTML = '';
    suggestions.forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'ai-suggest-item';
        item.innerHTML = `
<div class="ai-text">${escapeHtml(s)}</div>
<div class="ai-actions">
<button data-action="copy" data-idx="${i}">Copy</button>
<button data-action="insert" data-idx="${i}">Insert</button>
</div>
`;
        list.appendChild(item);
    });


    // action handlers
    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const action = ev.target.dataset.action;
            const idx = Number(ev.target.dataset.idx);
            const text = suggestions[idx];
            if (action === 'copy') {
                navigator.clipboard.writeText(text);
            } else if (action === 'insert') {
                // Insert into the commentBox
                if (commentBox) {
                    // LinkedIn uses contenteditable divs for comments; handle both textarea and contenteditable
                    if (commentBox.tagName === 'TEXTAREA' || commentBox.tagName === 'INPUT') {
                        commentBox.value = text;
                        commentBox.focus();
                    } else {
                        // try contenteditable
                        commentBox.focus();
                        // create an input event LinkedIn will usually detect
                        const sel = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(commentBox);
                        range.deleteContents();
                        const textNode = document.createTextNode(text);
                        commentBox.appendChild(textNode);
                    }
                }
            }
        })
    })
}

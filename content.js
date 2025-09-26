// content.js
// Injects the UI, detects posts, extracts text and author info, and communicates with the backend.

const BACKEND_URL = "https://linkedin-ai-commenter-production.up.railway.app/generate-comments"; // change to your deployed backend

let USER_TONE = "professional";
let MAX_LENGTH = 220;

// Load from storage
chrome.storage.sync.get(["tone", "maxLength"], (data) => {
    if (data.tone) USER_TONE = data.tone;
    if (data.maxLength) MAX_LENGTH = data.maxLength;
});

// Simple utility to wait
function wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

function getPostText(commentBox) {
    try {
        // Find the post container
        let postContainer =
            commentBox.closest(".comments-comment-item__main-content") ||
            commentBox.closest(".feed-shared-update-v2");
        if (!postContainer) {
            // fallback
            postContainer = document.querySelector(".feed-shared-update-v2");
        }
        if (!postContainer) return "";

        // Grab text
        const textNode =
            postContainer.querySelector(".feed-shared-text__text-view") ||
            postContainer;
        return textNode.innerText.trim();
    } catch (err) {
        console.error("Error getting post text:", err);
        return "";
    }
}

async function detectCommentBoxes() {
    while (true) {
        const commentBoxes = document.querySelectorAll(
            '.ql-editor.ql-blank, [contenteditable="true"]:not(.ql-clipboard), textarea:not(#g-recaptcha-response-100000)'
        );
        commentBoxes.forEach((box) => {
            if (!box.dataset.aiInjected) {
                box.dataset.aiInjected = true; // avoid injecting multiple times
                injectButton(box);
            }
        });
        await wait(1500); // Check periodically
    }
}
detectCommentBoxes();

let lastCommentBox = null;

function injectButton(commentBox) {
    const btn = document.createElement("button");
    btn.textContent = "Suggest Comment";
    btn.style.margin = "4px";
    btn.style.fontSize = "12px";
    btn.style.cursor = "pointer";
    btn.style.padding = "2px 6px";
    btn.style.borderRadius = "4px";
    btn.style.border = "none";
    btn.style.backgroundColor = "#0073b1";
    btn.style.color = "#fff";
    btn.style.minWidth = "120px";

    btn.onclick = () => {
        lastCommentBox = commentBox;
        suggestComment(commentBox, btn);
    };

    commentBox.parentNode.appendChild(btn);
}

function showSuggestions(data) {
    // Assuming your backend returns an array of suggestions
    const suggestions = data.suggestions || [];
    suggestions.splice(0, 1)
    if (suggestions.length === 0) {
        suggestions.push("No suggestions available.");
    }

    suggestionBox.style.display = "block";
    renderSuggestions(suggestions, lastCommentBox);
}

async function suggestComment(commentBox, button) {
    // Store original button state
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    const originalCursor = button.style.cursor;
    const originalBackgroundColor = button.style.backgroundColor;

    try {
        // Set loading state
        button.disabled = true;
        button.textContent = "Loading...";
        button.style.cursor = "not-allowed";



        const postText = getPostText(commentBox); // Implement function to fetch post text
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                postText,
                tone: USER_TONE,
                maxLength: MAX_LENGTH,
            }),
        });
        const data = await res.json();

        showSuggestions(data); // Implement UI to show suggestions
    } catch (error) {
        console.error("Error generating comment suggestions:", error);
        // You could show an error message to the user here
        alert("Failed to generate comment suggestions. Please try again.");
    } finally {
        // Restore original button state
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.cursor = originalCursor;
        button.style.backgroundColor = originalBackgroundColor;
    }
}

// Create the suggestion container
function createSuggestionBox() {
    const box = document.createElement("div");
    box.className = "ai-suggest-box";
    box.innerHTML = `
    <div class="ai-suggest-header">AI Comment Suggestions</div>
    <div class="ai-suggest-list">Loading...</div>
    <div class="ai-suggest-footer"><button class="ai-close-btn">Close</button></div>
`;
    document.body.appendChild(box);
    box.addEventListener("click", (e) => {
        if (e.target.classList.contains("ai-close-btn")) box.style.display = "none";
    });
    return box;
}

let suggestionBox = createSuggestionBox();

// Render suggestions inside the box
function renderSuggestions(suggestions, commentBox) {
    const list = suggestionBox.querySelector(".ai-suggest-list");
    list.innerHTML = "";
    suggestions.forEach((s, i) => {
        const item = document.createElement("div");
        item.className = "ai-suggest-item";
        item.innerHTML = `
            <div class="ai-text">${s}</div>
            <div class="ai-actions">
            <button data-action="copy" data-idx="${i}">Copy</button>
            <button data-action="insert" data-idx="${i}">Insert</button>
            </div>
            `;

        list.appendChild(item);
    });

    // action handlers
    list.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
            const action = ev.target.dataset.action;
            const idx = Number(ev.target.dataset.idx);
            const text = suggestions[idx];
            if (action === "copy") {
                navigator.clipboard.writeText(text);
            } else if (action === "insert") {
                // Insert into the commentBox
                if (commentBox) {
                    // LinkedIn uses contenteditable divs for comments; handle both textarea and contenteditable
                    if (
                        commentBox.tagName === "TEXTAREA" ||
                        commentBox.tagName === "INPUT"
                    ) {
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
        });
    });
}

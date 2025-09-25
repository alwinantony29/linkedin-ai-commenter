// service-worker.js
// Minimal background to show how you might listen for commands in future.


chrome.runtime.onInstalled.addListener(() => {
    console.log('LinkedIn AI Commenter installed');
});


// No heavy logic here; backend calls are made from content script in this example
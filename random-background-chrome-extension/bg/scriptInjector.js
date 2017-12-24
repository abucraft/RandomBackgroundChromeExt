chrome.tabs.onCreated.addListener(function (tab) {
    if (tab.url == "chrome://newtab/") {
        chrome.tabs.update(tab.id, {
            url: "about:blank"
        })
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (!tab.url === "about:blank") { return; } // Not blank
    if (changeInfo.status !== 'complete') { return; }
    console.log(rootSetting.settings);
    chrome.tabs.sendMessage(tabId, { type: "verify_injected" }, function (response) {
        if (!response) {
            var scripts = [
                "lib/jquery-3.2.0.min.js",
                "lib/vue.min.js",
                "lib/utils.js",
                "lib/material.min.js",
                "cs/cacheLoader.js",
                "cs/main.js",
                "cs/imageLoader.js"
            ];
            var csses = [
                "lib/material.min.css",
                "lib/material-select.min.css",
                "cs/main.css"
            ];
            var p = Promise.resolve();
            scripts.forEach(function (file) {
                p = p.then(function () {
                    return new Promise(function (res, rej) {
                        //console.log(`load: ${file}`)
                        chrome.tabs.executeScript(tabId, { file: file, matchAboutBlank: true }, function () {
                            res();
                        });
                    })
                })
            });
            csses.forEach(function (file) {
                chrome.tabs.insertCSS(tabId, { file: file, matchAboutBlank: true });
            })
        }
    })
});
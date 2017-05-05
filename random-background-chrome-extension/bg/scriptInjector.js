var googleHomeReg = /https?:\/\/www\.google\.\w{2,3}(\.\w{1,3})?\//
var searchingReg = /(o?q=)|(\/doodles)|(patents)/;
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (!tab.url.match(googleHomeReg) || tab.url.match(searchingReg)) { return; } // Not google
    if (changeInfo.status !== 'complete') { return; }
    console.log(rootSetting.settings);
    if (!rootSetting.settings.applyOnGoogle) { return; }
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
                console.log(`load: ${file}`)
                chrome.tabs.executeScript(tabId, { file: file }, function () {
                    res();
                });
            })
        })
    });
    csses.forEach(function (file) {
        chrome.tabs.insertCSS(tabId, { file: file });
    })
});
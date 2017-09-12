var googleHomeReg = /https?:\/\/www\.google\.\w{2,3}(\.\w{1,3})?\//
var searchingReg = /(o?q=)|(\/doodles)|(patents)/;
var settingStrings = {
    empty_new_tab: 'empty new tab',
    empty_new_tab_zh: '空白新标签页',
}

chrome.contextMenus.create({
    id: "emptyNewTab", title: _getString(settingStrings, "empty_new_tab"),
    type: "checkbox", contexts: ["browser_action"], checked: rootSetting.settings.emptyNewTab,
    onclick: function (info) {
        rootSetting.settings.emptyNewTab=info.checked;
        _setLocalStorage("settings", rootSetting.settings);
    }
});

chrome.tabs.onCreated.addListener(function (tab) {
    if (tab.url == "chrome://newtab/") {
        var redirection = rootSetting.settings.emptyNewTab?"newtab.html":"https://www.google.com/_/chrome/newtab";
        chrome.tabs.update(tab.id, {
            url: redirection
        })
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (!tab.url.match(googleHomeReg) || tab.url.match(searchingReg)) { return; } // Not google
    if (changeInfo.status !== 'complete') { return; }
    console.log(rootSetting.settings);
    if (!rootSetting.settings.applyOnGoogle) { return; }
    chrome.tabs.sendMessage(tabId, {type:"verify_injected"}, function (response) {
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
                        chrome.tabs.executeScript(tabId, { file: file }, function () {
                            res();
                        });
                    })
                })
            });
            csses.forEach(function (file) {
                chrome.tabs.insertCSS(tabId, { file: file });
            })
        }
    })
});
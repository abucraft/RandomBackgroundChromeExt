chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === "Referer") {
            if (details.url.indexOf("pixiv.net") >= 0) {
                details.requestHeaders[i].value = "https://pixiv.net/"
            }
            if (details.url.indexOf('pximg.net') >= 0) {
                details.requestHeaders[i].value = "https://pximg.net/"
            }
        }
    }
    return { requestHeaders: details.requestHeaders };
},
    {
        urls: ["*://*.pixiv.net/*", "*://*.pximg.net/*"]
    },
    ["blocking", "requestHeaders"]
);
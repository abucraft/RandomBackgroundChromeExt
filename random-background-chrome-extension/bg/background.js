var MAX_CACHE = 5;
var MAX_RECURSIVE = 20;
var CACHE_TIMEOUT = 15000;
var sources = [bing, artstation, pixiv, custom];
var rootSetting = {
    sources: sources,
    settings: {
        _wallpaperUpdateTime: 60 * 1000,
        _applyOnDesktopWallpaper: true,
        _applyOnGoogle: true
    }
}
var tick = 0;
var wallpaperTimer = null;
var datas = [];
var urls = [];
var cache_urls = [];

start();
storeData(0);

function start() {
    var promises = [];
    for (var i = 0; i < sources.length; i++) {
        var storedRule = localStorage.getItem(sources[i].api.name);
        if (storedRule) {
            sources[i].api = JSON.parse(storedRule);
        }
        if (sources[i].start) {
            promises.push(sources[i].start());
        }
    }
    var settings = localStorage.getItem('settings');
    if (settings) {
        _copyJSON(rootSetting.settings, JSON.parse(settings));
    }
    // Begin to send wallpaper to desktop after prepared
    Promise.all(promises).then(function () {
        wallpaperTimer = setTimeout(sendWallpaper, rootSetting.settings._wallpaperUpdateTime);
    })
}

function applySetting(setting) {
    for (var i = 0; i < sources.length; i++) {
        sources[i].api = setting.sources[i];
        _setLocalStorage(sources[i].api.name, sources[i].api);
    }
    if (rootSetting.settings._wallpaperUpdateTime !== setting.settings._wallpaperUpdateTime) {
        clearTimeout(wallpaperTimer);
        wallpaperTimer = setTimeout(sendWallpaper, setting.settings._wallpaperUpdateTime);
    }
    rootSetting.settings = setting.settings;
    _setLocalStorage("settings", rootSetting.settings);
}

function randomChooseSource() {
    var total = 0;
    for (var i = 0; i < sources.length; i++) {
        total += sources[i].api.chance;
    }
    var randNum = parseInt(Math.random() * total);
    var curNum = 0;
    for (var i = 0; i < sources.length; i++) {
        curNum += sources[i].api.chance;
        if (randNum < curNum) {
            break;
        }
    }
    return sources[i];
}

function getData() {
    return new Promise(function (resolve, reject) {
        var data = pickData();
        if (data) {
            resolve(data);
        } else {
            storeData(0).then(function () {
                resolve(pickData());
            })
        }
    });
}

function pickData() {
    if (datas.length > 0) {
        var data = datas.shift();
        storeData(0);
        return data;
    } else if (urls.length > 0) {
        var url = urls.shift();
        storeData(0);
        return url;
    }
}

function storeData(roop = 0) {
    var promise = null;
    if (roop > MAX_RECURSIVE) {
        return Promise.resolve();
    }
    if (datas.length + urls.length > MAX_CACHE) {
        return Promise.resolve();
    } else {
        promise = randomChooseSource().getImageUrl();
    }
    //add cache 
    promise = promise.then(function (url) {
        return new Promise(function (resolve, reject) {
            if (url.url === undefined) {
                reject("url undefined");
                return;
            }
            var oReq = new XMLHttpRequest();
            oReq.open("GET", url.url, true);
            oReq.responseType = "arraybuffer";

            oReq.onload = function (oEvent) {
                console.log(oReq.status);
                if (oReq.status === 200) {
                    var arrayBuffer = oReq.response; // Note: not oReq.responseText
                    var base64str = _arrayBufferToBase64(arrayBuffer);
                    url.data = base64str;
                    resolve(url)
                } else {
                    resolve(url);
                }
            };
            oReq.send();
        });
    })
    promise = promise.then(function (data) {
        console.log(`get ${data.url}`);
        if (data.data) {
            datas.push(data);
        } else {
            urls.push(data);
        }
    }, function (e) {
        console.error(e);
        return storeData(roop + 1);
    });
    return promise;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'QUERY') {
        getData().then(function (data) {
            console.log(`send ${data.url}`);
            sendResponse(data)
        });
        return true;
    }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "CACHE_REQUEST") {
        var url = urls.shift();
        if (url) {
            sendResponse(url);
            cache_urls.push(url);
            setTimeout(function () {
                for (var i = 0; i < cache_urls.length; i++) {
                    if (cache_urls[i].url === url.url)
                        break;
                }
                if (i < cache_urls.length) {
                    cache_urls.splice(i, 1);
                    urls.push(url);
                }
            }, CACHE_TIMEOUT);
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "CACHE_RESULT") {
        var data = request.data;
        for (var i = 0; i < cache_urls.length; i++) {
            if (cache_urls[i].url === data.url)
                break;
        }
        if (i < cache_urls.length) {
            cache_urls.splice(i, 1);
            datas.push(data);
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'QUERY_SETTINGS') {
        var setting = {};
        setting.sources = [];
        setting.settings = rootSetting.settings;
        for (var i = 0; i < sources.length; i++) {
            setting.sources.push(sources[i].api);
        }
        sendResponse(setting);
        return true;
    }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'APPLY_SETTINGS') {
        applySetting(request.data);
    }
});

function sendWallpaper() {
    if (rootSetting.settings._applyOnDesktopWallpaper) {
        if (datas.length > 0) {
            var wallpaper = datas.shift();
            wallpaper.tick = tick;
            tick++;

            chrome.runtime.sendNativeMessage('com.lisheng.wallpaper_receiver', wallpaper, function (reply) {
                console.warn(reply);
            });
            storeData();
        } else {
            storeData();
        }
    }
    wallpaperTimer = setTimeout(sendWallpaper, rootSetting.settings._wallpaperUpdateTime);
}

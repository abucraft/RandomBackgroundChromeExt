var MAX_CACHE = 5;
var MAX_RECURSIVE = 20;
var CACHE_TIMEOUT = 15000;

var tick = 0;
var wallpaperTimer = null;
var datas = [];
var urls = [];
var cache_urls = [];
//LOG_ENABLE = true;
var sources = [
    bing,
    artstation,
    flickr
];
var rootSetting = {
    sources: sources,
    settings: {}
}
Object.defineProperties(rootSetting.settings, {
    'version': { value: 1.1 },
    '_wallpaperUpdateTime': { writable: true, value: 60 * 1000 },
    'wallpaperUpdateTime': {
        enumerable: true,
        get: function () {
            return this._wallpaperUpdateTime
        },
        set: function (value) {
            if (this._wallpaperUpdateTime === value) {
                return
            }
            this._wallpaperUpdateTime = value
            if (wallpaperTimer) {
                clearTimeout(wallpaperTimer)
            }
            wallpaperTimer = setTimeout(sendWallpaper, this._wallpaperUpdateTime);
        }
    },
    '_applyOnDesktopWallpaper': { writable: true, value: true },
    'applyOnDesktopWallpaper': {
        enumerable: true,
        get: function () {
            return this._applyOnDesktopWallpaper
        },
        set: function (value) {
            this._applyOnDesktopWallpaper = value
        }
    },
    '_runInBackground': { writable: true, value: false },
    'runInBackground': {
        enumerable: true,
        get: function () {
            return this._runInBackground
        },
        set: function (value) {
            var vm = this;
            if (value === vm._runInBackground) {
                return
            }
            vm._runInBackground = value
            chrome.permissions.contains({
                permissions: ['background']
            }, function (contains) {
                // If not has permission and we want it, request it
                if (!contains && value) {
                    chrome.permissions.request({
                        permissions: ['background']
                    }, function (granted) {
                        if (!granted) {
                            vm._runInBackground = false
                            _setLocalStorage("settings", rootSetting.settings)
                        }
                    })
                }
                // If has permission and we don't want it, remove it
                if (contains && !value) {
                    chrome.permissions.remove({
                        permissions: ['background']
                    }, function (removed) {
                        if (!removed) {
                            // The permissions have not been removed (e.g., you tried to remove
                            // required permissions).
                            vm._runInBackground = true
                            _setLocalStorage("settings", rootSetting.settings)
                        }
                    });
                }
            })
        }
    },
    '_emptyNewTab': { writable: true, value: false },
    'emptyNewTab': {
        enumerable: true,
        get: function () {
            return this._emptyNewTab
        },
        set: function (value) {
            this._emptyNewTab = value
        }
    },
})

start();
storeData(0);

function convertOldSettings(oldSetting) {
    if (oldSetting.version === rootSetting.settings.version) {
        return oldSetting;
    }
    var keys = Object.keys(oldSetting);
    var newSetting = {};
    for (let i in keys) {
        var key = keys[i];
        var newKey = key.replace('_', '');
        newSetting[newKey] = oldSetting[key];
    }
    return newSetting;
}

function start() {
    var promises = [];
    for (var i = 0; i < sources.length; i++) {
        var storedRule = localStorage.getItem(sources[i].api.name);
        if (storedRule) {
            oldApi = JSON.parse(storedRule);
            let version = sources[i].api.version;
            if (!(version && (!oldApi.version || version > oldApi.version))) {
                sources[i].api = JSON.parse(storedRule);
            }
        }
        if (sources[i].start) {
            promises.push(sources[i].start());
        }
    }
    var settings = localStorage.getItem('settings');
    if (settings) {
        _copyJSON(rootSetting.settings, convertOldSettings(JSON.parse(settings)));
    }
    // Begin to send wallpaper to desktop after prepared
    Promise.all(promises).then(function () {
        if (!wallpaperTimer) {
            wallpaperTimer = setTimeout(sendWallpaper, rootSetting.settings._wallpaperUpdateTime);
        }
    })
}

function applySetting(setting) {
    var same = true;
    for (var i = 0; i < sources.length; i++) {
        same = same && _deepCompare(sources[i].api, setting.sources[i]);
        sources[i].api = setting.sources[i];
        _setLocalStorage(sources[i].api.name, sources[i].api);
    }
    // clear cache and reload if sources changed
    if (!same) {
        datas.splice(0, datas.length)
        urls.splice(0, urls.length)
        storeData(0);
    }
    _copyJSON(rootSetting.settings, setting.settings);
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
    storeData(0);
    var url;
    if (datas.length > 0 && urls.length > 0) {
        var fromUrl = parseInt(Math.random() * 2);
        if (fromUrl) {
            url = urls.shift();
        } else {
            url = datas.shift();
        }
    } else if (datas.length > 0) {
        url = datas.shift();
    } else if (urls.length > 0) {
        url = urls.shift();
    }
    logUrl(url);
    return url;
}

function storeData(roop = 0) {
    var promise = null;
    if (roop > MAX_RECURSIVE) {
        return Promise.resolve();
    }
    if (datas.length + urls.length > MAX_CACHE) {
        return Promise.resolve();
    } else {
        var rsrc = randomChooseSource();
        if (!rsrc) {
            return Promise.resolve();
        } else {
            promise = rsrc.getImageUrl();
        }
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
            if(url.url.indexOf('pximg')!=-1){
                oReq.setRequestHeader('Referer',"https://pximg.net/")
            }

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
    switch (request.type) {
        case 'QUERY':
            getData().then(function (data) {
                console.log(`send ${data.url}`);
                sendResponse(data);
            });
            return true;
        case "CACHE_REQUEST":
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
            break
        case "CACHE_RESULT":
            var data = request.data;
            for (var i = 0; i < cache_urls.length; i++) {
                if (cache_urls[i].url === data.url)
                    break;
            }
            if (i < cache_urls.length) {
                cache_urls.splice(i, 1);
                datas.push(data);
            }
            break
        case 'QUERY_SETTINGS':
            var setting = {};
            setting.sources = [];
            setting.settings = rootSetting.settings;
            for (var i = 0; i < sources.length; i++) {
                setting.sources.push(sources[i].api);
            }
            sendResponse(setting);
            return true
        case 'APPLY_SETTINGS':
            applySetting(request.data);
            break
    }
})

function sendWallpaper() {
    if (rootSetting.settings.applyOnDesktopWallpaper) {
        var wallpaper = pickData();
        if (wallpaper) {
            wallpaper.tick = tick;
            tick++;
            chrome.runtime.sendNativeMessage('com.lisheng.wallpaper_receiver', wallpaper, function (reply) {
                console.warn(reply);
            });
        }
        storeData();
    }
    wallpaperTimer = setTimeout(sendWallpaper, rootSetting.settings._wallpaperUpdateTime);
}

function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function _shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function _randomPick(list, limit) {
    var nList = [];
    if (!limit) {
        limit = list.length;
    }
    for (var i = 0; i < limit; i++) {
        if (list.length === 0) {
            break;
        }
        var idx = parseInt(Math.random() * list.length);
        nList.push(list[idx]);
        list.splice(idx, 1);
    }
    return nList;
}

function _setLocalStorage(path, value) {
    var pathArray = path.split('/');
    var key = pathArray.shift();
    var obj = localStorage.getItem(key);
    var finalValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (pathArray.length > 0) {
        var finalKey = pathArray.pop();
        if (obj) {
            obj = JSON.parse(obj);
        } else {
            obj = {};
        }
        var rootObj = obj;
        for (var i = 0; i < pathArray.length; i++) {
            if (obj[pathArray[i]] == null) {
                obj[pathArray[i]] = {};
            }
            obj = obj[pathArray[i]];
        }
        obj[finalKey] = value;
        finalValue = JSON.stringify(rootObj);
    }
    localStorage.setItem(key, finalValue);
}

function _copyJSON(dest, src) {
    Object.keys(src).forEach(function (key) {
        if (dest[key]) {
            if (typeof dest[key] === 'object') {
                _copyJSON(dest[key], src[key]);
            } else {
                dest[key] = src[key];
            }
        } else {
            dest[key] = src[key];
        }
    })
}

function _shrinkAndSortByRepeat(array) {
    var doc = {};
    array.forEach(function (item) {
        if (!doc[item.url]) {
            var cpitem = {};
            _copyJSON(cpitem, item);
            doc[item.url] = cpitem;
            doc[item.url].count = 1;
        } else {
            doc[item.url].count++;
        }
    });
    var urlkeys = Object.keys(doc);
    var bufferArray = [];
    urlkeys.forEach(function (key) {
        bufferArray.push(doc[key]);
    });
    bufferArray.sort(function (a, b) {
        return b.count - a.count;
    });
    return bufferArray;
}

Object.defineProperty(Array.prototype, 'unique', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function () {
        var a = this.concat();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }
});

function _deepCompare(obj1, obj2, ignore) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return obj1 === obj2;
    }
    var keys1 = Object.keys(obj1);
    var keys2 = Object.keys(obj2);
    var allkeys = keys1.concat(keys2).unique();
    for (let i in allkeys) {
        if (ignore && ignore.test(allkeys[i])) {
            continue
        }
        if (!_deepCompare(obj1[allkeys[i]], obj2[allkeys[i]], ignore)) {
            return false
        }
    }
    return true
}

function _getString(store, key) {
    var postfixed = key;
    if (navigator.language.indexOf('zh') !== -1) {
        postfixed = key + '_zh';
    }
    return store[postfixed] ? store[postfixed] : store[key];
}

var localCache = [];

function _readCache(key) {
    function isExpired(cacheEntry) {
        return ((cacheEntry.ttl > 0) && (cacheEntry.ttl + cacheEntry.createdAt) < (new Date().getTime()));
    }

    if (localCache[key] == undefined || isExpired(localCache[key])) {
        return undefined;
    } else {
        return localCache[key].value;
    }
}

function _writeCache(key, value, ttl) {
    if (key != undefined && value != undefined && ttl != undefined) {
        localCache[key] = {
            value: value,
            createdAt: new Date().getTime(),
            ttl: ttl
        }
    }
}

async function _fetchWithCredential(url, settings = {}) {
    return fetch(url, { ...settings, credentials: 'same-origin' })
}
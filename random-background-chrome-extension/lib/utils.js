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
    for (var i = 0; i < limit; i++) {
        if (list.length === 0) {
            break;
        }
        var idx = parseInt(Math.random() * list.length);
        nList.push(list[idx]);
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
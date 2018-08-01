// load all image urls using certain api structure
var imageUrlLoader = (function () {
    var curRule = null;
    var curUrlKey = "oiq3iri384jj";
    function parseAndLoad(structure, imageList) {
        curRule = structure;
        var apis = structure.apis;
        var promises = [];
        for (var i = 0; i < apis.length; i++) {
            if (apis[i].enabled) {
                var p = getAll([{}], apis[i]).then(function (values) {
                    imageList.push.apply(imageList, values);
                });
                promises.push(p);
            }
        }
        return Promise.all(promises).then(function () {
            console.log(imageList);
            _shuffle(imageList);
        });
    }

    function getAllItems(item, rule) {
        if (rule.type === 'info_json') {
            let url = fillUrl(rule, item);
            let list = [];
            let itemPromise = getItemsList(rule, url, list);
            function afterPromise() {
                let finalList = _randomPick(list, rule.restrict);
                return finalList;
            }
            itemPromise = itemPromise.then(afterPromise, afterPromise);
            return itemPromise;
        } else if (rule.type === "image_json") {
            let srcLink = item.getLink;
            srcLink = srcLink ? srcLink : getLink(rule, item);
            //console.warn(srcLink);
            return Promise.resolve({ url: getValFromPath(item, rule.imageUrlPath), link: srcLink });
        } else if (rule.type === "info_html") {
            let url = fillUrlHtml(rule, item);
            let list = [];
            let itemPromise = getItemsListHtml(rule, url, list);
            function afterPromise() {
                let finalList = _randomPick(list, rule.restrict);
                return finalList;
            }
            itemPromise = itemPromise.then(afterPromise, afterPromise);
            return itemPromise;
        } else if (rule.type === "image_html") {
            let srcLink = getLinkHtml(rule, item);
            return Promise.resolve({ url: $(item).attr(rule.imageUrlAttr), link: srcLink });
        } else if(rule.type == "flickr"){
            return getFlickrItemsList(rule);
        } else {
            return Promise.resolve([]);
        }
    }

    function getAll(items, rule) {
        if (rule) {
            var promises = [];
            for (var i = 0; i < items.length; i++) {
                promises.push(getAllItems(items[i], rule));
            }
            return Promise.all(promises).then(function (values) {
                var newitems = [].concat.apply([], values);
                return getAll(newitems, rule.item);
            })
        } else {
            console.log("search finish");
            return Promise.resolve(items);
        }
    }

    function getItemsList(rule, url, list) {
        if (url) {
            return new Promise(function (resolve, reject) {
                $.getJSON(url, function (data) {
                    var link = getLink(rule, data);
                    var item = getValFromPath(data, rule.item.path);
                    if (item.length) {
                        for (let i = 0; i < item.length; i++) {
                            item[i][curUrlKey] = url;
                        }
                        list.push.apply(list, item);
                    } else {
                        item[curUrlKey] = url;
                        list.push(item);
                    }
                    // if link is in parent, then bind link to all the children
                    list.forEach(function (it) { it.getLink = link })
                    var nextUrl = getValFromPath(data, rule.nextUrl);
                    if (nextUrl) {
                        getItemsList(rule, nextUrl, list).then(function () { resolve(list) });
                    } else {
                        resolve(list);
                    }
                }).fail(function () { resolve(list) });
            });
        } else {
            return Promise.resolve(list);
        }
    }

    function getFlickrItemsList(flickrRule) {
        return new Promise(function (resolve, reject) {
            $.get(flickrRule.url, function (data) {
                var xpathResult = data.evaluate('.//photo', data, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
                if(xpathResult != undefined && xpathResult.snapshotLength > 0){
                    var ranIndex = Math.floor(Math.random() * xpathResult.snapshotLength);
                    var ranItem = xpathResult.snapshotItem(ranIndex);

                    var id = ranItem.attributes.id.nodeValue;
                    var secret = ranItem.attributes.secret.nodeValue;
                    var server = ranItem.attributes.server.nodeValue;
                    var farm = ranItem.attributes.farm.nodeValue;
                    var owner = ranItem.attributes.owner.nodeValue;

                    var url = 'https://farm'+farm+'.staticflickr.com/'+server+'/'+id+'_'+secret+'_b'+'.jpg';
                    var link = 'https://www.flickr.com/photos/'+owner+'/'+id+'/in/feed';
                    // resolve([{url:url, link:link}]);

                    $.get(flickrRule.sizeUrl+'&photo_id='+id, function (data) {
                        var xpathResult = data.evaluate('.//size', data, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
                        for(let i = xpathResult.snapshotLength-1;;i--) {
                            let item = xpathResult.snapshotItem(i);
                            if(item.attributes.label.nodeValue === 'Large' || item.attributes.label.nodeValue === 'Large 1600') {
                                resolve([{url: item.attributes.source.nodeValue, link: link}]);
                            }
                        }
                        resolve([]);
                    }).fail(function () { resolve([]);});

                } else {
                    resolve([]);
                }


            }).fail(function () { resolve([]);});
        })
    }


    function getItemsListHtml(rule, url, list) {
        if (url) {
            if (url instanceof Array) {
                let promises = [];
                for (let i = 0; i < url.length; i++) {
                    promises.push(getItemsListHtml(rule, url[i], list))
                }
                return Promise.all(promises);
            } else {
                return new Promise(function (resolve, reject) {
                    $.get(url, function (data) {
                        data = data.replace(/\ssrc=/g, ' custom-src=');
                        data = $(data);
                        var link = getLinkHtml(rule, data);
                        var item = getValFromPathHtml(data, rule.item.path, rule.item.filter);
                        if (item.length) {
                            for (let i = 0; i < item.length; i++) {
                                item[i][curUrlKey] = url;
                            }
                            list.push.apply(list, item);
                        } else {
                            item[curUrlKey] = url;
                            list.push(item);
                        }
                        // if link is in parent, then bind link to all the children
                        list.forEach(function (it) { it.getLink = link })
                        let nextUrl;
                        if (rule.nextUrl) {
                            nextUrl = fillUrlHtml(rule.nextUrl, data);
                        }
                        if (nextUrl) {
                            getItemsListHtml(rule, nextUrl, list).then(function () { resolve(list) });
                        } else {
                            resolve(list);
                        }
                    }, 'text').fail(function () { resolve(list) });
                })
            }
        } else {
            return Promise.resolve(list);
        }
    }
    function fillUrl(rule, obj) {
        let baseUrl = rule.url;
        if (rule.postfix) {
            let postdef = rule.postfix;
            let source = postdef.source;
            let sourceObj, value;
            if (source === 'json') {
                sourceObj = obj;
            }
            value = getValFromPath(sourceObj, postdef.path);
            if (value !== undefined) {
                baseUrl = baseUrl + value;//concat baseUrl with postfix value
            }
        }
        if (rule.params) {
            for (let i = 0; i < rule.params.length; i++) {
                let paramdef = rule.params[i];
                let source = paramdef.localParam.source;
                let sourceObj = null;
                let value = null;
                if (source === 'localStorage') {
                    sourceObj = localStorage;
                }
                if (source === 'json') {
                    sourceObj = obj;
                }
                if (source === 'rule') {
                    sourceObj = curRule;
                }
                value = getValFromPath(sourceObj, paramdef.localParam.path);
                if (value !== undefined)
                    baseUrl = setUrlParam(baseUrl, paramdef.urlParam, value);
            }
        }
        return baseUrl;
    }

    function fillUrlHtml(rule, obj) {
        let baseUrl = rule.url;
        if (baseUrl === '.')
            baseUrl = obj[curUrlKey];
        if (rule.postfix) {
            let postdef = rule.postfix;
            let postobj;
            if (postdef.path) {
                postobj = getValFromPathHtml(obj, postdef.path);
            }
            if ($(postobj).attr(postdef.attr)) {
                baseUrl += $(postobj).attr(postdef.attr);
            } else {
                //error when handle url, ignore it because it maybe nextUrl
                return;
            }
        }
        if (rule.params) {
            for (let i = 0; i < rule.params.length; i++) {
                let paramdef = rule.params[i];
                let source = paramdef.localParam.source;
                let sourceObj = null;
                let value = null;
                if (source === 'html') {
                    sourceObj = $(obj);
                    if (paramdef.localParam.path) {
                        sourceObj = getValFromPathHtml(sourceObj, paramdef.localParam.path);
                    }
                    value = $(sourceObj).attr(paramdef.localParam.attr);
                }
                if (value !== undefined)
                    baseUrl = setUrlParam(baseUrl, paramdef.urlParam, value);
            }
        }
        return baseUrl;
    }
    // get reference link
    function getLink(rule, obj) {
        var link = rule.link;
        if (link) {
            if (typeof link === 'string') {
                return link;
            }
            if (typeof link === 'object') {
                if (link.url) {
                    return fillUrl(link, obj);
                }
                if (link.path) {
                    return getValFromPath(obj, link.path);
                }
            }
        }
        return null;
    }

    function getLinkHtml(rule, obj) {
        var link = rule.link;
        if (link) {
            if (typeof link === 'string') {
                return link;
            }
            if (typeof link === 'object') {
                if (link.url) {
                    return fillUrlHtml(link, obj);
                }
            }
        }
    }

    function setUrlParam(url, paramName, value) {
        var str = paramName + '=' + value;
        var idx = url.indexOf("?");
        if (idx < 0) {
            url = url + '?';
        }
        return url + '&' + str;
    }

    // TODO: handle path /*/abc/*/c
    function getValFromPath(obj, propertyPath) {
        if (!obj || !propertyPath) {
            return;
        }
        var pathArray = propertyPath.split('/');
        var currentObj = undefined;
        try {
            if (obj === localStorage) {
                var key = pathArray.shift();
                obj = localStorage.getItem(key);
                if (pathArray.length > 0) {
                    obj = JSON.parse(obj);
                }
            }
            currentObj = obj;
            for (var i = 0; i < pathArray.length; i++) {
                if (pathArray[i] === '' || pathArray[i] === "*") {
                    currentObj = currentObj;
                } else if (pathArray[i] === '[random]') {
                    var length = currentObj.length;
                    currentObj = currentObj[parseInt(Math.random() * length)];
                }
                else {
                    currentObj = currentObj[pathArray[i]];
                }
            }
        } catch (err) {
            console.error(err);
            currentObj = undefined;
        }
        return currentObj;
    }

    function getValFromPathHtml(obj, propertyPath, filter) {
        if (!obj || !propertyPath) {
            return;
        }
        var currentObj = undefined;
        try {
            if (obj === localStorage) {
                var pathArray = propertyPath.split('/');
                var key = pathArray.shift();
                obj = localStorage.getItem(key);
                if (pathArray.length > 0) {
                    obj = JSON.parse(obj);
                }
                currentObj = obj;
                for (var i = 0; i < pathArray.length; i++) {
                    if (pathArray[i] === '' || pathArray[i] === "*") {
                        currentObj = currentObj;
                    } else if (pathArray[i] === '[random]') {
                        var length = currentObj.length;
                        currentObj = currentObj[parseInt(Math.random() * length)];
                    }
                    else {
                        currentObj = currentObj[pathArray[i]];
                    }
                }
            } else {
                currentObj = obj.find(propertyPath);
                if (filter) {
                    currentObj = currentObj.filter(filter);
                }
            }
        } catch (err) {
            console.error(err);
            currentObj = undefined;
        }
        return currentObj;
    }
    return { parseAndLoad }
})();


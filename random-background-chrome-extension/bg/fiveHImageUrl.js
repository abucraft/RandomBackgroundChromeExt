var fiveHundred = (function () {
    var loading = false;
    var imageList = [];
    var api = {
        apis: [
            {
                type: "info_json",
                url: "https://api.500px.com/v1/photos?rpp=100&feature=popular&consumer_key=jKV8XWb2tKyUpflXyj43nHWC5cwkvgdIkaqi5ePK&image_size=36",
                item: {
                    type: "image_json",
                    path: "photos/*",
                    imageUrlPath: "image_url",
                    link: {
                        url: "https://500px.com",
                        postfix: {
                            source: "json",
                            path: "url"
                        }
                    }
                },
                restrict: 100,
                enabled: true,
                name: "popular",
                name_zh: "热门",
                show: true
            },
            {
                type: "info_json",
                url: "https://api.500px.com/v1/photos?rpp=100&feature=editors&consumer_key=jKV8XWb2tKyUpflXyj43nHWC5cwkvgdIkaqi5ePK&image_size=36",
                item: {
                    type: "image_json",
                    path: "photos/*",
                    imageUrlPath: "image_url",
                    link: {
                        url: "https://500px.com",
                        postfix: {
                            source: "json",
                            path: "url"
                        }
                    }
                },
                restrict: 100,
                enabled: true,
                name: "editors",
                name_zh: "精选",
                show: true
            }
        ],
        name: "500px",
        favicon: "https://500px.com/favicon.ico",
        type: "other",
        maxImage: 200,
        chance: 100
    }
    var exported = {
        getImageUrl: getImageUrl,
        start: start
    }

    Object.defineProperties(exported, {
        '_api': { writable: true, value: api },
        'api': {
            enumerable: true,
            get: function () {
                return this._api
            },
            set: function (value) {
                if (!_deepCompare(this._api, value, /(^chance$)/)) {
                    imageList.splice(0, imageList.length)
                    _copyJSON(this._api, value)
                    console.log('reload 500px images');
                    loadImageList()
                } else {
                    _copyJSON(this._api, value)
                }
            }
        }
    })

    function getImageUrl() {
        var url;
        while (!url && imageList.length > 0) {
            url = imageList.shift();
        }
        if (url) {
            url.favicon = exported.api.favicon;
            return Promise.resolve(url);
        } else {
            loadImageList();
            return Promise.reject();
        }
    }

    function loadImageList() {
        if (loading || imageList.length > exported.api.maxImage) {
            return Promise.resolve();
        }
        loading = true;
        return imageUrlLoader.parseAndLoad(exported.api, imageList)
            .then(function () {
                loading = false;
            })
    }

    function start() {
        loadImageList();
    }
    return exported;
})();
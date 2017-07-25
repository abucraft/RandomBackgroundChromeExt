var twelveHourMilisecond = 12 * 3600 * 1000;
var pixiv = (function () {
    var imageList = [];
    var loading = false;
    var api = {
        apis: [
            {
                type: "info_html",
                url: ["https://www.pixiv.net/bookmark_new_illust.php?",
                    "https://www.pixiv.net/bookmark_new_illust.php?p=2"],
                item: {
                    type: "info_html",
                    path: ".image-item a.work",
                    filter: function () { return $('.page-count', this).length === 0; },
                    url: "https://www.pixiv.net/member_illust.php?mode=medium",
                    params: [{
                        urlParam: "illust_id",
                        localParam: {
                            source: 'html',
                            path: 'img',
                            attr: 'data-id'
                        }
                    }],
                    item: {
                        type: "image_html",
                        path: "._illust_modal img",
                        imageUrlAttr: "data-src",
                        link: {
                            url: "."
                        }
                    },
                    restrict: 1,
                },
                restrict: 100,
                enabled: true,
                show: true,
                name: "following users illusts",
                name_zh: "关注用户新作"
            },
            {
                type: "info_html",
                url: "https://www.pixiv.net/ranking.php?mode=daily",
                item: {
                    type: "info_html",
                    path: "section.ranking-item",
                    filter: function () { return $('.page-count', this).length === 0; },
                    url: "https://www.pixiv.net/member_illust.php?mode=medium",
                    params: [{
                        urlParam: "illust_id",
                        localParam: {
                            source: 'html',
                            attr: 'data-id'
                        }
                    }],
                    item: {
                        type: "image_html",
                        path: "._illust_modal img",
                        imageUrlAttr: "data-src",
                        link: {
                            url: "."
                        }
                    },
                    restrict: 1,
                },
                restrict: 50,
                enabled: true,
                name: "illust ranking daily",
                name_zh: "每日插画排行榜",
                show: true,
            },
            {
                type: "info_html",
                url: "https://www.pixiv.net/ranking.php?mode=weekly",
                item: {
                    type: "info_html",
                    path: "section.ranking-item",
                    filter: function () { return $('.page-count', this).length === 0; },
                    url: "https://www.pixiv.net/member_illust.php?mode=medium",
                    params: [{
                        urlParam: "illust_id",
                        localParam: {
                            source: 'html',
                            attr: 'data-id'
                        }
                    }],
                    item: {
                        type: "image_html",
                        path: "._illust_modal img",
                        imageUrlAttr: "data-src",
                        link: {
                            url: "."
                        }
                    },
                    restrict: 1,
                },
                restrict: 50,
                name: "illust ranking weekly",
                name_zh: "每周插画排行榜",
                enabled: true,
                show: true,
            },
            {
                type: "info_html",
                url: "https://www.pixiv.net/ranking.php?mode=monthly",
                item: {
                    type: "info_html",
                    path: "section.ranking-item",
                    filter: function () { return $('.page-count', this).length === 0; },
                    url: "https://www.pixiv.net/member_illust.php?mode=medium",
                    params: [{
                        urlParam: "illust_id",
                        localParam: {
                            source: 'html',
                            attr: 'data-id'
                        }
                    }],
                    item: {
                        type: "image_html",
                        path: "._illust_modal img",
                        imageUrlAttr: "data-src",
                        link: {
                            url: "."
                        }
                    },
                    restrict: 1,
                },
                restrict: 50,
                name: "illust ranking monthly",
                name_zh: "每月插画排行榜",
                enabled: true,
                show: true,
            },
            {
                type: "info_html",
                url: "https://www.pixiv.net/bookmark.php",
                item: {
                    type: "info_html",
                    path: ".image-item a.work",
                    filter: function () { return $('.page-count', this).length === 0; },
                    url: "https://www.pixiv.net/member_illust.php?mode=medium",
                    params: [{
                        urlParam: "illust_id",
                        localParam: {
                            source: 'html',
                            path: 'img',
                            attr: 'data-id'
                        }
                    }],
                    item: {
                        type: "image_html",
                        path: "._illust_modal img",
                        imageUrlAttr: "data-src",
                        link: {
                            url: "."
                        }
                    },
                    restrict: 1,
                },
                nextUrl:{
                    url:"https://www.pixiv.net/bookmark.php",
                    postfix:{
                        path: ".pager-container .next [rel='next']",
                        attr: "href"
                    }
                },
                restrict: 40,
                name: "bookmarks",
                name_zh: "收藏",
                enabled: true,
                show: true,
            }
        ],
        name: "pixiv",
        favicon: "https://www.pixiv.net/favicon.ico",
        type: "other",
        maxImage: 600,
        chance: 100,
        version: "1.1"
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
                if (!_deepCompare(this._api, value, /(^chance$)|(^user_id$)/)) {
                    imageList.splice(0, imageList.length)
                    console.log('reload pixiv images');
                    loadImageList()
                }
                this._api = value
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
        setInterval(loadImageList, twelveHourMilisecond);
    }


    return exported;
})();
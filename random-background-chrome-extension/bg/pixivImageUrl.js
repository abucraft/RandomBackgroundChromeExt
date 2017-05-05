var twelveHourMilisecond = 12 * 3600 * 1000;
var pixiv = (function () {
    var imageList = [];
    var loading = false;
    var api = {
        apis: [
            {
                type: "info_json",
                url: "https://app-api.pixiv.net/v1/user/following?restrict=public",
                params: [{
                    urlParam: "user_id",
                    localParam: {
                        source: "rule",
                        path: "user_id"
                    }
                }],
                item: {
                    type: "info_json",
                    path: "/user_previews/*",
                    url: "https://app-api.pixiv.net/v1/user/illusts?type=illust",
                    params: [{
                        urlParam: "user_id",
                        localParam: {
                            source: "json",
                            path: "/user/id"
                        }
                    }],
                    item: {
                        type: "image_json",
                        path: "/illusts/*",
                        imageUrlPath: "/meta_single_page/original_image_url",
                        link: {
                            url: "http://www.pixiv.net/member_illust.php?mode=medium",
                            params: [
                                {
                                    urlParam: "illust_id",
                                    localParam: {
                                        source: "json",
                                        path: "/id",
                                    }
                                }
                            ]
                        }
                    },
                    restrict: 5,
                    nextUrl: "/next_url"
                },
                restrict: 10,
                nextUrl: "/next_url",
                enabled: true,
                show: true,
                name: "following users illusts",
                name_zh: "关注用户作品"
            },
            {
                type: "info_json",
                url: "https://app-api.pixiv.net/v1/illust/ranking?mode=day&content=illust",
                item: {
                    type: "image_json",
                    path: "/illusts/*",
                    imageUrlPath: "/meta_single_page/original_image_url",
                    link: {
                        url: "http://www.pixiv.net/member_illust.php?mode=medium",
                        params: [
                            {
                                urlParam: "illust_id",
                                localParam: {
                                    source: "json",
                                    path: "/id",
                                }
                            }
                        ]
                    }
                },
                restrict: 30,
                enabled: true,
                name: "illust ranking daily",
                name_zh: "每日插画排行榜",
                show: true,
            },
            {
                type: "info_json",
                url: "https://app-api.pixiv.net/v1/illust/ranking?mode=week&content=illust",
                item: {
                    type: "image_json",
                    path: "/illusts/*",
                    imageUrlPath: "/meta_single_page/original_image_url",
                    link: {
                        url: "http://www.pixiv.net/member_illust.php?mode=medium",
                        params: [
                            {
                                urlParam: "illust_id",
                                localParam: {
                                    source: "json",
                                    path: "/id",
                                }
                            }
                        ]
                    }
                },
                restrict: 30,
                name: "illust ranking weekly",
                name_zh: "每周插画排行榜",
                enabled: true,
                show: true,
            },
            {
                type: "info_json",
                url: "https://app-api.pixiv.net/v1/illust/ranking?mode=month&content=illust",
                item: {
                    type: "image_json",
                    path: "/illusts/*",
                    imageUrlPath: "/meta_single_page/original_image_url",
                    link: {
                        url: "http://www.pixiv.net/member_illust.php?mode=medium",
                        params: [
                            {
                                urlParam: "illust_id",
                                localParam: {
                                    source: "json",
                                    path: "/id",
                                }
                            }
                        ]
                    }
                },
                restrict: 30,
                name: "illust ranking monthly",
                name_zh: "每月插画排行榜",
                enabled: true,
                show: true,
            },
            {
                type: "info_json",
                url: "https://app-api.pixiv.net/v1/user/bookmarks/illust?restrict=public",
                params: [{
                    urlParam: "user_id",
                    localParam: {
                        source: "rule",
                        path: "user_id"
                    }
                }],
                item: {
                    type: "image_json",
                    path: "/illusts/*",
                    imageUrlPath: "/meta_single_page/original_image_url",
                    link: {
                        url: "http://www.pixiv.net/member_illust.php?mode=medium",
                        params: [
                            {
                                urlParam: "illust_id",
                                localParam: {
                                    source: "json",
                                    path: "/id",
                                }
                            }
                        ]
                    }
                },
                restrict: 50,
                name: "bookmarks",
                name_zh: "收藏",
                nextUrl: "/next_url",
                enabled: true,
                show: true,
            }
        ],
        name: "pixiv",
        favicon: "https://www.pixiv.net/favicon.ico",
        type: "other",
        maxImage: 600,
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

    function getUserIdP() {
        return new Promise(function (res, rej) {
            $.get('https://www.pixiv.net/member.php', {}, function (r, s, req) {
                if (req.status === 200) {
                    var text = req.responseText;
                    var index = text.indexOf('pixiv.user.id');
                    var beginIdx = text.indexOf('"', index);
                    var endIdx = text.indexOf('"', beginIdx + 1);
                    var userId = text.substr(beginIdx + 1, endIdx - beginIdx - 1);
                    exported.api['user_id'] = userId;
                    res();
                }
            }).always(function () {
                res();
            });
        });
    }
    function loadImageList() {
        if (loading || imageList.length > exported.api.maxImage) {
            return Promise.resolve();
        }
        loading = true;
        return getUserIdP().then(function () {
            return imageUrlLoader.parseAndLoad(exported.api, imageList);
        }).then(function () {
            loading = false;
        })
    }

    function start() {
        loadImageList();
        setInterval(loadImageList, twelveHourMilisecond);
    }


    return exported;
})();
var bing = (function () {
    var api = {
        apis: [
            {
                type: "info_json",
                url: "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1",
                item: {
                    type: "image_json",
                    path: "/images/*",
                    imageUrlPath: "/url",
                    link: "https://www.bing.com/",
                },
                restrict: 1,
                enabled: true,
                show: false
            }
        ],
        name: "bing",
        favicon: "https://www.bing.com/favicon.ico",
        type: "other",
        chance: 100
    }

    var exported = {
        getImageUrl: getImageUrl,
        api: api
    }

    function getImageUrl() {
        var imageList = [];
        return imageUrlLoader.parseAndLoad(exported.api, imageList).then(function () {
            if (imageList.length > 0) {
                var url = imageList.shift();
                url.url = "https://www.bing.com" + url.url;
                url.favicon = exported.api.favicon;
                return url;
            } else {
                throw "Can not fetch image url from bing";
            }
        }, function (e) {
            console.error(e);
        });
    }
    return exported;
})();

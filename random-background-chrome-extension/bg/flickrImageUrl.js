var flickr = (function () {
    var api = {
        apis: [
            {
                type: "flickr",
                url: "https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=e27813d9489e931448220614336b78b6",
                item: {
                    type: "flickr",
                    link: "https://www.flickr.com/",
                },
                restrict: 1,
                enabled: true,
                show: false
            }
        ],
        name: "flickr",
        favicon: "https://www.flickr.com/favicon.ico",
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
                url.favicon = exported.api.favicon;
                return url;
            } else {
                throw "Can not fetch image url from flickr";
            }
        }, function (e) {
            console.error(e);
        });
    }
    return exported;
})();

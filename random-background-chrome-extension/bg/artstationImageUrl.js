var artstation = (function () {
    var api = {
        apis: [
            {
                type: "info_json",
                url: "https://www.artstation.com/random_project.json?",
                item: {
                    type: "image_json",
                    path: "/assets/*",
                    imageUrlPath: "/image_url",
                },
                link: {
                    path: "/permalink"
                },
                restrict: 1,
                enabled: true,
                show: false
            }
        ],
        name: "artstation",
        favicon: "https://www.artstation.com/favicon.ico",
        type: 'other',
        chance: 100
    }

    var exported = {
        getImageUrl: getImageUrl,
        api: api
    }
    async function getImageUrl() {
        var imageList = [];
        await imageUrlLoader.parseAndLoad(exported.api, imageList);
        if (imageList.length > 0) {
            var url = imageList.shift();
            url.favicon = exported.api.favicon;
            return url;
        } else {
            throw "Can not fetch image url from artstation";
        }
    }
    return exported;

})();
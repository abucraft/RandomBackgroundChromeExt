chrome.runtime.sendMessage({ type: 'QUERY' }, function (response) {
    onloadImage(response);
})

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var img = new Image();
var base64Url, imageType;

async function onloadImage(data) {
    vm.image = data;
    var imageSrc = data.url;
    if (data.data) {
        imageSrc = getImageSrcFromBase64(data.url, data.data);
        base64Url = imageSrc;
        imageType = mapImageType(data.url);
    }
    $('body').css("background-image", `url(${imageSrc}`).css('background-size', 'cover')
        .css("background-position-x", "0%").css('background-position-y', "0%")
    img.onload = function () {
        afterRendered();
        // adjustBackgroundLocationAccordingToFace();
    }
    if (data.data) {
        img.src = getImageSrcFromBase64(data.url, data.data);
        afterRendered();
    } else {
        const response = await _fetchWithCredential(data.url);
        if (response.status === 200) {
            const arrayBuffer = await response.arrayBuffer();
            const base64str = _arrayBufferToBase64(arrayBuffer);
            img.src = getImageSrcFromBase64(data.url, base64str);
            afterRendered();
        }
    }
}


function mapImageType(url) {
    var jpg = /\.(jpg)|(jpeg)/;
    var png = /\.png/;
    var gif = /\.gif/;
    if (jpg.test(url)) {
        return 'jpg';
    } else if (png.test(url)) {
        return 'png';
    } else if (gif.test(url)) {
        return 'gif';
    } else {
        return 'png';
    }
}

function getImageSrcFromBase64(url, data) {
    return `data:image/${mapImageType(url)};base64,` + data;
}

var backgroundXPercent = 0
var backgroundYPercent = 0

var boundingRect = null

// Not useful for artstation images
function adjustBackgroundLocationAccordingToFace() {
    var tracker = new tracking.ObjectTracker('face');

    tracking.track(img, tracker);

    tracker.on('track', function (event) {
        if (event.data.length) {
            var left = img.width
            var top = img.height
            var right = 0
            var bottom = 0
            event.data.forEach(function (rect) {
                if (rect.x < left) {
                    left = rect.x
                }
                if (rect.y < top) {
                    top = rect.y
                }
                if ((rect.x + rect.width) > right) {
                    right = rect.x + rect.width
                }
                if ((rect.y + rect.height) > bottom) {
                    bottom = rect.y + rect.height
                }
            });
            boundingRect = {
                left, top, width: right - left, height: bottom - top
            }
            // backgroundXPercent = ((right + left) / 2) / img.width
            // backgroundYPercent = ((top + bottom) / 2) / img.height
            // $('body').css("background-position-x", `${backgroundXPercent * 100}%`)
            // $('body').css("background-position-y", `${backgroundYPercent * 100}%`)
            event.data.forEach(function (rect) {
                var windowRect = imageRectToWindow({ left: rect.x, top: rect.y, width: rect.width, height: rect.height })
                $('body').append(`<div style="position:fixed;border:3px solid green; left:${windowRect.left}px; top:${windowRect.top}px; width:${windowRect.width}px; height:${windowRect.height}px"></div>`)
            })
            var windowRect = imageRectToWindow(boundingRect)
            $('body').append(`<div style="position:fixed;border:3px solid green; left:${windowRect.left}px; top:${windowRect.top}px; width:${windowRect.width}px; height:${windowRect.height}px"></div>`)
        }
    });
}

function afterRendered() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    setButtonColor();
    var interval = setInterval(function () {
        setButtonColor();
        setTimeout(function () {
            clearInterval(interval)
        }, MINUTE);
    }, 1000)
    $(window).on('resize', setButtonColor);
}

// check and change the corner text to white if background is dark
function setButtonColor() {
    changeElementFontColor($('#setting-panel > .top-left > .mdl-button'));
}

function changeElementFontColor(elm) {
    var rect = element2ImageRect(elm);
    if (rect && rect.width && rect.height) {
        var imageData = ctx.getImageData(rect.left, rect.top, rect.width, rect.height);
        var total = imageData.height * imageData.width;
        var red = 0;
        var green = 0;
        var blue = 0;
        for (var i = 0; i < total; i++) {
            red += imageData.data[i * 4];
            green += imageData.data[i * 4 + 1];
            blue += imageData.data[i * 4 + 2];
        }
        red = red / total;
        green = green / total;
        blue = blue / total;
        var average = red * 0.299 + green * 0.587 + blue * 0.114;
        var jqElm = $(elm);
        // If greyscale of background in the rect area is low then change the font color to white
        if (average < 128) {
            jqElm.css('color', 'white');
            jqElm.css('fill', 'white');
            jqElm.find('a').css('color', 'white');
            jqElm.find('span').css('color', 'white');
        } else {
            jqElm.css('color', '');
            jqElm.css('fill', '');
            jqElm.find('a').css('color', '');
            jqElm.find('span').css('color', '');
        }
    }
}

// Change the client rect of element to the rect of background image
function element2ImageRect(elm) {
    var elm = $(elm);
    if (elm.length > 0) {
        var elmRect = elm[0].getClientRects()[0];
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;
        var imgWidth = img.width;
        var imgHeight = img.height;
        var rect = {};
        var scaleX = windowWidth / imgWidth;
        var scaleY = windowHeight / imgHeight
        var scale = Math.max(scaleX, scaleY)
        var imgRatio = imgWidth / imgHeight
        var windowRatio = windowWidth / windowHeight
        var offsetXPercent = 0
        var offsetYPercent = 0
        if (imgRatio > windowRatio) {
            offsetXPercent = Math.min(imgRatio / windowRatio - 1, Math.max(0, backgroundXPercent * imgRatio / windowRatio - 0.5))
        } else {
            offsetYPercent = Math.min(windowRatio / imgRatio - 1, Math.max(0, backgroundYPercent * windowRatio / imgRatio - 0.5))
        }
        var offsetX = offsetXPercent * windowWidth
        var offsetY = offsetYPercent * windowHeight
        rect.left = (elmRect.left + offsetX) / scale;
        rect.top = (elmRect.top + offsetY) / scale;
        rect.width = elmRect.width / scale;
        rect.height = elmRect.height / scale;
        return rect;
    }
    return null;
}

function imageRectToWindow(rect) {
    var windowHeight = window.innerHeight;
    var windowWidth = window.innerWidth;
    var imgWidth = img.width;
    var imgHeight = img.height;
    var windowRect = {}
    var scaleX = windowWidth / imgWidth;
    var scaleY = windowHeight / imgHeight
    var scale = Math.max(scaleX, scaleY)
    var imgRatio = imgWidth / imgHeight
    var windowRatio = windowWidth / windowHeight
    var offsetXPercent = 0
    var offsetYPercent = 0
    if (imgRatio > windowRatio) {
        offsetXPercent = Math.min(imgRatio / windowRatio - 1, Math.max(0, backgroundXPercent * imgRatio / windowRatio - 0.5))
    } else {
        offsetYPercent = Math.min(windowRatio / imgRatio - 1, Math.max(0, backgroundYPercent * windowRatio / imgRatio - 0.5))
    }
    var offsetX = offsetXPercent * windowWidth
    var offsetY = offsetYPercent * windowHeight
    windowRect.left = rect.left * scale - offsetX;
    windowRect.top = rect.top * scale - offsetY;
    windowRect.width = rect.width * scale
    windowRect.height = rect.height * scale
    return windowRect
}

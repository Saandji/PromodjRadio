$(function() {
    function animate() {
        var width = parseInt(100/ 19, 10);
        var canvas = document.getElementById('canvas');
        var drawContext = canvas.getContext('2d');
        drawContext.clearRect(0, 0, 19, 19);
        // Draw a frame around the visualizer
        frameHelper(drawContext);
        // Draw the visualizer itself
        for (var i = 0; i < 20; i++) {
            var value = freqs[i * width];
            percent = value / 256;
            var height = 19 * percent;
            var offset = 18 - height;
            // drawContext.fillStyle = 'rgb(255, 0, 0)';
            drawContext.fillStyle = 'hsl(' + (10 + (2*i)) + ', 100%, 50%)';
            drawContext.fillRect(i, offset, 1, height);
        }
        // Display visualizer in the browser action, extracting it from the
        // canvas element.
        var imageData = drawContext.getImageData(0, 0, 19, 19);
        chrome.browserAction.setIcon({
            imageData: imageData
        });
    }

    function frameHelper(context) {
        context.beginPath();
        context.moveTo(0, 19);
        context.lineTo(19, 19);
        context.strokeStyle = '#666';
        context.stroke();
    }

    $('.animate-toggle-div').click(chrome.browserAction.setIcon({
        path: 'images/icon.png'
    }));

    function start() {

    }
});

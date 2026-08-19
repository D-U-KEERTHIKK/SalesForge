// Requirements
// Canvas with id "myCanvas"
// Javascript file: imageMap.js

//Maps Image names to Image URL
var allImageURL = {
  // "action": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Action_Node_Opaque.png?token=AJVCNrzfEPzhapX5SNLmYTtMuSsXga2Cks5Xv1SVwA%3D%3D", 
  // "decision": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Decision_Node_Opaque.png?token=AJVCNjsDvAy93Azt_Ys4bXfMF21Uh5ibks5Xv1SuwA%3D%3D", 
  // "match": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Match_Node_Opaque.png?token=AJVCNn3IbKqrETcNF02hmuzlHvdLJFm7ks5Xv1TLwA%3D%3D", 
  // "trigger": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Trigger_Node_Opaque.png?token=AJVCNky09qpzJllxqOHQDWi3bJ74ubSPks5Xv1TjwA%3D%3D",
  // "reroute": "https://c.na73.visual.force.com/resource/1540167474000/magellan_app/images/Time-Node_FB-static@2x.png",
  'outreach': 'https://user-images.githubusercontent.com/348513/49678563-ff69be00-fa39-11e8-85a3-06bbef7ed8ba.png',
};

var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
var keyStack = [];
var workStack = [];

for (imageURL in allImageURL) {
    if (allImageURL.hasOwnProperty(imageURL)) {
        keyStack.push(imageURL);
        workStack.push(allImageURL[imageURL]);
    }
}

// Define what a red pixel is
var injectedImageData = context.createImageData(1, 1);
var pixelData = injectedImageData.data;
pixelData[0] = 255;
pixelData[1] = 0;
pixelData[2] = 0;
pixelData[3] = 255;

function drawImage(counter) {
    if (counter >= workStack.length) {
        return undefined;
    } else {
        var image = new Image();
        var imageURL = workStack[counter];
        image.crossOrigin = "Anonymous";
        image.src = imageURL;

        image.onload = function() {

            var offsetX = 0;
            var offsetY = 0;

            // Too hacky
            if (counter === 0) {
                offsetX = 0;
                offsetY = 0;
            } else if (counter === 1) {
                offsetX = 150;
                offsetY = 0;
            } else if (counter === 2) {
                offsetX = 0;
                offsetY = 150;
            } else if (counter === 3) {
                offsetX = 150;
                offsetY = 150;
            }

            // Draw the image with offset
            context.drawImage(image, offsetX, offsetY, image.naturalWidth, image.naturalHeight);

            // This function defers calling the next image to draw
            // further until the aux image has been drawn too
            function auxCall(counter) {

                var auxImage = new Image();
                auxImage.crossOrigin = "Anonymous";
                auxImage.src = "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/AssignmentRule.png?token=AJVCNr4yzCIjWudRcXpg6udtXCJifWUCks5Xv1UAwA%3D%3D";

                auxImage.onload = function() {
                    context.drawImage(auxImage, offsetX + 74, offsetY + 42, auxImage.naturalWidth, auxImage.naturalWidth);
                    drawImage(counter + 1);
                }
            }

            if (keyStack[counter] === "action") {
                auxCall(counter);
            } else {

                // Draw the next image
                drawImage(counter + 1);
            }

            // Draw red pixel on intersection points
            for (var count = 0; count < 3600; count++) {
                var angle = count / 3600 * 360;
                var intersectionPoint = Magellan.Util.getIntersectionFromAngle(keyStack[counter], angle);
                context.putImageData(injectedImageData, offsetX + intersectionPoint[0], offsetY + intersectionPoint[1]);
            }
        };
    }
}

// Draw the images on canvas
drawImage(0);

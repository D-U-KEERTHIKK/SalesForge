// Requirements
// Canvas with id "myCanvas"

// Maps Image names to Image URL
var allImageURL = {
  'outreach': 'https://c.na59.visual.force.com/resource/1544229431000/magellan_app/images/mini-outreach.png',
  /*/ 
  "action": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Action_Node_Opaque.png?token=AJVCNrzfEPzhapX5SNLmYTtMuSsXga2Cks5Xv1SVwA%3D%3D",
  "decision": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Decision_Node_Opaque.png?token=AJVCNjsDvAy93Azt_Ys4bXfMF21Uh5ibks5Xv1SuwA%3D%3D",
  "match": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Match_Node_Opaque.png?token=AJVCNn3IbKqrETcNF02hmuzlHvdLJFm7ks5Xv1TLwA%3D%3D",
  "trigger": "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/Trigger_Node_Opaque.png?token=AJVCNky09qpzJllxqOHQDWi3bJ74ubSPks5Xv1TjwA%3D%3D",
  /*/
};

// Define the number of intersection points to calculate
var granularity = 3600;

var intersectionFunction = undefined;
processImages(allImageURL, granularity);

// Processes all images in imageArr assuming imageOffsetX and imageOffsetY is 0
function processImages(allImageURL, degreeGranularity) {

    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");

    var resultImageMap = {};
    var workStack = [];

    // Add work to stack
    for (imageString in allImageURL) {
        if (allImageURL.hasOwnProperty(imageString)) {
            workStack.push(imageString);
        }
    }

    // Clears async work in stack, forcefully-sequentially
    function doImageProcessingWork(counter) {

        // When no more work left, define the intersectionFunction
        if (counter >= workStack.length) {
            intersectionFunction = function(imageString, angleInDegrees) {
                imageString = imageString.toLowerCase();
                return resultImageMap[imageString](angleInDegrees);
            };
        } else {

            // Define the current image to draw
            var image = new Image();
            var imageString = workStack[counter];
            image.crossOrigin = "Anonymous";
            image.src = allImageURL[imageString];
            image.identifier = imageString;

            // Chains the callback to call the next (if any) image to draw
            image.onload = function() {
                context.drawImage(image, 0, 0);

                if (image.identifier === "action") {
                    var auxImage = new Image();
                    auxImage.crossOrigin = "Anonymous";
                    auxImage.src = "https://raw.githubusercontent.com/KnightNiwrem/EdgeDetector/canvasSandBox/images/AssignmentRule.png?token=AJVCNr4yzCIjWudRcXpg6udtXCJifWUCks5Xv1UAwA%3D%3D";

                    auxImage.onload = function() {
                        context.drawImage(auxImage, 74, 42);

                        var intersectionAngleFunction = processImage(image, granularity, context, 35, 35);
                        resultImageMap[imageString] = intersectionAngleFunction;

                        //context.clearRect(0, 0, canvas.width, canvas.height);
                        doImageProcessingWork(counter + 1);
                    };
                } else {
                    var intersectionAngleFunction = processImage(image, granularity, context, 0, 0);
                    resultImageMap[imageString] = intersectionAngleFunction;

                    //context.clearRect(0, 0, canvas.width, canvas.height);
                    doImageProcessingWork(counter + 1);
                }
            };
        }
    }

    // Starts the drawing process
    doImageProcessingWork(0);
}

// Returns a function that checks if coordinate is in image's bounding box
function getBoundaryCheckFunction(image, extraWidth, extraHeight) {

    return function(x, y) {
        var boundaryCheckX = (x >= 0) && (x <= image.naturalWidth + extraWidth - 1);
        var boundaryCheckY = (y >= 0) && (y <= image.naturalHeight + extraHeight - 1);

        return boundaryCheckX && boundaryCheckY;
    };
}

// degreeGranularity defines the number of intersection points to calculate
function processImage(image, degreeGranularity, canvasContext, extraWidth, extraHeight) {

    // Stores all the data for the points of intersections
    var storedIntersections = [];

    // Rounds to the nearest pixel
    var imageCenterCoordinateX = Math.round(image.naturalWidth / 2);
    var imageCenterCoordinateY = Math.round(image.naturalHeight / 2);

    // Unit vector with zero angle points upwards
    var zerothGradient = [0, -1];

    // Get boundaryCheckFunction for this image
    var withinBoundary = getBoundaryCheckFunction(image, extraWidth, extraHeight);

    // Iterate through all the angle "granule"
    for (var counter = 0; counter < degreeGranularity; counter++) {

        // Basic information for coordinate calculations
        var currentAngleInDegrees = counter / degreeGranularity * 360;
        var currentAngleInRadians = currentAngleInDegrees * Math.PI / 180;
        var sinAngle = Math.sin(currentAngleInRadians);
        var cosAngle = Math.cos(currentAngleInRadians);

        var gradientX = zerothGradient[0] * cosAngle - zerothGradient[1] * sinAngle;
        var gradientY = zerothGradient[0] * sinAngle + zerothGradient[1] * cosAngle;

        // This is the gradient of the line from center of image
        var gradient = [gradientX, gradientY];

        var currentX = imageCenterCoordinateX;
        var currentY = imageCenterCoordinateY;

        var stepSize = 0.2

        // Pixel data is RGBA as array
        var currentPixelData = canvasContext.getImageData(Math.round(currentX), Math.round(currentY), 1, 1).data;

        // Fine-grained linear search
        while (withinBoundary(currentX, currentY) && currentPixelData[3] > 0.4) {
            currentX += gradientX * stepSize;
            currentY += gradientY * stepSize;
            currentPixelData = canvasContext.getImageData(Math.round(currentX), Math.round(currentY), 1, 1).data;
        }

        currentX = Math.max(currentX, 0);
        currentY = Math.max(currentY, 0);
        currentX = Math.min(currentX, image.naturalWidth + extraWidth);
        currentY = Math.min(currentY, image.naturalHeight + extraWidth);

        storedIntersections[counter] = [Math.round(currentX), Math.round(currentY)];

        /*
        // Fine-grained linear search
        // Works with bulleyes like structure, but way slower
        while (withinBoundary(currentX, currentY)) {
            currentX += gradientX * stepSize;
            currentY += gradientY * stepSize;
            currentPixelData = canvasContext.getImageData(Math.round(currentX), Math.round(currentY), 1, 1).data;

            if (currentPixelData[3] > 0.5) {
                storedIntersections[counter] = undefined;
            } else if (storedIntersections[counter] === undefined && currentPixelData[3] <= 0.5) {
                currentX = Math.max(currentX, 0);
                currentY = Math.max(currentY, 0);

                currentX = Math.min(currentX, image.naturalWidth);
                currentY = Math.min(currentY, image.naturalHeight);
                storedIntersections[counter] = [Math.round(currentX), Math.round(currentY)];
            } else {
                continue;
            }
        }
        */
    }

    // Returns a function that accepts some angle
    // and returns the points of intersection
    return function(angleInDegrees) {

        // For self use - generates map in console
        if (angleInDegrees === "debug") {
            var angleToPointMap = {};
            
            for (var i = 0; i < storedIntersections.length; i++) {
                angleToPointMap[i] = storedIntersections[i];
            }
            return angleToPointMap;
        } else {
            var remainderAngle = angleInDegrees % 360;
            var scaledIndex = Math.round(remainderAngle * (degreeGranularity / 360));
            return storedIntersections[scaledIndex];
        }
    };
}

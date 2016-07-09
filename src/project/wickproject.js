/* Wick - (c) 2016 Zach Rispoli, Luca Damasco, and Josh Rispoli */

/*****************************
    Projects
*****************************/

// Holds the root object and some project settings.

var WickProject = function () {

    // Create the root object.
    // The editor is always editing the root object or its sub-objects and 
    // cannot ever leave the root object.
    this.rootObject = WickObject.createNewRootObject();
    
    this.resolution = {};
    this.resolution.x = 650;
    this.resolution.y = 500;

    this.backgroundColor = "#FFFFFF";

    this.framerate = 12;

    this.fitScreen = false;
    this.drawBorders = true;
    this.borderColor = "#FFFFFF";

};

WickProject.fromJSON = function (JSONString) {
    // Replace current project with project in JSON
    var projectFromJSON = JSON.parse(JSONString);

    // Put prototypes back on object ('class methods'), they don't get JSONified on project export.
    projectFromJSON.__proto__ = WickProject.prototype;
    WickObjectUtils.putWickObjectPrototypeBackOnObject(projectFromJSON.rootObject);

    // Regenerate parent object references
    // These were removed earlier because JSON can't handle infinitely recursive objects (duh)
    projectFromJSON.rootObject.regenerateParentObjectReferences();

    // Decode scripts back to human-readble and eval()-able format
    projectFromJSON.rootObject.decodeStrings();

    return projectFromJSON;
}

WickProject.prototype.exportAsHTMLFile = function () {
    var fileOut = "";

    // Add the player webpage (need to download the empty player)
    fileOut += FileDownloader.downloadFile("src/player/emptyplayer.htm") + "\n";

    // Add any libs that the player needs
    fileOut += "<script>" + FileDownloader.downloadFile("lib/pixi.min.js") + "</script>\n";
    fileOut += "<script>" + FileDownloader.downloadFile("lib/fpscounter.js") + "</script>\n";
    fileOut += "<script>" + FileDownloader.downloadFile("lib/verboselog.js") + "</script>\n";
    fileOut += "<script>" + FileDownloader.downloadFile("lib/browserdetection.js") + "</script>\n";
    fileOut += "<script>" + FileDownloader.downloadFile("lib/base64-arraybuffer.js") + "</script>\n";

    // Add the player (need to download the player code)
    fileOut += "<script>" + FileDownloader.downloadFile("src/project/wickobject.js") + "</script>\n";
    fileOut += "<script>" + FileDownloader.downloadFile("src/player/wickplayer.js") + "</script>\n";

    // Bundle the JSON project
    this.getAsJSON(function (JSONProject) {
        fileOut += "<script>WickPlayer.runProject('" + JSONProject + "');</script>" + "\n";

        // Save whole thing as html file
        var blob = new Blob([fileOut], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "project.html");
    });
}

WickProject.prototype.exportAsJSONFile = function () {
    // Save JSON project and have user download it
    this.getAsJSON(function (JSONProject) {
        var blob = new Blob([JSONProject], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "project.json");
    });
}

WickProject.prototype.getAsJSON = function (callback) {

    // Rasterize SVGs
    var that = this;
    this.rootObject.generateSVGCacheImages(function () {
        // Remove parent object references 
        // (can't JSONify objects with circular references, player doesn't need them anyway)
        that.rootObject.removeParentObjectRefences();

        // Encode scripts/text to avoid JSON format problems
        that.rootObject.encodeStrings();

        var JSONProject = JSON.stringify(that);

        // Put parent object references back in all objects
        that.rootObject.regenerateParentObjectReferences();

        // Decode scripts back to human-readble and eval()-able format
        that.rootObject.decodeStrings();

        callback(JSONProject);
    });

}

WickProject.prototype.saveInLocalStorage = function () {
    if(localStorage) {
        try {
            VerboseLog.log("Saving project to local storage...");
            this.getAsJSON(function (JSONProject) {
                localStorage.setItem('wickProject', JSONProject);
            });
        } catch (err) {
            VerboseLog.error("LocalStorage could not save project, threw error:");
            VerboseLog.log(err);
        }
    } else {
        console.error("LocalStorage not available.")
    }
}
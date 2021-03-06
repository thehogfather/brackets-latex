/**
 * Manages saving and getting preferences
 * @author Patrick Oladimeji
 * @date 4/26/14 20:59:24 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/
define(function (require, exports, module) {
    "use strict";

    var PreferenceManager        = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager           = brackets.getModule("project/ProjectManager"),
        prefs                    = PreferenceManager.getExtensionPrefs("brackets-latex");
    //define default preference values
    prefs.definePreference("texBinDirectory", "string", brackets.platform === "win" ? "" : "/usr/texbin");
    prefs.definePreference("timeout", "number", 60000);
    prefs.definePreference("outputDirectory", "string", "out");
    prefs.definePreference("compiler", "string", "pdflatex");
    prefs.definePreference("platform", "string", brackets.platform);
    prefs.definePreference("mainFile", "string", "");
    PreferenceManager.stateManager.definePreference("consoleVisibilityMap", "object", {});
    
    function get(key) {
        return prefs.get(key, PreferenceManager.CURRENT_PROJECT);
    }

    function getAllValues() {
        var props = {}, keys = ["texBinDirectory", "timeout", "outputDirectory", "compiler", "platform", "mainFile"];
        keys.forEach(function (key) {
            props[key] = get(key);
        });
        return props;
    }

    function set(key, value) {
        prefs.set(key, value, { location: { scope: "project"}});
    }

    function getViewStateContext() {
        var projectRoot = ProjectManager.getProjectRoot();
        return {
            location: {
                scope: "user",
                layer: "project",
                layerID: projectRoot && projectRoot.fullPath
            }
        };
    }
    
    function getConsoleVisibilityMap() {
        var context = getViewStateContext();
        return PreferenceManager.getViewState("consoleVisible", context);
        
    }
    
    function setConsoleVisibilityMap(map) {
        var context = getViewStateContext();
        PreferenceManager.setViewState("consoleVisible", map, context);
    }
    
    module.exports = {
        getAllValues: getAllValues,
        get: get,
        set: set,
        prefsObject: prefs,
        getConsoleVisibilityMap: getConsoleVisibilityMap,
        setConsoleVisibilityMap: setConsoleVisibilityMap
    };
});

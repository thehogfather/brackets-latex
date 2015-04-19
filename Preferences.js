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
        prefs                    = PreferenceManager.getExtensionPrefs("brackets-latex"),
        DefaultSettings          = require("DefaultSettings");

    function get(key) {
        return prefs.get(key) || DefaultSettings[key];
    }

    function getAllValues() {
        var props = {};
        Object.keys(DefaultSettings).forEach(function (key) {
            props[key] = get(key);
        });
        return props;
    }



    function set(key, value) {
        prefs.set(key, value);
        prefs.save();
    }

    module.exports = {
        getAllValues: getAllValues,
        get: get,
        set: set
    };
});

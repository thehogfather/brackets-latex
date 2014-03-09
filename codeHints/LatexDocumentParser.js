/**
 * utility function to parse a latex document and return a list of labels, 
 * @author Patrick Oladimeji
 * @date 12/9/13 9:59:50 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var matchAll = require("util").matchAll;
    
    function _getMatches(regex, text) {
        var matches = matchAll(regex, text);
        if (matches) {
            return matches.map(function (d) {
                return d.matches[1];
            });
        }
        return undefined;
    }
    
    function getLabels(text) {
        var regex = /\\label\{([\w\:]+)\}/g;
        return _getMatches(regex, text);
    }
    
    function getCiteKeys(bibtex) {
        var regex = /@\w+\{([\w\:]+),/g;
        return _getMatches(regex, bibtex);
    }
    
    module.exports = {
        getCiteKeys: getCiteKeys,
        getLabels: getLabels
    };
});
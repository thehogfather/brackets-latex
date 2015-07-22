/**
 * utility function to parse a latex document and return a list of labels,
 * @author Patrick Oladimeji
 * @date 12/9/13 9:59:50 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/
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
        var res = _getMatches(regex, text);
        if (res) {
            res.sort();
        }
        return res;
    }

    function getCiteKeys(bibtex) {
        var regex = /@\w+\{([\w\:]+),/g;
        var res = _getMatches(regex, bibtex);
        if (res) {
            res.sort();
        }
        return res;
    }

    function getBibFileName(text) {
        var regex = /\\bibliography\{([^\}]+)\}/;
        var match = regex.exec(text);
        var fileName = match ? match[1] : null;
        if (fileName && fileName.indexOf(".bib") < 0) {
            fileName = fileName.concat(".bib");
        }
        return fileName;
    }



    module.exports = {
        getCiteKeys: getCiteKeys,
        getLabels: getLabels,
        getBibFileName: getBibFileName
    };
});

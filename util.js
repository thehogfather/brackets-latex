/**
 * 
 * @author Patrick Oladimeji
 * @date 12/9/13 10:14:09 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    /**
     * Utility function for matching all instances of a regular expression in a string
     * @param regex the regular expression to apply
     * @param string the string to apply the regular expression on
     * returns Array<> an array of matches along with the index of occurence in the string
     */
    function _matchAll(regex, string) {
        var res = [], m = regex.exec(string);
        while (m) {
            res.push({index: m.index, matches: m});
            m = regex.exec(string);
        }
        return res;
    }
    
    exports.matchAll = _matchAll;
});

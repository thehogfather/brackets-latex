/**
 * Default settings for the latex compilation
 * @author Patrick Oladimeji
 * @date 12/2/13 8:30:17 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    module.exports = {
        texBinDirectory : brackets.platform === "win" ? "" : "/usr/texbin",
        timeout         : 60000,
        outputDirectory : "out",//path relative to source latex directory
        draftMode       : false,
        outputFormat    : "pdf", //can be dvi or ps
        platform        : brackets.platform
    };
});
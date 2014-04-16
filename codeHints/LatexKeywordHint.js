/**
 * Adds support for code hinting in latex
 * @author Patrick Oladimeji
 * @date 12/12/13 15:26:07 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var AppInit              = brackets.getModule("utils/AppInit"),
        CodeHintManager      = brackets.getModule("editor/CodeHintManager"),
        TokenUtils           = brackets.getModule("utils/TokenUtils"),
        LatexKeywords        = require("text!codeHints/LatexKeywords.json"),
        properties           = JSON.parse(LatexKeywords).values;
    
    function LatexKeyWordHint() { }
    
    LatexKeyWordHint.prototype.hasHints = function (editor, implicitChar) {
        //the editor should have hints for all latex keywords (triggered by a \)
        this.editor = editor;
        return implicitChar ? implicitChar === "\\" : false;
    };
     /**
     * Returns a list of availble latex propertyname or -value hints if possible for the current
     * editor context. 
     * 
     * @param {Editor} implicitChar 
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     * 2. a string match that is used by the manager to emphasize matching
     *    substrings when rendering the hint list
     * 3. a boolean that indicates whether the first result, if one exists,
     *    should be selected by default in the hint list window.
     * 4. handleWideResults, a boolean (or undefined) that indicates whether
     *    to allow result string to stretch width of display.
     */
    LatexKeyWordHint.prototype.getHints = function (implicitChar) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor);
        		
        var q = token.string.substr(0, cursor.ch - token.start);
		
		var i = 0;
		var max_hints = 8;
		
        var hints = properties.filter(function (d) {
			if (i === max_hints) { return false; }
			if (d.indexOf(q) === 0) {
				i++;
				return true;
			}
            return false;
        });
		
        if (hints && hints.length) {
            return {
                hints: hints,
                match: q,
                selectInitial: true,
                handleWideResults: false
            };
        } else {
            return null;
        }
    };
    
    LatexKeyWordHint.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor),
            start = {line: cursor.line, ch: token.start},
            end = {line: cursor.line, ch: token.end};
        this.editor.document.replaceRange(hint, start, end);
        return false;
    };
    
    module.exports = LatexKeyWordHint;
});

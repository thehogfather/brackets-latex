/**
 * Adds support for code hinting in latex-specifically for label code hints
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
        LatexDocumentParser  = require("codeHints/LatexDocumentParser");
        
    function LatexLabelHint() {}
    
    LatexLabelHint.prototype.hasHints = function (editor, implicitChar) {
        //there should also be hints for references made in label tags in the document
        this.editor = editor;
        var cursor = editor.getCursorPos();
        var cm = editor._codeMirror, token;
        if (implicitChar === "{") {
            token = cm.getTokenAt({line: cursor.line, ch: cursor.ch - 1});
            return token.string.indexOf("ref") >= 0;
        } else {
            return false;
        }
        
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
    LatexLabelHint.prototype.getHints = function (implicitChar) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor);
        
        var q = token.string[0] === "{" ? token.string.substr(1) : token.string;
        var hints = LatexDocumentParser.getLabels(this.editor.document.getText()).filter(function (d) {
            return d.indexOf(q) > 0;
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
    
    LatexLabelHint.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor),
            start = {line: cursor.line, ch: token.start},
            end = {line: cursor.line, ch: token.end};
        this.editor.document.replaceRange(hint, start, end);
        return false;
    };
    
    module.exports = LatexLabelHint;
});

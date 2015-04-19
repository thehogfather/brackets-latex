/**
 *
 * @author Patrick Oladimeji
 * @date 8/24/14 11:58:13 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */
define(function (require, exports, module) {
    "use strict";
    var LatexDocumentParser  = require("codeHints/LatexDocumentParser"),
        LatexContextHelper   = require("codeHints/LatexContextHelper"),
        ProjectManager		 = brackets.getModule("project/ProjectManager"),
        FileUtils			 = brackets.getModule("file/FileUtils");

    function LatexCiteKeyHint() {}

    /**
        The context has hints iff
        1. we just entered a \cite{\w*
    */
    function contextHasHints(editor) {
        var contextTokens = LatexContextHelper.getContextTokens(editor);
        return contextTokens.keyWordToken.string === "\\cite" && contextTokens.bracketToken.string === "{";
    }

    function getBibFileName(editor) {
        var regex = /\\bibliography\{([^\}]+)\}/;
        var match = regex.exec(editor.document.getText());
        var fileName = match ? match[1] : null;
        if (fileName && fileName.indexOf(".bib") < 0) {
            fileName = fileName.concat(".bib");
        }
        return fileName;
    }

    LatexCiteKeyHint.prototype.hasHints = function (editor, implicitChar) {
        //there should also be hints for references made in label tags in the document
        this.editor = editor;
        return contextHasHints(editor);
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
    LatexCiteKeyHint.prototype.getHints = function (implicitChar) {
        var tokens = LatexContextHelper.getContextTokens(this.editor);
        var label = tokens.labelToken.string;
        var q = label === "{" ? "" : label;
        var bibFileName = getBibFileName(this.editor);
        if (!bibFileName) {	return null; }

        var res = $.Deferred();

        ProjectManager.getAllFiles(function (f, n) {
            return f.name === bibFileName;
        }).then(function (files) {
            FileUtils.readAsText(files[0]).then(function (bibTexts) {
                var hints = LatexDocumentParser.getCiteKeys(bibTexts).filter(function (d) {
                    return d.indexOf(q) === 0;
                });
                if (hints && hints.length) {
                    res.resolve({
                        hints: hints,
                        match: q,
                        selectInitial: true,
                        handleWideResults: false
                    });
                } else {
                    res.resolve(null);
                }
            }, function (err) {res.reject();});
        });
        return res;
    };

    LatexCiteKeyHint.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor),
            start = {line: cursor.line, ch: token.start},
            end = {line: cursor.line, ch: token.end};
        this.editor.document.replaceRange(hint, start, end);
        return false;
    };

    module.exports = LatexCiteKeyHint;
});

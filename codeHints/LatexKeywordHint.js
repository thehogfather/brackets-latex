/**
 * Adds support for code hinting in latex
 * @author Patrick Oladimeji
 * @date 12/12/13 15:26:07 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";
    var LatexKeywords        = require("text!codeHints/LatexKeywords.json"),
        LatexContextHelper   = require("codeHints/LatexContextHelper"),
        value_props          = JSON.parse(LatexKeywords).values,
        begin_props          = JSON.parse(LatexKeywords).begin;

    var insert_curly = false;
    function LatexKeyWordHint() { }

    // reverse a string
    function reverse_str(s) {
        return s.split("").reverse().join("");
    }

    /**
    There is a keyword hint iff we are in one of the states below
        1. we are in a context matching \
        2. we are in a context matching \(\w+)
        3. we are in a context matching \(\w+){
        4. we are in a context matching \(\w+){(\w+)
    */
    LatexKeyWordHint.prototype.hasHints = function (editor, implicitChar) {
        //the editor should have hints for all latex keywords (triggered by a \)
        this.editor = editor;
        if (implicitChar && (implicitChar === "\\" || implicitChar === "{")) {
            return true;
        } else {
            var contextTokens = LatexContextHelper.getContextTokens(editor);
            if (contextTokens.keyWordToken.string.indexOf("\\") === 0 || contextTokens.bracketToken.string === "{") {
                return true;
            }
        }

        return false;
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

        // get the line and reverse the text
        var lineBeginning = {line: cursor.line, ch: 0};
        var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
        var reversed_text = reverse_str(textBeforeCursor);

        var noHintChars = /[,.\[\]0-9 ()$|]/;

        var pos_curly = reversed_text.indexOf("{");
        var pos_backSlash = reversed_text.indexOf("\\");
        var pos_noHint = reversed_text.search(noHintChars);

        // check if hints are available
        if (pos_noHint >= 0 && (pos_backSlash < 0 || pos_noHint < pos_backSlash) && (pos_curly < 0 || pos_noHint < pos_curly)) {
            return null;
        }

        var start_char;
        if (pos_curly >= 0 && pos_curly < pos_backSlash) {
            start_char = '{';
        } else {
            start_char =  '\\';
        }

        var i = 0;
        var max_hints = 8;
        var q = token.string.substr(0, cursor.ch - token.start),
            hints,
            word;

        switch (start_char) {
        case "\\":
            // only one and not 2 backslashes! (\\ is a line break)
            if (reversed_text.substr(0, 2) !== '\\\\') {
                insert_curly = false;
                hints = value_props.filter(function (d) {
                    if (d.indexOf(q) === 0) {
                        i++;
                        return true;
                    }
                    return false;
                });
                hints = this.getSortedHints(hints,q).slice(0,max_hints);
            }
            break;
        case "{": // hints for words after \begin{ or \end{
            word = reverse_str(reversed_text.substring(reversed_text.indexOf("{") + 1, reversed_text.indexOf("\\"))).trim();

            if (q === "{") { q = q.substr(1); }
            if (word === "begin" || word === "end") {
                hints = begin_props.filter(function (d) {
                    if (i === max_hints) { return false; }
                    if (d.indexOf(q) === 0) {
                        i++;
                        return true;
                    }
                    return false;
                });
                insert_curly = !this.editor._getOption("closeBrackets");
            } else { hints = []; }
            break;
        }

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

    LatexKeyWordHint.prototype.getSortedHints = function(hints,q) {
        var text = this.editor.document.getText();

        q = q.substr(1);
        var commandsRegex = q.length > 0 ?	new RegExp('([\\\\]'+q+'([a-z]*?)(?:[ \\n$]|(\{[^}]+\})))','g') :
                                            new RegExp('([\\\\]([A-Za-z]+)(?:[ \\n$]|(\{[^}]+\})))','g');
        var matches = null;
        while ((matches = commandsRegex.exec(text))) {
            if (matches[3]) {
                hints.push('\\'+q+matches[2]+matches[3]);
            }
            hints.push('\\'+q+matches[2]);
        }
        // sort the hints
        hints.sort();
        // unique
        var last = hints[0],
            savedPos = false,
            hits = [0],
            sortedHints = [],
            hit,
            h;
        for (var i = 1; i < hints.length; i++) {
            hit = hits[0];
            h = 0;
            if (hints[i] === last && !savedPos) {
                savedPos = i;
            } else if (hints[i] !== last) {
                while ((savedPos ? (i-savedPos) : 1) <= hit) {
                    hit = hits[++h];
                }
                hits.splice(h,0,(savedPos ? (i-savedPos) : 1));
                sortedHints.splice(h,0,last);
                savedPos = false;
                last = hints[i];
            }
        }
        if (savedPos) {
            hit = hits[0];
            h = 0;
            while ((savedPos ? (i-savedPos) : 1) < hit) {
                    hit = hits[++h];
            }
            sortedHints.splice(h,0,last);
        }
        return sortedHints;
    };

    LatexKeyWordHint.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor);

        if (token.end > cursor.ch) {
            token.string = token.string.substring(token.start, cursor.ch);
            token.end = cursor.ch;
        }

        var	start = {line: cursor.line, ch: token.start},
            end = {line: cursor.line, ch: token.end};

        // add a curly bracket if it's after a begin or and (insert_curly == true) and if the first char which should be changed is a {
        hint = (insert_curly && token.string.charAt(0) === '{') ? '{' + hint : hint;
        hint = insert_curly ? hint + '}' : hint;
        this.editor.document.replaceRange(hint, start, end);

        this.editor.setCursorPos({line: cursor.line, ch: this.editor.getCursorPos().ch});
        return false;
    };

    module.exports = LatexKeyWordHint;
});

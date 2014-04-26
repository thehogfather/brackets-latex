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
        value_props          = JSON.parse(LatexKeywords).values,
        begin_props          = JSON.parse(LatexKeywords).begin;
    
	var insert_curly = false;
    function LatexKeyWordHint() { }
    
    // reverse a string
    function reverse_str(s) {
        return s.split("").reverse().join("");
    }
    
    LatexKeyWordHint.prototype.hasHints = function (editor, implicitChar) {
        //the editor should have hints for all latex keywords (triggered by a \)
        this.editor = editor;
		if (!implicitChar) { return false; }
		if (implicitChar === "\\" || implicitChar === "{") {
			return true;
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
		
		
		var pos_curly = reversed_text.indexOf("{"), start_char;
		if (pos_curly >= 0 && pos_curly < reversed_text.indexOf("\\")) {
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
			if (reversed_text.substr(0,2) != '\\\\') {
				insert_curly = false;
				hints = value_props.filter(function (d) {
					if (i === max_hints) { return false; }
					if (d.indexOf(q) === 0) {
						i++;
						return true;
					}
					return false;
				});
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
    
    LatexKeyWordHint.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            token = this.editor._codeMirror.getTokenAt(cursor),
            start = {line: cursor.line, ch: token.start},
            end = {line: cursor.line, ch: token.end};
		
		// add a curly bracket if it's after a begin or and (insert_curly == true) and if the first char which should be changed is a {
		hint = (insert_curly && token.string.charAt(0) === '{') ? '{' + hint : hint;
		hint = insert_curly ? hint + '}' : hint;
        this.editor.document.replaceRange(hint, start, end);
        
        this.editor.setCursorPos({line: cursor.line, ch: this.editor.getCursorPos().ch + 1});
        return false;
    };
    
	
	
    module.exports = LatexKeyWordHint;
});

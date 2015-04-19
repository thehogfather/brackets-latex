/**
 *
 * @author Patrick Oladimeji
 * @date 5/11/14 11:32:27 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    function getContextTokens(editor) {
        var cursor = editor.getCursorPos();
        var cm = editor._codeMirror;
        var labelToken = cm.getTokenAt({line: cursor.line, ch: cursor.ch});
        var bracketToken = cm.getTokenAt({line: cursor.line, ch: labelToken.start});
        var keyWordToken = cm.getTokenAt({line: cursor.line, ch: bracketToken.start});

        if (labelToken.string === "{") {
            keyWordToken = bracketToken;
            bracketToken = labelToken;
        }
        return {labelToken: labelToken, bracketToken: bracketToken, keyWordToken: keyWordToken};
    }

    module.exports = {
        getContextTokens: getContextTokens
    };
});

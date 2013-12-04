/**
 * Console panel for output messages from compilation process
 * @author Patrick Oladimeji
 * @date 12/2/13 21:44:03 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Mustache */
define(function (require, exports, module) {
    "use strict";
    var PanelManager                    = brackets.getModule("view/PanelManager"),
        panelTemplate                   = require("text!htmlTemplates/latex-console.html"),
        Strings                         = require("i18n!nls/strings");
    var consolePanel;
    
    function clearConsole() {
        $("pre#console", consolePanel.$panel).html("");
    }
    
    function appendMessage(msg) {
        showConsolePanel();
        $("pre#console", consolePanel.$panel).append(msg);
        var scrollHeight = $("pre#console", consolePanel.$panel).prop("scrollHeight");
        $("pre#console", consolePanel.$panel).scrollTop(scrollHeight);
    }
    
    function hideConsolePanel() {
        if (consolePanel) { consolePanel.setVisible(false); }
    }
    
    function showConsolePanel() {
        if (!consolePanel) {
            var panelHtml = Mustache.render(panelTemplate, Strings);
            consolePanel = PanelManager.createBottomPanel("latex-console", $(panelHtml), 100);
            consolePanel.$panel
                .on("click", ".close", hideConsolePanel)
                .on("click", "button.clear-console", clearConsole);
        }
        consolePanel.setVisible(true);
    }
    
    function toggle() {
        if (!consolePanel || !consolePanel.isVisible()) {
            showConsolePanel();
        } else {
            hideConsolePanel();
        }
    }
    
    exports.show = showConsolePanel;
    exports.hide = hideConsolePanel;
    exports.appendMessage = appendMessage;
    exports.toggle  = toggle;
});

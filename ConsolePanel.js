/**
 * Console panel for output messages from compilation process
 * @author Patrick Oladimeji
 * @date 12/2/13 21:44:03 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Mustache, setTimeout */
define(function (require, exports, module) {
    "use strict";
    var PanelManager                    = brackets.getModule("view/PanelManager"),
        panelTemplate                   = require("text!htmlTemplates/latex-console.html"),
        Strings                         = require("i18n!nls/strings"),
        Main                            = require("main");
    var consolePanel;
    
    function clearConsole() {
        $("pre#console", consolePanel.$panel).html("");
    }
    
    function compile() {
        Main.compile();
    }
    
    function bibtex() {
        Main.bibtex();
    }
    
    function showSettings() { Main.showSettings(); }
    
    function hideConsolePanel() {
        if (consolePanel) { consolePanel.setVisible(false); }
    }
    
    function compilerChanged(preferences) {
        return function () {
            preferences.setValue("compiler", $("div#latex-console #settings-compiler").val());
        };
    }
    
    function showConsolePanel(preferences) {
        if (!consolePanel) {
            var panelHtml = Mustache.render(panelTemplate, Strings);
            consolePanel = PanelManager.createBottomPanel("latex-console", $(panelHtml), 100);
            $("#settings-compiler #option-" + preferences.compiler).prop("selected", true);

            consolePanel.$panel
                .on("click", ".close", hideConsolePanel)
                .on("click", "button.compile", compile)
                .on("click", "button.bibtex", bibtex)
                .on("click", "button.tex-settings", showSettings)
                .on("click", "button.clear-console", clearConsole)
                .on("change", "select", compilerChanged(preferences));
        }
        consolePanel.setVisible(true);
    }
    
    function appendMessage(msg) {
        showConsolePanel();
        $("pre#console", consolePanel.$panel).append(msg);
        var scrollHeight = $("pre#console", consolePanel.$panel).prop("scrollHeight");
        $(".table-container", consolePanel.$panel).scrollTop(scrollHeight);
    }
        
    function toggle(prefs) {
        if (!consolePanel || !consolePanel.isVisible()) {
            showConsolePanel(prefs);
        } else {
            hideConsolePanel();
        }
    }
    
    exports.show = function (pref) {
        showConsolePanel(pref);
        return this;
    };
    exports.hide = function () {
        hideConsolePanel();
        return this;
    };
    
    exports.appendMessage = function (msg) {
        appendMessage(msg);
        return this;
    };
    
    exports.toggle  = function (prefs) {
        toggle(prefs);
        return this;
    };
    
    exports.clear = function () {
        clearConsole();
        return this;
    };
    exports.isVisible = function () {
        return consolePanel && consolePanel.isVisible();
    };
});

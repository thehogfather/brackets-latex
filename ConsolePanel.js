/**
 * Console panel for output messages from compilation process
 * @author Patrick Oladimeji
 * @date 12/2/13 21:44:03 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache*/
define(function (require, exports, module) {
    "use strict";
    var PanelManager                    = brackets.getModule("view/PanelManager"),
        panelTemplate                   = require("text!htmlTemplates/latex-console.html"),
        Strings                         = require("i18n!nls/strings"),
        Main                            = require("main"),
        preferences                     = require("Preferences");
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

    function compilerChanged() {
        preferences.set("compiler", $("div#latex-console #settings-compiler").val());
    }

    function updateCompiler() {
        $("#settings-compiler #option-" + preferences.get("compiler")).prop("selected", true);
    }

    function showConsolePanel() {
        if (!consolePanel) {
            var panelHtml = Mustache.render(panelTemplate, Strings);
            consolePanel = PanelManager.createBottomPanel("latex-console", $(panelHtml), 100);

            consolePanel.$panel
                .on("click", ".close", hideConsolePanel)
                .on("click", "button.compile", compile)
                .on("click", "button.bibtex", bibtex)
                .on("click", "button.tex-settings", showSettings)
                .on("click", "button.clear-console", clearConsole)
                .on("change", "select", compilerChanged);
        }
        updateCompiler();
        consolePanel.setVisible(true);
    }

    function appendMessage(msg) {
        showConsolePanel();
        $("pre#console", consolePanel.$panel).append("\n" + msg);
        var scrollHeight = $("pre#console", consolePanel.$panel).prop("scrollHeight");
        $(".table-container", consolePanel.$panel).scrollTop(scrollHeight);
    }

    function toggle() {
        if (!consolePanel || !consolePanel.isVisible()) {
            showConsolePanel();
        } else {
            hideConsolePanel();
        }
    }

    //register change handler for preferences so that the compiler value is updated on the console panel if the preference is changed
    preferences.prefsObject.on("change", function (e, data) {
        updateCompiler();
    });

    //exported apis
    exports.show = function () {
        showConsolePanel();
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

    exports.toggle  = function () {
        toggle();
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

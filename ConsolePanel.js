/**
 * Console panel for output messages from compilation process
 * @author Patrick Oladimeji
 * @date 12/2/13 21:44:03 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets*/
define(function (require, exports, module) {
    "use strict";
    var WorkspaceManager                = brackets.getModule("view/WorkspaceManager"),
        panelTemplate                   = require("text!htmlTemplates/latex-console.html"),
        ProjectManager                  = brackets.getModule("project/ProjectManager"),
        EditorManager                   = brackets.getModule("editor/EditorManager"),
        Strings                         = require("i18n!nls/strings"),
        Main                            = require("main"),
        FileUtils                       = brackets.getModule("file/FileUtils"),
        Mustache                        = brackets.getModule("thirdparty/mustache/mustache"),
        preferences                     = require("Preferences");
    var consolePanel;

    function saveConsoleVisibilityState(visible) {
        var editor = EditorManager.getActiveEditor() || EditorManager.getCurrentFullEditor(),
            path;
        if (editor) {
            path = editor.document.file.fullPath;
            var state = preferences.getConsoleVisibilityMap() || {};
            state[path] = visible;
            preferences.setConsoleVisibilityMap(state);
        }
    }
    
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
        if (consolePanel) { 
            consolePanel.setVisible(false);
            saveConsoleVisibilityState(false);
        }
    }

    function compilerChanged() {
        preferences.set("compiler", $("div#latex-console #settings-compiler").val());
    }

    function mainFileChanged() {
        preferences.set("mainFile", $("#main-file").val());
    }

    function updateCompiler() {
        $("#settings-compiler #option-" + preferences.get("compiler")).prop("selected", true);
    }

    function updateMainFile() {
        $("#main-file").val(preferences.get("mainFile"));
    }

    function initialise() {
         if (consolePanel) {
            consolePanel.$panel.remove();
        }
        var projectRoot = ProjectManager.getProjectRoot().fullPath;
        ProjectManager.getAllFiles().then(function (res) {
            var files = res.map(function (d) {
                return d.fullPath.substring(projectRoot.length);
            }).filter(function (f) {
                return FileUtils.getFileExtension(f) === "tex";
            });
            var panelHtml = Mustache.render(panelTemplate, {strings: Strings, files: files});
            consolePanel = WorkspaceManager.createBottomPanel("latex-console", $(panelHtml), 100);

            consolePanel.$panel
                .on("click", ".close", hideConsolePanel)
                .on("click", "button.compile", compile)
                .on("click", "button.bibtex", bibtex)
                .on("click", "button.tex-settings", showSettings)
                .on("click", "button.clear-console", clearConsole)
                .on("change", "select#settings-compiler", compilerChanged)
                .on("change", "select#main-file", mainFileChanged);
        }, function (err) {
            console.log(err);
        });
        updateCompiler();
        updateMainFile();
    }

    function showConsolePanel() {
        consolePanel.setVisible(true);
        updateCompiler();
        updateMainFile();
        saveConsoleVisibilityState(true);
    }

    function appendMessage(msg) {
        if (!consolePanel) {
            showConsolePanel();
        }
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
        updateMainFile();
    });

    //exported apis
    exports.initialise = function () {
        initialise();
        return this;
    };

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

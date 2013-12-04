/**
 * Latex extension for brackets
 * @author Patrick Oladimeji
 * @date 11/29/13 9:20:10 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, CodeMirror */
define(function (require, exports, module) {
    "use strict";
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        DefaultSettings     = require("DefaultSettings"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menu                = brackets.getModule("command/Menus"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        SettingsDialog      = require("SettingsDialog"),
        ConsolePanel        = require("ConsolePanel"),
        preferences         = PreferencesManager.getPreferenceStorage(module, DefaultSettings);
    
    var nodeCon,
        latexIcon,
        domainId = "brackets.latex",
        COMPILE_LATEX = "latex.compile",
        LATEX_SETTINGS = "brackets-latex.settings";
    
    ExtensionUtils.loadStyleSheet(module, "less/brackets-latex.less");
    
    function errorFunc() {
        console.log("something bad happened");
    }
    
    function compile() {
        var editor = EditorManager.getCurrentFullEditor();
    
        var options = preferences.getAllValues();
        options.projectRoot = ProjectManager.getProjectRoot().fullPath;
        options.fileName = editor.document.file.name;
        
        var compileMessage = "Please wait ... Compiling " + options.fileName;
        ConsolePanel.appendMessage(compileMessage);
        ConsolePanel.show();
        
        nodeCon.domains[domainId].compile(options)
            .done(function (res) {
                latexIcon.addClass("on").removeClass("error");
                console.log(res);
                ConsolePanel.show();
                ConsolePanel.appendMessage(res.stdout.toString());
            }).fail(function (err) {
                latexIcon.addClass("error").removeClass("on");
                console.log(err);
                ConsolePanel.show();
                ConsolePanel.appendMessage(err.stdout.toString());
            });
    }
    
    function showSettingsDialog() {
        SettingsDialog.show(preferences);
    }
    
    function init() {
        latexIcon = $("<a id='latex-toolbar-icon' href='#'></a>").appendTo($("#main-toolbar .buttons")).addClass("disabled");
        latexIcon.on("click", function () {
            ConsolePanel.toggle();
        });
        
        LanguageManager.defineLanguage("latex", {
            name: "Latex",
            mode: "stex",
            fileExtensions: ["tex", "bib"],
            lineComment: ["%"]
        });
        
        $(EditorManager).on("activeEditorChange", function (event, current, previous) {
            if (current) {
                var path = current.document.file.fullPath;
                var ext = path.split(".").slice(-1).join("");
                if (ext === "tex") {
                    var cm = current._codeMirror;
                    var mode = cm.getMode({tabSize: 4}, "stex");
                    cm.setOption("mode", mode);
                    latexIcon.addClass("on").removeClass("disabled");
                } else {
                    ConsolePanel.hide();
                    latexIcon.addClass("disabled").removeClass("on");
                }
            }
        });
        
        nodeCon = new NodeConnection();
        nodeCon.connect(true)
            .done(function () {
                nodeCon.loadDomains([ExtensionUtils.getModulePath(module, "node/CompileLatex")], true);
            })
            .fail(errorFunc);
        
        CommandManager.register("Compile Latex", COMPILE_LATEX, compile);
        CommandManager.register("Latex Settings ...", LATEX_SETTINGS, showSettingsDialog);
        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(COMPILE_LATEX);
        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(LATEX_SETTINGS);
    }
    
    AppInit.appReady(init);
});

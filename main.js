/**
 * Latex extension for brackets
 * @author Patrick Oladimeji
 * @date 11/29/13 9:20:10 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window,  PathUtils */
define(function (require, exports, module) {
    "use strict";
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        DefaultSettings     = require("DefaultSettings"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menu                = brackets.getModule("command/Menus"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        SettingsDialog      = require("SettingsDialog"),
        ConsolePanel        = require("ConsolePanel"),
        LatexKeywordHint    = require("codeHints/LatexKeywordHint"),
        LatexLabelHint      = require("codeHints/LatexLabelHint"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        preferences         = require("Preferences");
    
    var nodeCon,
        latexIcon,
        domainId = "brackets.latex",
        COMPILE_LATEX = "latex.compile",
        COMPILE_BIBTEX = "bibtex.compile",
        LATEX_SETTINGS = "brackets-latex.settings",
        texRelateFiledExtensions = ["sty", "tex", "bib", "cls", "bbl"],
        consoleStatus = {};
    
    ExtensionUtils.loadStyleSheet(module, "less/brackets-latex.less");
    
    function errorFunc() {
        console.log("something bad happened");
    }
    
    function bibtex(options) {
        if (!options) {
            var editor = EditorManager.getCurrentFullEditor();
            options = preferences.getAllValues();
            options.projectRoot = ProjectManager.getProjectRoot().fullPath;
            options.fileName = editor.document.file.fullPath;
        }
        
        var compileMessage = "Please wait ... Compiling " + options.fileName + " using bibtex\n";
        ConsolePanel.clear()
            .appendMessage(compileMessage);
        
        nodeCon.domains[domainId].bibtex(options)
            .done(function (res) {
                latexIcon.addClass("on").removeClass("error");
                console.log(res);
                ConsolePanel.appendMessage(res.stdout.toString());
            }).fail(function (err) {
                latexIcon.addClass("error").removeClass("on");
                console.log(err);
                ConsolePanel.appendMessage("\n")
                    .appendMessage(err.stdout.toString());
            });
    }
    
    function compile() {
        var editor = EditorManager.getCurrentFullEditor();
    
        var options = preferences.getAllValues();
        options.projectRoot = ProjectManager.getProjectRoot().fullPath;
        options.fileName = editor.document.file.fullPath;
            
        if (options.compiler === "bibtex") {
            bibtex(options);
        } else {
            var compileMessage = "Please wait ... Compiling " + options.fileName + " using " + options.compiler + "\n";
            ConsolePanel.clear()
                .appendMessage(compileMessage);
            
            nodeCon.domains[domainId].compile(options)
                .done(function (res) {
                    latexIcon.addClass("on").removeClass("error");
                    console.log(res);
                    ConsolePanel.appendMessage(res.stdout.toString());
                }).fail(function (err) {
                    latexIcon.addClass("error").removeClass("on");
                    console.log(err);
                    ConsolePanel.appendMessage("\n")
                        .appendMessage(err.stdout.toString());
                });
        }
    }
    
    function showSettingsDialog() {
        SettingsDialog.show();
    }
    
    function activeFileIsTexRelated() {
        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var ext = FileUtils.getFileExtension(editor.document.file.fullPath);
            return texRelateFiledExtensions.indexOf(ext) > -1;
        }
    }
    
    function _currentDocChangedHandler() {
        // get programming language
        var doc = DocumentManager.getCurrentDocument(),
            ext = doc ? PathUtils.filenameExtension(doc.file.fullPath).toLowerCase().substr(1) : ""; // delete the dot
        
        // Only show Tex and the right bar, if it's a tex related file
        if (texRelateFiledExtensions.indexOf(ext) !== -1) {
            $("#latex-toolbar-icon").css('display', 'block');
        } else {
            $("#latex-toolbar-icon").css('display', 'none');
        }
    }
    
    function registerCodeHints() {
        var keywordHints = new LatexKeywordHint();
        var labelHints = new LatexLabelHint();
        CodeHintManager.registerHintProvider(keywordHints, ["latex"], 0);
        CodeHintManager.registerHintProvider(labelHints, ["latex"], 0);
    }
    
    function init() {
             
        latexIcon = $("<a id='latex-toolbar-icon' href='#'></a>").appendTo($("#main-toolbar .buttons")).addClass("disabled");
        
        latexIcon.on("click", function () {
            //toggle panel if the document type is tex related
            if (activeFileIsTexRelated()) {
                ConsolePanel.toggle();
            }
        });
        
        LanguageManager.defineLanguage("latex", {
            name: "Latex",
            mode: "stex",
            fileExtensions: ["tex", "bib", "cls"],
            lineComment: ["%"]
        });
        
        $(EditorManager).on("activeEditorChange", function (event, current, previous) {
            if (previous) {
                consoleStatus[previous.document.file.fullPath] = ConsolePanel.isVisible();
            }
            if (current) {
                if (activeFileIsTexRelated()) {
                    var cm = current._codeMirror;
                    var mode = cm.getMode({tabSize: 4}, "stex");
                    cm.setOption("mode", mode);
                    latexIcon.addClass("on").removeClass("disabled");
                    if (consoleStatus[current.document.file.fullPath] === false) {
                        ConsolePanel.hide();
                    } else {
                        ConsolePanel.show();
                    }
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
        
//        CommandManager.register("Compile Latex", COMPILE_LATEX, compile);
//        CommandManager.register("Compile Bibtex", COMPILE_BIBTEX, bibtex);
        CommandManager.register("Latex Settings ...", LATEX_SETTINGS, showSettingsDialog);
//        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(COMPILE_LATEX);
//        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(COMPILE_BIBTEX);
        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(LATEX_SETTINGS);
    }
    
    exports.compile = compile;
    exports.bibtex = bibtex;
    exports.showSettings = showSettingsDialog;
    
    // Add a document change handler
    $(DocumentManager).on("currentDocumentChange", _currentDocChangedHandler);
    
    AppInit.appReady(function () {
        init();
        _currentDocChangedHandler();
        registerCodeHints();
    });
    
});

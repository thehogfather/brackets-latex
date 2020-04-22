/**
 * Latex extension for brackets
 * @author Patrick Oladimeji
 * @date 11/29/13 9:20:10 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets*/
define(function (require, exports, module) {
    "use strict";
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menu                = brackets.getModule("command/Menus"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        NodeDomain          = brackets.getModule("utils/NodeDomain"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        SettingsDialog      = require("SettingsDialog"),
        ConsolePanel        = require("ConsolePanel"),
        LatexKeywordHint    = require("codeHints/LatexKeywordHint"),
        LatexCiteKeyHint	= require("codeHints/LatexCiteKeyHint"),
        LatexLabelHint      = require("codeHints/LatexLabelHint"),
        LatexDocumentParser = require("codeHints/LatexDocumentParser"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        latexFold           = require("foldhelpers/latex-fold"),
        preferences         = require("Preferences"),
        PathUtils           = brackets.getModule("thirdparty/path-utils/path-utils"),
        MainViewManager     = brackets.getModule("view/MainViewManager"),
        CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

     var latexDomain,
        latexIcon,
        domainId = "bracketsLatex",
        COMPILE = "compile",
        LATEX_SETTINGS = "brackets-latex.settings",
        texRelateFiledExtensions = ["sty", "tex", "bib", "cls", "bbl"],
        Strings = require("i18n!nls/strings"),
        TEX_ROOT = "%!TEX root=";

    ExtensionUtils.loadStyleSheet(module, "less/brackets-latex.less");

    function bibtex(options) {
        if (!options) {
            var editor = EditorManager.getCurrentFullEditor();
            options = preferences.getAllValues();
            options.projectRoot = ProjectManager.getProjectRoot().fullPath;
            options.fileName = preferences.get("mainFile") ? options.projectRoot + preferences.get("mainFile") :
                    editor.document.file.fullPath;
            options.compiler = "bibtex";
        }

        var compileMessage = options.compiler + ": " + Strings.COMPILING + " " + options.fileName +  "\n";
        ConsolePanel.clear()
            .appendMessage(compileMessage);

        latexDomain.exec("bibtex", options)
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

    function getTEXRoot(editor) {
        var firstLine = editor._codeMirror.getLine(0);
        if (firstLine.trim().indexOf(TEX_ROOT) === 0) {
            var rootPath = firstLine.split("=")[1];
            return rootPath.trim();
        }
        return null;
    }

    function showSettingsDialog() {
        SettingsDialog.show();
    }

    function getMainFileDocument(path) {
        return DocumentManager.getDocumentForPath(path);
    }

    function compile() {
        var editor = EditorManager.getCurrentFullEditor();
        var texRoot = getTEXRoot(editor);
        var options = preferences.getAllValues();
        options.projectRoot = ProjectManager.getProjectRoot().fullPath;
        options.fileName = preferences.get("mainFile") ? options.projectRoot + preferences.get("mainFile") :
                editor.document.file.fullPath;
        //set bibfile name if the main file contains a \bibliography entry
        getMainFileDocument(options.fileName)
            .then(function (doc) {
                options.bibFileName = LatexDocumentParser.getBibFileName(doc.getText());
            }, function (err) {
                console.log(err);
            }).then(function () {
                if (texRoot) {
                    options.texRoot = texRoot;
                }

                if (options.texBinDirectory.trim() === "") { //ensure the tex bin directory is set
                    showSettingsDialog();
                    ConsolePanel.clear().appendMessage(Strings.TEX_BIN_DIR_ERROR);
                } else if (options.compiler === "bibtex") {
                    bibtex(options);
                    return;
                } else {
                    var compileMessage = options.compiler + ": " + Strings.COMPILING + " " + options.fileName +  "\n";
                    ConsolePanel.clear()
                        .appendMessage(compileMessage);

                    latexDomain.exec("compile", options)
                        .done(function (res) {
                            latexIcon.addClass("on").removeClass("error");
                            console.log(res);
                            ConsolePanel.appendMessage(res.stdout.toString());
                        }).fail(function (err) {
                            latexIcon.addClass("error").removeClass("on");
                            console.log(err);
                            ConsolePanel.appendMessage("\n")
                                .appendMessage(err.stdout.toString())
                                .appendMessage(err.stderr.toString())
                                .appendMessage(err.err ? JSON.stringify(err.err, null, " ") : "");
                        });
                }
            });

    }

    function activeFileIsTexRelated() {
        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var ext = FileUtils.getFileExtension(editor.document.file.fullPath);
            return texRelateFiledExtensions.indexOf(ext) > -1;
        }
    }

    function _currentDocChangedHandler(event, file) {
        // get programming language
        var ext = file ? PathUtils.filenameExtension(file.fullPath).toLowerCase().substr(1) : ""; // delete the dot

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
        var citeKeyHints = new LatexCiteKeyHint();
        CodeHintManager.registerHintProvider(keywordHints, ["latex"], 0);
        CodeHintManager.registerHintProvider(labelHints, ["latex"], 1);
        CodeHintManager.registerHintProvider(citeKeyHints, ["latex"], 2);
    }

    function init() {
        ConsolePanel.initialise();

        latexIcon = $("<a id='latex-toolbar-icon' href='#'></a>").appendTo($("#main-toolbar .buttons")).addClass("disabled");

        latexIcon.on("click", function () {
            //toggle panel if the document type is tex related
            if (activeFileIsTexRelated()) {
                ConsolePanel.toggle();
            }
        });

        LanguageManager.defineLanguage("latex", {
            name: "LaTeX",
            mode: ["stex", "text/x-stex"],
            fileExtensions: ["tex", "bib", "cls", "ltx", "clo", "sty", "def"],
            lineComment: ["%"]
        });

        CodeMirror.registerHelper("fold", "stex", latexFold);
        EditorManager.on("activeEditorChange", function (event, current, previous) {
            var consoleVisibilityMap = preferences.getConsoleVisibilityMap() || {};
            if (current) {
                if (activeFileIsTexRelated()) {
                    latexIcon.addClass("on").removeClass("disabled");
                    if (consoleVisibilityMap[current.document.file.fullPath] === false) {
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

        latexDomain = new NodeDomain(domainId, ExtensionUtils.getModulePath(module, "node/CompileLatex"));

        latexDomain.on("progress", function (event, data) {
            var timeString = new Date(data.ts).toTimeString();
            ConsolePanel.appendMessage("\n[" + timeString + "]:  " + data.message);
            console.log(data);
        });
        CommandManager.register(Strings.TEX_SETTINGS + " ...", LATEX_SETTINGS, showSettingsDialog);
        CommandManager.register(Strings.COMPILE, COMPILE, compile);

        Menu.getMenu(Menu.AppMenuBar.FILE_MENU).addMenuItem(LATEX_SETTINGS);
        KeyBindingManager.addBinding(COMPILE, "Ctrl-Alt-B");
    }

    exports.compile = compile;
    exports.bibtex = bibtex;
    exports.showSettings = showSettingsDialog;

    // Add a document change handler
    MainViewManager.on("currentFileChange", _currentDocChangedHandler);

    AppInit.appReady(function () {
        init();
        _currentDocChangedHandler();
        registerCodeHints();
    });

});

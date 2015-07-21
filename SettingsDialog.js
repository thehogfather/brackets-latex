/**
 * Dialog to change default settings for latex compilation
 * @author Patrick Oladimeji
 * @date 12/2/13 8:47:22 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define,$, brackets, Mustache */
define(function (require, exports, module) {
    "use strict";
    var Dialogs         = brackets.getModule("widgets/Dialogs"),
        ProjectManager  = brackets.getModule("project/ProjectManager"),
        DefaultSettings = require("DefaultSettings"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        Strings         = require("i18n!nls/strings"),
        settingsDialogTemplate = require("text!htmlTemplates/settings-dialog.html"),
        preferences     = require("Preferences");

    function setFormValues(prefs) {
        $("#latex-settings-dialog #settings-texbin-directory").val(prefs.texBinDirectory);
        $("#latex-settings-dialog #settings-output-directory").val(prefs.outputDirectory);
        $("#latex-settings-dialog #settings-compiler #option-" + prefs.compiler).prop("selected", true);
        $("#latex-settings-dialog #main-file" ).val(prefs.mainFile);
    }


    function restoreDefaults() {
        setFormValues(DefaultSettings);
    }

    function bindListeners() {
        $("button[data-button-id='defaults']").on("click", function (e) {
            e.stopPropagation();
            restoreDefaults();
        });
    }

    function showDialog() {
        var projectRoot = ProjectManager.getProjectRoot().fullPath;
        ProjectManager.getAllFiles().then(function (res) {
            var files = res.map(function (d) {
                return d.fullPath.substring(projectRoot.length);
            }).filter(function (f) {
                return FileUtils.getFileExtension(f) === "tex";
            });
            var template = Mustache.render(settingsDialogTemplate, {strings: Strings, files: files});
            var dialog = Dialogs.showModalDialogUsingTemplate(template);
            setFormValues(preferences.getAllValues());

            dialog.done(function (buttonId) {
                if (buttonId === "ok") {
                    var $dialog = dialog.getElement();
                    preferences.set("texBinDirectory", $("#settings-texbin-directory", $dialog).val());
                    preferences.set("outputDirectory", $("#settings-output-directory", $dialog).val());
                    preferences.set("compiler", $("#settings-compiler", $dialog).val());
                    preferences.set("mainFile", $("#main-file", $dialog).val());
                }
            });
        });

    }

    bindListeners();
    exports.show = showDialog;
});

/**
 * Dialog to change default settings for latex compilation
 * @author Patrick Oladimeji
 * @date 12/2/13 8:47:22 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Mustache */
define(function (require, exports, module) {
    "use strict";
    var Dialogs         = brackets.getModule("widgets/Dialogs"),
        DefaultSettings = require("DefaultSettings"),
        Strings         = require("i18n!nls/strings"),
        settingsDialogTemplate = require("text!htmlTemplates/settings-dialog.html");
    
    function setFormValues(prefs) {
        $("#settings-texbin-directory").val(prefs.texBinDirectory);
        $("#settings-output-directory").val(prefs.outputDirectory);
        $("#settings-draftmode").prop("checked", prefs.draftMode);
        $("#settings-output-format #option-" + prefs.outputFormat).prop("selected", true);
        if (prefs.outputViewer !== undefined) {
            $("#settings-output-viewer").val(prefs.outputViewer);
        }
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
    
    function showDialog(prefs) {
        var template = Mustache.render(settingsDialogTemplate, Strings);
        var dialog = Dialogs.showModalDialogUsingTemplate(template);
        
        if (brackets.platform === "win") {
            $("#windows-settings", dialog.getElement()).addClass("hide-setting");
        }
        setFormValues(prefs.getAllValues());
        
        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                var $dialog = dialog.getElement();
                prefs.setValue("texBinDirectory", $("#settings-texbin-directory", $dialog).val());
                prefs.setValue("outputDirectory", $("#settings-output-directory", $dialog).val());
                prefs.setValue("draftMode", $("#settings-draftmode", $dialog).prop("checked"));
                prefs.setValue("outputFormat", $("#settings-output-format", $dialog).val());
                prefs.setValue("outputViewer", $("#settings-output-viewer", $dialog).val());
            }
        });
    }
    
    exports.show = showDialog;
});

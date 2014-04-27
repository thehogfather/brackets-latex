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
        settingsDialogTemplate = require("text!htmlTemplates/settings-dialog.html"),
        preferences     = require("Preferences");
    
    function setFormValues(prefs) {
        $("#settings-texbin-directory").val(prefs.texBinDirectory);
        $("#settings-output-directory").val(prefs.outputDirectory);
//        $("#settings-draftmode").prop("checked", prefs.draftMode);
        $("#settings-compiler #option-" + prefs.compiler).prop("selected", true);
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
        var template = Mustache.render(settingsDialogTemplate, Strings);
        var dialog = Dialogs.showModalDialogUsingTemplate(template);
        setFormValues(preferences.getAllValues());
        
        dialog.done(function (buttonId) {
            if (buttonId === "ok") {
                var $dialog = dialog.getElement();
                preferences.set("texBinDirectory", $("#settings-texbin-directory", $dialog).val());
                preferences.set("outputDirectory", $("#settings-output-directory", $dialog).val());
//                prefs.setValue("draftMode", $("#settings-draftmode", $dialog).prop("checked"));
                preferences.set("compiler", $("#settings-compiler", $dialog).val());
            }
        });
    }
    
    bindListeners();
    exports.show = showDialog;
});

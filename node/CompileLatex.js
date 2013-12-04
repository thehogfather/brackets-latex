/**
 * 
 * @author Patrick Oladimeji
 * @date 11/30/13 23:00:20 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global define, d3, require, $, window, process */
(function () {
    "use strict";
    var cp = require("child_process"),
        exec = cp.exec,
        spawn = cp.spawn,
        fs = require("fs");
    var domainId = "brackets.latex";
    
    var execNames = {pdf: "pdflatex", ps: "pslatex", dvi: "latex"};
    var osOpenCommand = {win: "start ", mac: "open ", linux: "xdg-open "};
    
    function endWithSlash(dir) {
        if (dir.substr(-1) !== "/") { return dir.concat("/"); }
        return dir;
    }
    
    function compileFile(options, cb) {
        //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var projectFolder = options.projectRoot,
            fileName = options.fileName,
            prog = options.texBinDirectory + "/" + execNames[options.outputFormat],
            draftMode = options.draftMode ? "-draftmode " : "",
            outputDirectory = " -output-directory=" + endWithSlash(options.projectRoot) + options.outputDirectory;
        var dir = endWithSlash(options.projectRoot) + options.outputDirectory;
        
        fs.stat(dir, function (err, stats) {
            if (err && err.code === "ENOENT") { fs.mkdirSync(dir); }
            }
            var command = prog + " -halt-on-error -file-line-error " + draftMode + outputDirectory + " " + fileName,
                execOptions = {cwd: projectFolder, timeout: options.timeout};
            
            exec(command, execOptions, function (err, stdout, stderr) {
                if (err) {
                    cb({err: err, stdout: stdout});
                } else {
                    cb(null, {stdout: stdout.toString(), stderr: stderr.toString()});
                    //try to open the generated file
                    exec(osOpenCommand[options.platform] +
                         " " + dir + "/" + fileName.substring(0, fileName.lastIndexOf(".")) + "." + options.outputFormat);
                }
            });
        });
    }
    
    function init(DomainManager) {
        if (!DomainManager.hasDomain(domainId)) {
            DomainManager.registerDomain(domainId, {major: 0, minor: 1});
        }
        
        DomainManager.registerCommand(
            domainId,
            "compile",
            compileFile,
            true,
            "Compiles the given latex file and returns the stdout and std err in an object in the callback parameter",
            [{name: "options", type: "object", description: "key/value pair containing properties for fileName, texBinDirectory, draftMode, outputFormat,projectRoot, outputDirectory"}]
        );
    }
    
    exports.init = init;
}());
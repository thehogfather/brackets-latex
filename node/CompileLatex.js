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
        fs = require("fs"),
        path = require("path");
    var domainId = "brackets.latex", quotes = '"';
    
    var execNames = {pdf: "pdflatex", ps: "pslatex", dvi: "latex"};
    var osOpenCommand = {win: "start ", mac: "open ", linux: "xdg-open "};
    
    function quote(str) { return '"' + str + '"'; }
    
    function compileFile(options, cb) {
        //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var dir = path.join(options.projectRoot, options.outputDirectory);
        var projectFolder = path.normalize(options.projectRoot),
            fileName = path.normalize(options.fileName),
            prog = path.join(options.texBinDirectory, execNames[options.outputFormat]),
            draftMode = options.draftMode ? "-draftmode " : "",
            outputDirectory = " -output-directory=" + quote(dir);
        
        fs.stat(dir, function (err, stats) {
            if (err && err.code === "ENOENT") { fs.mkdirSync(dir); }
            var command = quote(prog) + " -halt-on-error -file-line-error " + draftMode
                + outputDirectory + " " + quote(fileName),
                execOptions = {cwd: projectFolder, timeout: options.timeout};
            
            exec(command, execOptions, function (err, stdout, stderr) {
                if (err) {
                    cb({err: err, stdout: stdout, command: command, execOptions: execOptions});
                } else {
                    cb(null, {stdout: stdout.toString(), stderr: stderr.toString()});
                    //try to open the generated file
                    var compiledFile = path.join(dir, path.basename(fileName, path.extname(fileName))
                                                 + "." + options.outputFormat);
                    var outputViewer = options.platform === "win" ? quote(options.outputViewer).concat(" ") : "";
                    exec(osOpenCommand[options.platform] + " " + outputViewer + quote(compiledFile));
                }
            });
        });
    }
    
    function bibtex(options, cb) {
         //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var dir = path.join(options.projectRoot, options.outputDirectory);
        var projectFolder = path.normalize(options.projectRoot),
            fileName = path.normalize(options.fileName),
            prog = path.join(options.texBinDirectory, "bibtex");
        var fileNameNoExt = path.basename(fileName, path.extname(fileName));
        var bibFileArg = path.join(options.outputDirectory, fileNameNoExt);

        fs.stat(dir, function (err, stats) {
            if (err && err.code === "ENOENT") { fs.mkdirSync(dir); }
            var command = quote(prog) + " " + quote(bibFileArg),
                execOptions = {cwd: projectFolder, timeout: options.timeout};
            
            exec(command, execOptions, function (err, stdout, stderr) {
                if (err) {
                    cb({err: err, stdout: stdout, command: command, execOptions: execOptions});
                } else {
                    cb(null, {stdout: stdout.toString(), stderr: stderr.toString()});
                }
            });
        });
    }
    
    function init(DomainManager) {
        if (!DomainManager.hasDomain(domainId)) {
            DomainManager.registerDomain(domainId, {major: 0, minor: 1});
        }
        //register the compile command
        DomainManager.registerCommand(
            domainId,
            "compile",
            compileFile,
            true,
            "Compiles the given latex file and returns the stdout and std err in an object in the callback parameter",
            [
                {
                    name: "options",
                    type: "object",
                    description: "key/value pair containing properties for fileName, texBinDirectory, draftMode, outputFormat, projectRoot, outputDirectory"
                }
            ]
        );
        //register bibtex command
        DomainManager.registerCommand(
            domainId,
            "bibtex",
            bibtex,
            true,
            "Compiles the bibtex file from the generated .aux file if any",
            [
                {
                    name: "options",
                    type: "object",
                    description: "key/value pair containing properties for fileName, texBinDirectory, draftMode, outputFormat, projectRoot, outputDirectory"
                }
            ]
        );
    }
    
    exports.init = init;
}());
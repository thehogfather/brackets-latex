/**
 *
 * @author Patrick Oladimeji
 * @date 11/30/13 23:00:20 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global*/
(function () {
    "use strict";
    var cp = require("child_process"),
        exec = cp.exec,
        fs = require("fs"),
        path = require("path");
    var domainId = "bracketsLatex";
    var osOpenCommand = {win: "start ", mac: "open ", linux: "xdg-open "};
    var outputExtensions = {pdflatex: "pdf", xetex: "pdf", xelatex: "pdf", latex: "dvi", "lualatex": "pdf"};

    var _domainManager;

    function quote(str) { return '"' + str + '"'; }

    function log(msg, scope) {
        console.log(msg);
        _domainManager.emitEvent(domainId, "progress", [{scope: scope, message: msg, ts: Date.now()}]);
    }

    function compileFile(options, cb) {
        //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var folderName = path.dirname(options.fileName), errdata, openCommand;

        //resolve the texRoot relative to the folder containing the active file
        if (options.texRoot) {
            options.texRoot = path.resolve(folderName, options.texRoot);
            log("TeXRoot found at " + options.texRoot, options.compiler);
        }
        var dir = path.resolve(options.projectRoot, options.outputDirectory);
        var projectFolder = path.normalize(options.projectRoot),
            fileName = options.texRoot ? path.relative(projectFolder, options.texRoot) : path.relative(projectFolder, options.fileName),
            prog = path.join(options.texBinDirectory, options.compiler),
            outputDirectory = " -output-directory=" + quote(dir);

        var fileBaseName = path.basename(fileName, path.extname(fileName));

        log("output directory is " + dir, options.compiler);
        fs.stat(dir, function (err, stats) {
            if (err && err.code === "ENOENT") {
                log("output directory does not exist... will create directory at " + dir);
                fs.mkdirSync(dir);
                log("output directory created at " + dir);
            }
            var commandArgs = " -halt-on-error -file-line-error ";
            if (options.compiler === "xetex" || options.compiler === "xelatex") {
                commandArgs = commandArgs.concat(" -no-pdf ");
            }

            var command = quote(prog) + commandArgs + outputDirectory + " " + quote(path.basename(fileName)),
                execOptions = {cwd: folderName, timeout: options.timeout};


            exec("cd " + quote(folderName), null, function (err, stdout, stderr) {
                if (err) {
                    errdata = {err: err, stdout: stdout, command: command, execOptions: execOptions};
                    log("There was an error changing directory to " + folderName + "\n" + stdout.toString(), options.compiler);
                    cb(errdata);
                } else {
                    log("Changed directory to " + folderName);
                    log("executing " + command);
                    exec(command , execOptions, function (err, stdout, stderr) {
                        if (err) {
                            errdata = {err: err, stdout: stdout, command: command, execOptions: execOptions};
                            log("There was an error executing command " + command + "\n" + stdout.toString(), options.compiler);
                            cb(errdata);
                        } else {
                            //if using xetex then run xdvipdfmx on the generated file
                            if (options.compiler === "xetex" || options.compiler === "xelatex") {
                                var xetexCommand = path.join(options.texBinDirectory, "xdvipdfmx") +
                                    " -o " + quote(path.join(dir, fileBaseName + ".pdf")) + " " + path.join(dir, fileBaseName);
                                log("executing " + xetexCommand, options.compiler);
                                exec(xetexCommand, execOptions, function (err, xestdout, xestderr) {
                                    if (err) {
                                        errdata = {err: err, stdout: stdout.concat(xestdout),
                                            command: command, execOptions: execOptions, stderr: stderr.concat(xestderr)};
                                        log("There was an error executing command " + xetexCommand +
                                            "\n" + errdata.stdout.toString(), options.compiler);
                                        cb(errdata);
                                    } else {
                                        cb(null, {stdout: stdout.concat(xestdout), stderr: stderr.concat(xestderr)});
                                        //try to open the generated file
                                        var compiledFile = path.join(dir, fileBaseName + "." + outputExtensions[options.compiler]);
                                        var args = options.platform === "win" ? quote(" ").concat(" ") : "";
                                        openCommand = osOpenCommand[options.platform] + " " + args + quote(compiledFile);
                                        log("executing " + openCommand, options.compiler);
                                        exec(openCommand);
                                    }
                                });
                            } else {
                                cb(null, {stdout: stdout.toString(), stderr: stderr.toString()});
                                //try to open the generated file
                                var compiledFile = path.join(dir, fileBaseName + "." + outputExtensions[options.compiler]);
                                var args = options.platform === "win" ? quote(" ").concat(" ") : "";
                                openCommand = osOpenCommand[options.platform] + " " + args + quote(compiledFile);
                                log("executing " + openCommand, options.compiler);
                                exec(openCommand);
                            }
                        }
                    });
                }
            });

        });
    }

    function bibtex(options, cb) {
         //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var outDir = path.join(options.projectRoot, options.outputDirectory);
        var //projectFolder = path.normalize(options.projectRoot),
            fileName = options.fileName,
            folderName = path.dirname(options.fileName),
            prog = path.join(options.texBinDirectory, "bibtex");
        var fileNameNoExt = path.basename(fileName, path.extname(fileName)),
            ///FIXME use a preference option so that the user can explicitly choose
            //whether to use the same folder as the tex or a custom folder to search for the bibtex
            bibtexArg = path.join(path.relative(folderName, outDir), fileNameNoExt);
        var errdata;

        log("output directory is " + outDir, options.compiler);
        fs.stat(outDir, function (err, stats) {
            if (err && err.code === "ENOENT") {
                log("output directory does not exist... will create directory at " + outDir);
                fs.mkdirSync(outDir);
                log("output directory created at " + outDir);
            }
            var command = quote(prog) + " " + quote(bibtexArg),
                execOptions = {cwd: folderName, timeout: options.timeout};

            exec("cd " + quote(folderName), null, function (err, stdout, stderr) {
                if (err) {
                    errdata = {err: err, stdout: stdout, command: command, execOptions: execOptions};
                    log("There was an error changing directory to " + folderName +
                        "\n" + errdata.stdout.toString(), options.compiler);
                    cb(errdata);
                } else {
                    log("changed directory to " + folderName, options.compiler);
                    log("executing " + command, options.compiler);
                    exec(command, execOptions, function (err, stdout, stderr) {
                        if (err) {
                            cb({err: err, stdout: stdout, command: command, execOptions: execOptions});
                        } else {
                            cb(null, {stdout: stdout.toString(), stderr: stderr.toString()});
                        }
                    });
                }
            });
        });
    }

    function init(DomainManager) {
        _domainManager = DomainManager;
        if (!DomainManager.hasDomain(domainId)) {
            DomainManager.registerDomain(domainId, {major: 0, minor: 1});
        }
        //register events for progress of the compilation process or to notify client of any error
        DomainManager.registerEvent(domainId, "progress", [
            {name: "scope", type: "string", "description": "message scope"},
            {name: "message", type: "string", "description": "message body"},
            {name: "description", type: "string", "description": "message payload"}
        ]);
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
                    description: "key/value pair containing properties for fileName, texBinDirectory, compiler, projectRoot, outputDirectory"
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
                    description: "key/value pair containing properties for fileName, texBinDirectory, compiler, projectRoot, outputDirectory"
                }
            ]
        );
    }

    exports.init = init;
}());

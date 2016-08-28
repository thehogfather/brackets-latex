/**
 *
 * @author Patrick Oladimeji
 * @date 11/30/13 23:00:20 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
(function () {
    "use strict";
    var cp = require("child_process"),
        Promise = require("es6-promise").Promise,
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

    /**
     * Helper function to check if an dir exists. If the dir does not exist, it is created
     * @param {String}  dir The directory to check
     * @returns {Promise} A promise that resolves after the existence and/or creation of the specified folder has be completed
     */
    function ensureDirExists(dir) {
        return new Promise(function (resolve, reject) {
            fs.stat(dir, function (err, stats) {
                if (err && err.code === "ENOENT") {
                    //file does not exist so create it
                    fs.mkdir(dir, function (err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else if (err) {
                    //if there was another error other that ENOENT
                    reject(err);
                } else {
                    //file exists so resolve
                    resolve();
                }
            });
        });
    }

    /**
     * Helper function to execute an async command in the OS
     * @param   {String}  command  The command to execute
     * @param   {Object}  execOpts key value pair representing options to send to nodejs exec function
     * @returns {function} A function that when called returns a  promise that resolves with the following properties {stdout, stderr, command}
     */
    function execCommand(command, execOpts) {
        return function (res) {
            return new Promise(function (resolve, reject) {
                log("executing " + command);
                exec(command, execOpts, function (err, stdout, stderr) {
                    if (err) {
                        log("There was an error executing command " + command + "\n" + stdout.toString());
                        reject({stdout: stdout, stderr: stderr, err: err, command: command, execOptions: execOpts});
                    } else {
                        resolve({stdout: stdout, stderr: stderr, command: command});
                    }
                });
            });
        };
    }

    /**
     * Compiles file using arara - assumes that arara is installed on the system and can be found
     * in the texbin directory
     * @param {Object}   options object containing compile information passed from client. Includes
     *                           fileName, texRoot, compiler, projectRoot
     * @param {function} cb      A function to invoke when the compilation succeeds or fails
     */
    function arara(options, cb) {
        //if an output directory is set then ensure it is created before continuing
        var folderName = path.dirname(options.fileName);
        log(process.env.PATH);
        process.env.PATH = process.env.PATH.concat(":").concat(options.texBinDirectory);
        log(process.env.PATH);
        //resolve the texRoot relative to the folder containing the active file
        if (options.texRoot) {
            options.texRoot = path.resolve(folderName, options.texRoot);
            log("TeXRoot found at " + options.texRoot, options.compiler);
        }
        var cdIntoDir = "cd " + quote(folderName);

        var projectFolder = path.normalize(options.projectRoot),
            fileName = options.texRoot ? path.relative(projectFolder, options.texRoot)
                : path.relative(projectFolder, options.fileName),
            prog = options.compiler;// path.join(options.texBinDirectory, options.compiler);
        var fileBaseName = path.basename(fileName, path.extname(fileName));
        var command = quote(prog) + " " + quote(fileBaseName);

        var changeDirectory = execCommand(cdIntoDir);
        var runArara = execCommand(command, {env: process.env, cwd: folderName});
        changeDirectory()
            .then(runArara)
            .then(function  (res) {
                cb(res);
            }).catch(function (err) {
                cb(err);
            });
    }

    function compileFile(options, cb) {
        if (options.compiler === "arara") {
            return arara(options, cb);
        }
        //if an output directory is set then ensure it is created before continuing
        options.outputDirectory = options.outputDirectory || "";
        var folderName = path.dirname(options.fileName);

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
        var commandArgs = " -halt-on-error -file-line-error ";
            if (options.compiler === "xetex" || options.compiler === "xelatex") {
                commandArgs = commandArgs.concat(" -no-pdf ");
            }

        var command = quote(prog) + commandArgs + outputDirectory + " " + quote(path.basename(fileName)),
                execOptions = {cwd: folderName, timeout: options.timeout};
        var cdIntoDir = "cd " + quote(folderName);

        var bibtexProg = path.join(options.texBinDirectory, "bibtex");
        var bibtexCommand = quote(bibtexProg) + " " + quote(path.join(path.relative(folderName, dir), fileBaseName));
        var bibtexExecOptions = {cwd: folderName, timeout: options.timeout};
        var xetexCommand = path.join(options.texBinDirectory, "xdvipdfmx") +
            " -o " + quote(path.join(dir, fileBaseName + ".pdf")) + " " + path.join(dir, fileBaseName);

        var compiledFile = path.join(dir, fileBaseName + "." + outputExtensions[options.compiler]);
        var args = options.platform === "win" ? quote(" ").concat(" ") : "";
        var openCommand = osOpenCommand[options.platform] + " " + args + quote(compiledFile);

        var runBibTex = execCommand(bibtexCommand, bibtexExecOptions);
        var runXeTex = execCommand(xetexCommand, execOptions);
        ensureDirExists(dir)
            .then(execCommand(cdIntoDir))
            .then(execCommand(command, execOptions))
            .then(function () {
                //if there is a bibfile then we should compile it and invoke compiler 2x more to link
                if (options.bibFileName) {
                    return runBibTex()
                        .then(execCommand(command, execOptions))
                        .then(execCommand(command, execOptions));
                }
            })
            .then(function () {
                if (options.compiler === "xetex" || options.compiler === "xelatex") {
                    return runXeTex();
                }
            }).then(execCommand(openCommand))
            .catch(function (err) {
                cb(err);
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

        log("output directory is " + outDir, options.compiler);
        var cdIntoDir = "cd " + quote(folderName);
        var bibtexCommand = quote(prog) + " " + quote(bibtexArg),
            execOptions = {cwd: folderName, timeout: options.timeout};

        ensureDirExists(outDir)
            .then(execCommand(cdIntoDir))
            .then(execCommand(bibtexCommand, execOptions))
            .catch(function (err) {
                cb(err);
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

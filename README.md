#LaTeX typesetting for Brackets
This extension provides support for typestting documents in LaTeX within Brackets.

##Prerequisites
* A working installation of the TeX typesetting system [See here for details](http://latex-project.org/)
* Corresponding programs for viewing .pdf, .ps or .dvi files (depending on the output selected in the settings dialog).

##Features
* Enhances the brackets environment for editing and compiling LaTeX documents.
* LaTeX keyword highlighting (using the CodeMirror stex mode)
* Compilation of latex documents using latex, pdflatex, pslatex, xetex, xelatex or bibtex
* Code hints for latex keywords and document labels when typesetting documents
* Dialog for configuring where to find the TeX distribution to use for compilation
* Compile from any file in a multi-file project by including `%!TEX root=../root.tex` at the first line in every included file.

##Keyboard shortcuts
The following are the default keyboard shortcuts. If any of the shortcut keys conflict with your keyboard or you would prefer to use another shortcut key for any reason, you can [remap the keys as described here](https://github.com/adobe/brackets/wiki/User-Key-Bindings).

    Ctrl-Alt-B  compile  document
###To do
* Compile on save (setting)
* Code for bibtex reference keys

###License
MIT licensed.
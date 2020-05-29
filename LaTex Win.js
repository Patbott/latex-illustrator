var pdflatexexe="pdflatex.exe";  // Add full path if necessary

// determining the local temporary directory
var temppath=Folder.temp.fsName;  // path already in Windows syntax: c:\...
var i=temppath.indexOf("Temporary Internet Files");
if(i>=0) temppath=temppath.substr(0,i+4);
//temppath should now contain something like C:\Documents and Settings\<user>\Local Settings\Temp

var lastcode="$$"

// Check if the selected item already has latex code attached to it
var selectedItems = app.activeDocument.selection;

// check if objects are selected
if(selectedItems.length>0){
  // select first object in selection
  var selectedItem = selectedItems[0];
  var tagList =  selectedItem.tags;
  // if the object has tags, check if it has the latex code tag
  if (tagList.length>0){
    for(i=0;i<tagList.length;i++){
      if(tagList[i].name == "LatexCode"){
        // retrieve latex code of object
        tagText = tagList[i].value;
        lastcode = tagText;
        break;
      }
    }
  }
}

// prompt for user input
var latexcode=prompt("Please enter LaTeX code",lastcode,"LaTeX");
if(latexcode!=null){
  // add latex header etc. to create a complete latex document
  var latexfile=new File(temppath+'\\latex2illustrator.tex');
  latexfile.open("w");
  latexfile.writeln("\\documentclass{standalone}");
  // add or remove additional latex packages here
  latexfile.writeln("\\usepackage{amsmath}");
  latexfile.writeln("\\usepackage{amssymb}");
  latexfile.writeln("\\usepackage{gensymb}");   // for \degree
  latexfile.writeln("\\usepackage{textcomp}");  // for \textdegree
  latexfile.writeln("\\usepackage{bm}");        // bold math
  latexfile.writeln("\\begin{document}");
  latexfile.writeln("\\pagestyle{empty}"); // no page number
  latexfile.writeln(latexcode);
  latexfile.writeln("\\end{document}");
  latexfile.close();

  var pdffile=File(temppath+"\\latex2illustrator.pdf");
  if(pdffile.exists)
     pdffile.remove();

  // create a batch file calling latex
  var batchfile=new File(temppath+'\\latex2illustrator.bat');
  batchfile.open("w");
  batchfile.writeln(pdflatexexe+' -aux-directory="'+temppath+'" -include-directory="'+temppath+'" -output-directory="'+temppath+'" "'+temppath+'\\latex2illustrator.tex"');
  batchfile.writeln('del "'+temppath+'\\latex2illustrator.bat"');
  batchfile.close();
  batchfile.execute();

  for(; batchfile.exists; )

  for(; pdffile.exists === false; )
  // // wait until the batch file has removed itself
  var pdffile=File(temppath+"\\latex2illustrator.pdf");
  if(pdffile.exists){
    // import pdf file into the current document
    var grp=app.activeDocument.activeLayer.groupItems.createFromFile(pdffile);
    // The imported objects are grouped twice. Now move the subgroup
    // items to the main group and skip the last item which is the page frame
    for( var i=grp.pageItems[0].pageItems.length; --i>=0; )
     grp.pageItems[0].pageItems[i].move(grp,ElementPlacement.PLACEATEND);

    var last = grp.pageItems.length - 1;
    if (last >= 0 && grp.pageItems[last].typename == 'PathItem')
        grp.pageItems[last].remove();

    // if an object is selected move new object to the old objects location and remove old object
    if(selectedItems.length>0){ 
      if (tagList.length>0){
        grp.translate(selectedItem.pageItems[0].position[0]-grp.left,selectedItem.pageItems[0].position[1]-grp.top);
        selectedItem.remove();
      }
    }
    else // else move the (new) object to middle of view
      grp.translate(app.activeDocument.activeView.centerPoint[0]-grp.left, app.activeDocument.activeView.centerPoint[1]-grp.top);
  }
  else
    alert("File "+temppath+"\\"+pdffile.name+" could not be created. LaTeX error?");

  // Add tag to new object (with latex code)
  var tagList = grp.tags;
  var itemTag = tagList.add();
  itemTag.name = "LatexCode";
  itemTag.value = latexcode;
}
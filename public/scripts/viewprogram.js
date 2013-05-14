var myCodeMirror, lastSelectLine;
$(document).ready(init);
function init(){
  myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
    lineNumbers: true,
    matchBrackets: true,
    readOnly: true,
    mode: "text/x-csrc"
  });
  setTimeout(function(){
    $(".CodeMirror-lines > div").css({"margin-left": "28px"});
  }, 250);

  setInterval(function(){
    var selectedLine = myCodeMirror.getCursor().line;
    if(selectedLine >= 0 && selectedLine != lastSelectLine){
      if($(".popover").length){
        $(".popover").remove();
      }
      lastSelectLine = selectedLine;
      smartLine( selectedLine );
    }
  }, 250);
}
function smartLine( linenum ){

//  linepre.onclick = function(e){
    var linetext = myCodeMirror.getLine( linenum );
    linetext = replaceAll(linetext, "(", " ");
    linetext = replaceAll(linetext, ")", " ");
    linetext = replaceAll(linetext, "{", " ");
    linetext = replaceAll(linetext, "}", " ");
    linetext = replaceAll(linetext, ";", " ");
    linetext = replaceAll(linetext, "	", " "); // remove tabs
    linetext = replaceAll(linetext, "  ", "");
    var linewords = linetext.split(" ");
    // popup helpful info on terms
    for(var w=0;w<helpTerms.length;w++){
      if(helpTerms[w].name.indexOf(" ") > -1){
        // terms like void setup where both words appear & appear in order
        // for example "void setup"
        var helplist = helpTerms[w].name.split(" ");
        var foundAll = true;
        var lastIndex = 0;
        for(var m=0;m<helplist.length;m++){
          if(linewords.indexOf(helplist[m]) < lastIndex){
            foundAll = false;
            break;
          }
          else{
            lastIndex = linewords.indexOf(helplist[m]);
          }
        }
        if(foundAll){
          return showPopup( linenum, helpTerms[w] );
        }
      }
      else{
        if(linewords.indexOf(helpTerms[w].name) > -1){
          return showPopup( linenum, helpTerms[w] );
        }
      }
    }
 // };
}
function showPopup( linenum, term ){
  //console.log( term );
  $( $(".CodeMirror-lines > div > div > pre")[linenum+1] ).popover({
  //$(".CodeMirror").popover({
    title: term.name,
    content: term.about
  })
  .popover('show');
  setTimeout(function(){
    $(".popover").animate({
      left: "640px"
    }, 500);
  }, 250);
}
function traceSource(){
  $.getJSON("/program/history/" + program_id, function(sources){
    $("#completeHistory").html("<ul></ul>");
    sources.sort(function(a, b){
      a.p._length - b.p._length;
    });
    for(var s=0;s<sources.length;s++){
      var id = sources[s].p._end._data.self.split("/");
      id = id[id.length-1];
      var name = sources[s].other._data.data.name || ("Program #" + id);
      $("#completeHistory ul").append( '<li><a href="/program/' + id + '">' + name + '</a></li>' );
    }
  });
}
function replaceAll(str,oldr,newr){
  while(str.indexOf(oldr) > -1){
    str = str.replace(oldr,newr);
  }
  return str;
}
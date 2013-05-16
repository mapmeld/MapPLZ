var myCodeMirror, lastSelectLine;

myCodeMirror = CodeMirror.fromTextArea( $("#sketchplace")[0], {
  lineNumbers: true,
  matchBrackets: true,
  mode: "text/x-ruby"
});

setTimeout(function(){
  $(".CodeMirror-lines > div").css({"margin-left": "28px"});
}, 250);

if(!($("#sketchplace").val().length)){
  myCodeMirror.setValue('map\n  (Focus the map on something)\n  @ "Florida"\n\n  marker\n    (Set the location of a marker with an @, too)\n    @ "Disney World"\n\n  plz\n\nplz');
}

setInterval(function(){
  var selectedLine = myCodeMirror.getCursor().line;
  if(selectedLine >= 0 && selectedLine != lastSelectLine){
    lastSelectLine = selectedLine;
    if($(".popover").length){
      $(".popover").remove();
    }
    smartLine( selectedLine );
  }
}, 250);

function smartLine( linenum ){
  var linetext = myCodeMirror.getLine( linenum );
  linetext = linetext.replace(/\(.*\)/, " "); // don't look at commands inside comments
  linetext = replaceAll(linetext, "{", " ");
  linetext = replaceAll(linetext, "}", " ");
  linetext = replaceAll(linetext, ";", " ");
  linetext = replaceAll(linetext, "	", " "); // remove tabs
  linetext = replaceAll(linetext, "  ", "");
  var linewords = linetext.split(" ");
  // popup helpful info on terms
  for(var w=0;w<helpTerms.length;w++){
    if(helpTerms[w].name.indexOf(" ") > -1){
      // terms where both words appear & appear in order
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
        return showPop( linenum, helpTerms[w] );
      }
    }
    else if(linewords.indexOf(helpTerms[w].name) > -1){
      return showPop( linenum, helpTerms[w] );
    }
  }
}
function showPop( linenum, term ){
  $( $(".CodeMirror-lines > div > div > pre")[linenum+1] ).popover({
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
function writeSample(){
  var sketch = "";
  switch( $("#samples").val() ){
    case "none":
      sketch = 'map\nplz';
      break;
    case "florida":
      sketch = 'map\n  (Focus the map on something)\n  @ "Florida"\n\n  marker\n    (Set the location of a marker with an @, too)\n    @ "Disney World"\n\n  plz\n\nplz';
      break;
    case "nyc":
      sketch = '(Map of New York landmarks)\n\nmap\n \n  @ "New York City, NY"\n \n  marker\n    "MoMA"\n    @ "11 W 53rd St, New York City, NY"\n  plz\n \n  marker\n    [ 40.689262, -74.044451 ]\n    "Statue of Liberty"\n  plz\n\nplz';
      break;
    case "roadtrip":
      sketch = '(Here\'s where we went on a road trip)\nmap\n  @ "California"\n\n  line\n    "San Francisco, CA"\n    "Santa Cruz, CA"\n    "Monterey, CA"\n    "Redlands, CA"\n  plz\nplz\n';
      break;
    case "triangles":
      sketch = 'map\n  shape\n    [ 30, 30 ]\n    [ 29.5, 29.5 ]\n    [ 30.5, 29.5 ]\n  plz\nplz';
      break;
  }
  myCodeMirror.setValue( sketch );
}

function sendSketch(){
  $("#sketchplace").text( myCodeMirror.getValue() );
  $("#submitcode")[0].submit();
}

function replaceAll(str,oldr,newr){
  while(str.indexOf(oldr) > -1){
    str = str.replace(oldr,newr);
  }
  return str;
}

document.getElementById('map').style.height = "400px";
setTimeout(function(){
  codelines = $(".CodeMirror-lines pre");
  restart();
}, 250);

var lastcode = myCodeMirror.getValue();
var refreshTimeout = null;
setInterval(function(){
  if(lastcode != myCodeMirror.getValue()){
    lastcode = myCodeMirror.getValue();
    window.clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(function(){
      codelines = $(".CodeMirror-lines pre");
      restart();
    }, 250);
  }
}, 100);
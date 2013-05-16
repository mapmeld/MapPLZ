var myCodeMirror, lastSelectLine;

myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true,
  mode: "text/x-ruby"
});

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

document.getElementById('map').style.height = document.getElementById('map').parentElement.parentElement.offsetHeight + "px";

setTimeout(function(){
  $(".CodeMirror-lines > div").css({"margin-left": "28px"});
  codelines = $(".CodeMirror-lines pre");
  restart();
}, 250);
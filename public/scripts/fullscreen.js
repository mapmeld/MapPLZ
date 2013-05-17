var myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true,
  mode: "text/x-ruby"
});

setTimeout(function(){
  codelines = $(".CodeMirror-lines pre");
  restart();
}, 250);
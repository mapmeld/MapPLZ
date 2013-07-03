var myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
  matchBrackets: true,
  mode: "text/x-ruby"
});
startOver();

knownGeoResults = {
  "new york city, ny": {
    geometry: {
      viewport: new google.maps.LatLngBounds(
        new google.maps.LatLng(40.4959143, -74.2557349),
        new google.maps.LatLng(40.9152414, -73.700272)
      )
    }
  },
  "11 w 53rd st, new york city, ny": {
    geometry: {
      location: new google.maps.LatLng(40.7614029,-73.9776248)
    }
  }
}

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

function startOver(){
  myCodeMirror.setValue('map\n \n  @ "New York City, NY"\n\n  marker\n    [ 40.689262, -74.044451 ]\n    "Statue of Liberty"\n  plz\n \n  line\n    #f00\n    [ 0, 0 ]\n    [ 40.4, -73.8 ]\n  plz\n\nplz');
}

codelines = $(".CodeMirror-lines pre");
restart();
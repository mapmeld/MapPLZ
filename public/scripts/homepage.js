var myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
  matchBrackets: true,
  mode: "text/x-ruby"
});
myCodeMirror.setValue('(Inspired by LOL Code)\n(http://en.wikipedia.org/wiki/LOLCODE)\n\nmap\n \n  @ "New York City, NY"\n \n  marker\n    "MoMA"\n    @ "11 W 53rd St, New York City, NY"\n  plz\n \n  marker\n    [ 40.689262, -74.044451 ]\n    "Statue of Liberty"\n  plz\n \n  line\n    #f00\n    [ 0, 0 ]\n    [ 10, 10 ]\n  plz\n\nplz');

document.getElementById('map').style.height = document.getElementById('map').parentElement.parentElement.offsetHeight + "px";

var map = new google.maps.Map( document.getElementById('map'), {
  zoom: 8,
  center: new google.maps.LatLng(-34, 150),
  mapTypeId: google.maps.MapTypeId.ROADMAP
});
var geocoder = new google.maps.Geocoder();
var infowindow = new google.maps.InfoWindow();
google.maps.event.addListener(map, 'click', function(e){
  infowindow.close();
});

var scope = "toplevel";
var codelines = $(".CodeMirror-lines pre");

var allshapes = [ ];
var latlngs = [ ];
var content = "";
var color = "";

var processLine = function(c){

  if(c > codelines.length - 1){
    return;
  }

  var line = codelines[c].textContent.toLowerCase();

  // moving between levels of code
  if(scope == "toplevel"){
    if(line.indexOf("map") > -1){
      scope = "map";
    }
    return processLine(c+1);
  }
  else if(scope == "map"){
    
    if(line.indexOf("marker") > -1){
      scope = "marker";
      return processLine(c+1);
    }
    if(line.indexOf("line") > -1){
      scope = "line";
      return processLine(c+1);
    }
    if(line.indexOf("shape") > -1){
      scope = "shape";
      return processLine(c+1);
    }
    
    if((line.indexOf("plz") > -1) || (line.indexOf("please") > -1)){
      scope = "toplevel";
      return;
    }
  }
  else if((scope == "marker") || (scope == "line") || (scope == "shape")){
    if((line.indexOf("plz") > -1) || (line.indexOf("please") > -1)){
      var shape = null;
      var oldlls = latlngs.concat();
      if( scope == "marker" ){
        shape = new google.maps.Marker({
          position: latlngs[0],
          map: map,
          clickable: !(!content.length)
        });
      }
      else if( scope == "line" ){
        shape = new google.maps.Polyline({
          path: latlngs,
          map: map,
          clickable: !(!content.length),
          strokeColor: (color || null)
        });
      }
      else if( scope == "shape" ){
        shape = new google.maps.Polygon({
          paths: latlngs,
          map: map,
          clickable: !(!content.length),
          strokeColor: (color || null),
          fillColor: (color || null)
        });
      }
      if(shape){
        addClickable(shape, oldlls[0], content);
        allshapes.push(shape);
      }
      scope = "map";
      content = "";
      color = "";
      latlngs = [ ];
      return processLine(c+1);
    }
  }
  
  // reading a geocode
  if( codelines[c].children && codelines[c].children.length && (codelines[c].children[0].textContent == "@") ){
    for(var n=1;n<codelines[c].children.length;n++){
      if(codelines[c].children[n].className == "cm-string"){
        var geocodethis = codelines[c].children[n].textContent;
        geocodethis = geocodethis.substring(1, geocodethis.length - 1);
        
        geocoder.geocode( { 'address': geocodethis }, function(results, status){
          if(status == google.maps.GeocoderStatus.OK){
            if(scope == "map"){
              map.fitBounds( results[0].geometry.viewport );
            }
            else{
              latlngs.push( results[0].geometry.location );
            }
          }
          return processLine(c+1);
        });
        return;
      }
    }
    return processLine(c+1);
  }
  
  // reading a color
  if( codelines[c].children && codelines[c].children.length && (codelines[c].children[0].textContent[0] == "#") ){
    color = codelines[c].children[0].textContent;
    return processLine(c+1);
  }
  
  // reading a raw string (probably text for a popup)
  if(line.indexOf('"') > -1){
    for(var n=0;n<codelines[c].children.length;n++){
      if(codelines[c].children[n].className == "cm-string"){
        content = codelines[c].children[n].textContent;
        content = content.substring(1, content.length - 1);
        return processLine(c+1);
      }
    }
  }
    
  // reading a latlng
  if((line.indexOf("[") > -1) && (line.indexOf(",") > -1) && (line.indexOf("]") > -1)){
    var sign = 1.0;
    var latlng = [ ];
    var numbers = codelines[c].children;
    for(var n=0;n<numbers.length;n++){
      if(numbers[n].textContent == "-"){
        sign *= -1.0;
      }
      else{
        var samp = 1.0 * sign * numbers[n].textContent;
        if( !isNaN( samp ) ){
          latlng.push( samp );
          sign = 1;
        }
      }
    }
    
    if(latlng.length != 2){
      return processLine(c+1);
    }
    
    if(scope == "map"){
      map.setCenter( new google.maps.LatLng( latlng[0], latlng[1] ) );
    }
    else if(scope == "marker" || scope == "line" || scope == "shape"){
      latlngs.push( new google.maps.LatLng( latlng[0], latlng[1] ) );
    }

    return processLine(c+1);
  }
  
  return processLine(c+1);
};

processLine(0);

function addClickable(shape, ll, content){
  google.maps.event.addListener(shape, 'click', function(){
    infowindow.setContent( content );
    infowindow.setPosition( ll );
    infowindow.open(map);
  });
}

function restart(){
  for(var s=0;s<allshapes.length;s++){
    allshapes[s].setMap(null);
  }
  allshapes = [ ];

  scope = "toplevel";
  codelines = $(".CodeMirror-lines pre");

  processLine(0);
}
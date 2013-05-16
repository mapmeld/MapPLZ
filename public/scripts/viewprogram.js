var myCodeMirror, lastSelectLine;
$(document).ready(init);
function init(){
  myCodeMirror = CodeMirror.fromTextArea( document.getElementById("sketchplace"), {
    lineNumbers: true,
    matchBrackets: true,
    readOnly: true,
    mode: "text/x-ruby"
  });
  setTimeout(function(){
    $(".CodeMirror-lines > div").css({"margin-left": "28px"});
    restart();
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

document.getElementById('map').style.height = document.getElementById('map').parentElement.parentElement.offsetHeight + "px";

google.maps.visualRefresh=true;
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
        if(latlngs.length > 1){
          addClickable(shape, oldlls[0], content);
        }
        else{
          addClickable(shape, null, content);        
        }
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
          
          if(n > 0 && numbers[n-1].textContent == "."){
            var frac = "0." + numbers[n].textContent;
            frac *= 1.0;
            if(latlng[ latlng.length - 1 ] > 0){
              latlng[ latlng.length - 1 ] += frac;            
            }
            else{
              latlng[ latlng.length - 1 ] -= frac;
            }
          }
          else{
            latlng.push( samp );
            sign = 1;
          }
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

function addClickable(shape, ll, content){
  google.maps.event.addListener(shape, 'click', function(){
    infowindow.setContent( content );
    if(ll){
      infowindow.setPosition( ll );
      infowindow.open(map);
    }
    else{
      infowindow.open(map, shape);
    }
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
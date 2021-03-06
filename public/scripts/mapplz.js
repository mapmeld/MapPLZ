var scope = "toplevel";
var allshapes = [ ];
var latlngs = [ ];
var content = "";
var color = "";
var codelines;
var knownGeoResults = { };
var bounds = [180, 90, -180, -90]; // xmin, ymin, xmax, ymax
var inbutton = false;
var buttonLayers = [ ];

google.maps.visualRefresh=true;
var map = new google.maps.Map( document.getElementById('map'), {
  zoom: 8,
  center: new google.maps.LatLng(-34, 150),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  streetViewControl: false  //,
  //mapTypeControl: false
});
var geocoder = new google.maps.Geocoder();
var infowindow = new google.maps.InfoWindow();
google.maps.event.addListener(map, 'click', function(e){
  infowindow.close();
});

var processLine = function(c){
  if(c > codelines.length - 1){
    return;
  }

  var line = codelines[c].textContent.toLowerCase();

  // moving between levels of code
  if(scope == "toplevel"){
    //if(line.indexOf("map") > -1){
    if( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("map") > -1 ){
      scope = "map";
    }
    return processLine(c+1);
  }
  else if(scope == "map" || scope == "button"){
    
    if(( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("button") > -1 ) || ( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("btn") > -1 )){
      scope = "button";
      buttonLayers.push({
        layers: [ ]
      });
      inbutton = buttonLayers.length;
    }
    
    if( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("marker") > -1 ){
      scope = "marker";
      return processLine(c+1);
    }
    if( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("line") > -1 ){
      scope = "line";
      return processLine(c+1);
    }
    if( $(codelines[c], ".cm-keyword")[0].textContent.toLowerCase().indexOf("shape") > -1 ){
      scope = "shape";
      return processLine(c+1);
    }
    
    if((line.indexOf("plz") > -1) || (line.indexOf("please") > -1)){
      if(scope == "map"){
        scope = "toplevel";
        if(bounds){
          if( bounds[0] == bounds[2] && bounds[1] == bounds[3] ){
            // one point
            map.setCenter( new google.maps.LatLng( bounds[1], bounds[0] ) );
          }
          else if( bounds[0] <  bounds[2] ){
            // many points
            map.fitBounds( new google.maps.LatLngBounds(
              new google.maps.LatLng( bounds[1], bounds[0] ),
              new google.maps.LatLng( bounds[3], bounds[2] )
            ));
          }
        }
        return;
      }
      else if(scope == "button"){
        if(buttonLayers[inbutton-1].content){
          var btn = document.createElement("a");
          btn.href = "#";
          btn.className = "btn btn-success";
          if(buttonLayers[inbutton-1].color){
            btn.style.background = buttonLayers[inbutton-1].color;
            btn.style.backgroundColor = buttonLayers[inbutton-1].color;
          }
          btn.textContent = buttonLayers[inbutton-1].content;
          btn.innerHTML = "<span style='display:none;'>&check;&nbsp;&nbsp;</span>" + btn.innerHTML;
          bindButton( btn, buttonLayers[inbutton-1].layers );
          $("#buttonbar").append( btn );
        }
        scope = "map";
        inbutton = false;
        return processLine(c+1);
      }
    }
  }
  else if((scope == "marker") || (scope == "line") || (scope == "shape")){
    if((line.indexOf("plz") > -1) || (line.indexOf("please") > -1)){
      var shape = null;
      var oldlls = latlngs.concat();
      if( scope == "marker" ){
        shape = new google.maps.Marker({
          position: latlngs[0],
          clickable: !(!content.length)
        });
      }
      else if( scope == "line" ){
        shape = new google.maps.Polyline({
          path: latlngs,
          clickable: !(!content.length),
          strokeColor: (color || null)
        });
      }
      else if( scope == "shape" ){
        shape = new google.maps.Polygon({
          paths: latlngs,
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
        if(inbutton){
          buttonLayers[ inbutton-1 ].layers.push(shape);
        }
        else{
          shape.setMap(map);
          allshapes.push(shape);
        }
      }
      if(inbutton){
        scope = "button";
      }
      else{
        scope = "map";
      }
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
        if( knownGeoResults[ geocodethis.toLowerCase() ] ){
          results = [ knownGeoResults[ geocodethis.toLowerCase() ] ];
          if(scope == "map"){
            map.fitBounds( results[0].geometry.viewport );
            bounds = null;
          }
          else{
            latlngs.push( results[0].geometry.location );
            adjustBounds( results[0].geometry.location );
          }
          return processLine(c+1);
        }
        else{
          geocoder.geocode( { 'address': geocodethis }, function(results, status){
            if(status == google.maps.GeocoderStatus.OK){
              knownGeoResults[ geocodethis.toLowerCase() ] = results[0];
              if(scope == "map"){
                map.fitBounds( results[0].geometry.viewport );
                bounds = null;
              }
              else{
                latlngs.push( results[0].geometry.location );
                adjustBounds( results[0].geometry.location );
              }
            }
            return processLine(c+1);
          });
        }
        return;
      }
    }
    return processLine(c+1);
  }
  
  // reading a color
  if( codelines[c].children && codelines[c].children.length && (codelines[c].children[0].textContent[0] == "#") ){
    color = codelines[c].children[0].textContent;
    if((color.length != 4 && color.length != 7) || ( isNaN( parseInt(color.replace("#",""), 16) ))){
      // written color
      color = color.replace("#","");
    }
    
    if(scope == "button"){
      buttonLayers[ inbutton-1 ].color = color;
    }
    return processLine(c+1);
  }
  
  // reading a raw string (probably text for a popup)
  if(line.indexOf('"') > -1){
    for(var n=0;n<codelines[c].children.length;n++){
      if(codelines[c].children[n].className == "cm-string"){
        content = codelines[c].children[n].textContent;
        content = content.substring(1, content.length - 1);
        if(inbutton){
          buttonLayers[ inbutton-1 ].content = content;
        }
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
      adjustBounds( latlng );
    }

    return processLine(c+1);
  }
  
  return processLine(c+1);
};

function adjustBounds(coord){
  if(bounds){
    if(typeof coord.lat != "undefined"){
      // xmin, ymin, xmax, ymax
      bounds = [
        Math.min( bounds[0], coord.lng() ),
        Math.min( bounds[1], coord.lat() ),
        Math.max( bounds[2], coord.lng() ),
        Math.max( bounds[3], coord.lat() )
      ];
    }
    else{
      // xmin, ymin, xmax, ymax
      bounds = [
        Math.min( bounds[0], coord[1] ),
        Math.min( bounds[1], coord[0] ),
        Math.max( bounds[2], coord[1] ),
        Math.max( bounds[3], coord[0] )
      ];
    }
  }
}

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

function bindButton( btn, layers ){
  var toggled = false;
  btn.onclick = function(e){
    toggled = !toggled;
    if(toggled){
      $(btn).children()[0].style.display = "inline";
    }
    else{
      $(btn).children()[0].style.display = "none";
    }
    for(var i=0;i<layers.length;i++){
      if(toggled){
        layers[i].setMap(map);
      }
      else{
        layers[i].setMap(null);
      }
    }
  };
}

function restart(){
  for(var s=0;s<allshapes.length;s++){
    allshapes[s].setMap(null);
  }
  allshapes = [ ];
  buttonLayers = [ ];
  $("#buttonbar").html("");
  bounds = [180, 90, -180, -90];
  scope = "toplevel";
  processLine(0);
}
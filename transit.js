var map;
var myMarker;
var myPosition;

var dRequest;
var cwRequest;
var redLineMarkers;
var blueLineMarkers;
var orangeLineMarkers;
var arrivalData;
var geoLoaded;
// hard-coded station data is at the bottom of the file

function initialize() {
  try{
    if(!navigator.geolocation) {
      throw 'Geolocation is not supported!';
    } else {
      initGlobal();
      /// Initialize map of Greater Boston area 
      var latlng = new google.maps.LatLng(42.37,-71.08);
      mapOptions = {
        zoom: 13,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

      // Get current position, and recenter map  
      navigator.geolocation.getCurrentPosition(placeGeoLoc);

      
      placeRedLineStations();

      placeBlueLineStations();

      placeOrangeLineStations();
     
      //retrieve and set train info
      setArrivalData();
    }
  } 
  catch (e) {
    alert("Oh no, something went wrong! Please refresh the page.");
  }
}

function initGlobal(){
  redLineMarkers = new Object();
  blueLineMarkers = new Object();
  orangLineMarkers = new Object();
  geoLoaded=false;
}

function toRad(x){
    return x * Math.PI / 180;
}

function myDistance(lat1,lon1){
  return function(lat2,lon2){
    var R = 3959;

    var x1 = lat1-lat2;
    var dLat = toRad(x1);  
    var x2 = lon1-lon2; 
    var dLon = toRad(x2); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);  
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return d;
  };
}

// Function to get current position using navigator.geolocation

function getGeoLocation(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var latlng = new google.maps.LatLng(lat,lng);
  myPositon=position;

  myMarker = new google.maps.Marker({
    position: latlng,
    title:"This is you!"    	
  });
  geoLoaded=true;
  
  google.maps.event.addListener(myMarker, 'click', function() { 
    infowindow.open(map, myMarker);
  }); 
  myMarker.setMap(map);
}


function placeRedLineStations(){
  for(key in rlstations){
    var station = rlstations[key];
    var pos = new google.maps.LatLng(station.stop_lat,station.stop_lon);
    redLineMarkers[key]=StationMarker(pos,key);
    redLineMarkers[key].marker.setMap(map);       
  }
  drawStationConnections_red();
}

function placeBlueLineStations(){
  for(key in blstations){
    var station = blstations[key];
    var pos = new google.maps.LatLng(station.stop_lat,station.stop_lon);
    blueLineMarkers[key]=StationMarker(pos,key);
    blueLineMarkers[key].marker.setMap(map);       
  }
  drawStationConnections_blue();
}

function placeOrangeLineStations(){
  for(key in olstations){
    var station = olstations[key];
    var pos = new google.maps.LatLng(station.stop_lat,station.stop_lon);
    orangeLineMarkers[key]=StationMarker(pos,key);
    orangeLineMarkers[key].marker.setMap(map);       
  }
  drawStationConnections_orange();
}
function StationMarker(pos, t) {
  var image = {
    url: 'marker.png',
    origin: new google.maps.Point(0,0),
    size: new google.maps.Size(25, 25),
    anchor: new google.maps.Point(12, 12)
  };
  var marker = new google.maps.Marker({
    position: pos,
    title:t,
    icon: image
  });
  var infowindow = new google.maps.InfoWindow({
    content: "<h3>"+ t + " STATION</h3><p>loading...<p>"
  });
  google.maps.event.addListener(marker, 'click', function() { 
    infowindow.open(map, marker);
  }); 
  var stationObj={"marker":marker,
              "info":infowindow};
  return stationObj;  
}

function setArrivalData(){
  try {
    dRequest = new XMLHttpRequest();
  }
  catch (ms1) { 
    try {
      dRequest = new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (ms2) {
      try {
        dRequest = new ActiveXObject("Microsoft.XMLHTTP");
      }
      catch (ex) {
        dRequest = null;
      }
    }
  }
  if (dRequest == null) {
    alert("Error creating request object --Ajax not supported?");
  }else{
    dRequest.open("GET","http://mbtamap.herokuapp.com/mapper/rodeo.json",true);    
    dRequest.send(null);
    dRequest.onreadystatechange=CallinfoWindow;
  }

  function CallinfoWindow()){
  if(dRequest.readyState==4&&dRequest.status==200){
    arrivalData=JSON.parse(dRequest.responseText);

    if (arrivalData[line] = "red"){
    for(key in rlstations){
      setInfo_red(key);
      }
    } 

if (arrivalData[line] = "blue"){
    for(key in blstations){
      setInfo_blue(key);
      }
    } 

if (arrivalData[line] = "orange"){
    for(key in 0lstations){
      setInfo_orange(key);
      }
    } 
  }
  if(dRequest.status==0||dRequest.status==404){ 
    dRequest.abort();
    alert("Could not get train arrival data...please refresh the page");
  }
}

function setInfo_red(key){
  var infoWindow=redLineMarkers[key].info;
  var nbname=rlstations[key].PlatformKeyNB;
  var sbname=rlstations[key].PlatformKeySB;
  var content="<p class=\"infoheader\">"+key+" STATION:</p><table border=\"1\"><tr><th>Direction</th><th>Predicted Arrival</th></tr>";
  for(i=0; i<arrivalData.length; i++){
    if(arrivalData[i].PlatformKey==nbname&&arrivalData[i].InformationType=="Predicted"){
      content+="<tr><td>Alewife (NB)</td><td>"+arrivalData[i].Time+"</td></tr>";
    }
    if(arrivalData[i].PlatformKey==sbname&&arrivalData[i].InformationType=="Predicted"){
      if(arrivalData[i].Route==0)content+="<tr><td>Braintree (SB)</td><td>";
      else content+="<tr><td>Ashmont (SB)</td><td>";
      content+=arrivalData[i].Time+"</td></tr>";        
    }
  }
  content+="</table>";
  infoWindow.setContent(content);
}

function drawStationConnections_red(){
  for(i=0; i<connections.length; i++){
    var rlcoord = [];
    for(j=0; j<connections[i].length; j++){
      var skey=connections[i][j];
      var pos=new google.maps.LatLng(rlstations[skey].stop_lat,rlstations[skey].stop_lon);
      rlcoord.push(pos);
    }
    var rlPath = new google.maps.Polyline({
      path: rlcoord,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    rlPath.setMap(map);
  }
}

function setInfo_blue(key){
  var infoWindow=blueLineMarkers[key].info;
  var nbname=blstations[key].PlatformKeyNB;
  var sbname=blstations[key].PlatformKeySB;
  var content="<p class=\"infoheader\">"+key+" STATION:</p><table border=\"1\"><tr><th>Direction</th><th>Predicted Arrival</th></tr>";
  for(i=0; i<arrivalData.length; i++){
    if(arrivalData[i].PlatformKey==nbname&&arrivalData[i].InformationType=="Predicted"){
      content+="<tr><td>Wonderland (NB)</td><td>"+arrivalData[i].Time+"</td></tr>";
    }
    if(arrivalData[i].PlatformKey==sbname&&arrivalData[i].InformationType=="Predicted"){
      if(arrivalData[i].Route==0)content+="<tr><td>Bowdoin (SB)</td><td>";
      content+=arrivalData[i].Time+"</td></tr>";        
    }
  }
  content+="</table>";
  infoWindow.setContent(content);
}

function drawStationConnections_blue(){
  for(i=0; i<connections.length; i++){
    var blcoord = [];
    for(j=0; j<connections[i].length; j++){
      var skey=connections[i][j];
      var pos=new google.maps.LatLng(blstations[skey].stop_lat,rlstations[skey].stop_lon);
      blcoord.push(pos);
    }
    var blPath = new google.maps.Polyline({
      path: blcoord,
      strokeColor: "blue",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    blPath.setMap(map);
  }
}

function setInfo_orange(key){
  var infoWindow=orangeLineMarkers[key].info;
  var nbname=olstations[key].PlatformKeyNB;
  var sbname=olstations[key].PlatformKeySB;
  var content="<p class=\"infoheader\">"+key+" STATION:</p><table border=\"1\"><tr><th>Direction</th><th>Predicted Arrival</th></tr>";
  for(i=0; i<arrivalData.length; i++){
    if(arrivalData[i].PlatformKey==nbname&&arrivalData[i].InformationType=="Predicted"){
      content+="<tr><td>Oak Grove (NB)</td><td>"+arrivalData[i].Time+"</td></tr>";
    }
    if(arrivalData[i].PlatformKey==sbname&&arrivalData[i].InformationType=="Predicted"){
      if(arrivalData[i].Route==0)content+="<tr><td>Forest Hills (SB)</td><td>";
      content+=arrivalData[i].Time+"</td></tr>";        
    }
  }
  content+="</table>";
  infoWindow.setContent(content);
}

function drawStationConnections_orange(){
  for(i=0; i<connections.length; i++){
    var olcoord = [];
    for(j=0; j<connections[i].length; j++){
      var skey=connections[i][j];
      var pos=new google.maps.LatLng(olstations[skey].stop_lat,olstations[skey].stop_lon);
      olcoord.push(pos);
    }
    var olPath = new google.maps.Polyline({
      path: olcoord,
      strokeColor: "orange",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    olPath.setMap(map);
  }
}

// hard code



b1stations = 
{
{
   "Line": "Blue",
   "Station":"Airport",
   "stop_lat":42.374262,
   "stop_long":-71.030395
 },
 {
   "Line": "Blue",
   "Station":"Aquarium",
   "stop_lat":42.359784,
   "stop_long":-71.051652
 },
 {
   "Line": "Blue",
   "Station":"Beachmont",
   "stop_lat":42.39754234,
   "stop_long":-70.99231944
 },
 {
   "Line": "Blue",
   "Station":"Bowdoin",
   "stop_lat":42.361365,
   "stop_long":-71.062037
 },
 {
   "Line": "Blue",
   "Station":"Government Center",
   "stop_lat":42.359705,
   "stop_long":-71.05921499999999
 },
 {
    "Line": "Blue",
   "Station":"Maverick",
   "stop_lat":42.36911856,
   "stop_long":-71.03952958000001
 },
 {
   "Line": "Blue",
   "Station":"Orient Heights",
   "stop_lat":42.386867,
   "stop_long":-71.00473599999999
 },
 {
   "Line": "Blue",
   "Station":"Revere Beach",
   "stop_lat":42.40784254,
   "stop_long":-70.99253321
 },
 {
   "Line":"Blue",
   "Station":"State Street",
   "stop_lat":42.358978,
   "stop_long":-71.057598
 },
 {
   "Line":"Blue",
   "Station":"Suffolk Downs",
   "stop_lat":42.39050067,
   "stop_long":-70.99712259
 },
 {
   "Line":"Blue",
   "Station":"Wonderland",
   "stop_lat":42.41342,
   "stop_long":-70.991648
 },
 {
   "Line":"Blue",
   "Station":"Wood Island",
   "stop_lat":42.3796403,
   "stop_long":-71.02286539000001
 }
}

o1stations = 
{
 {
   "Line":"Orange",
   "Station":"Back Bay",
   "stop_lat":42.34735,
   "stop_long":-71.075727
 },
 {
   "Line":"Orange",
   "Station":"Chinatown",
   "stop_lat":42.352547,
   "stop_long":-71.062752
 },
 {
   "Line":"Orange",
   "Station":"Community College",
   "stop_lat":42.373622,
   "stop_long":-71.06953300000001
 },
 {
   "Line":"Orange",
   "Station":"Downtown Crossing",
   "stop_lat":42.355518,
   "stop_long":-71.060225
 },
 {
   "Line":"Orange",
   "Station":"Forest Hills",
   "stop_lat":42.300523,
   "stop_long":-71.113686
 },
 {
   "Line":"Orange",
   "Station":"Green Street",
   "stop_lat":42.310525,
   "stop_long":-71.10741400000001
 },
 {
   "Line":"Orange",
   "Station":"Haymarket",
   "stop_lat":42.363021,
   "stop_long":-71.05829
 },
 {
   "Line":"Orange",
   "Station":"Jackson Square",
   "stop_lat":42.323132,
   "stop_long":-71.099592
 },
 {
   "Line":"Orange",
   "Station":"Malden Center",
   "stop_lat":42.426632,
   "stop_long":-71.07411
 },
 {
   "Line":"Orange",
   "Station":"Mass Ave",
   "stop_lat":42.341512,
   "stop_long":-71.083423
 },
 {
   "Line":"Orange",
   "Station":"North Station",
   "stop_lat":42.365577,
   "stop_long":-71.06129
 },
 {
   "Line":"Orange",
   "Station":"Oak Grove",
   "stop_lat":42.43668,
   "stop_long":-71.07109699999999
 },
 {
   "Line":"Orange",
   "Station":"Roxbury Crossing",
   "stop_lat":42.331397,
   "stop_long":-71.095451
 },
 {
   "Line":"Orange",
   "Station":"Ruggles",
   "stop_lat":42.336377,
   "stop_long":-71.088961
 },
 {
   "Line":"Orange",
   "Station":"State Street",
   "stop_lat":42.358978,
   "stop_long":-71.057598
 },
 {
   "Line":"Orange",
   "Station":"Stony Brook",
   "stop_lat":42.317062,
   "stop_long":-71.104248
 },
 {
   "Line":"Orange",
   "Station":"Sullivan",
   "stop_lat":42.383975,
   "stop_long":-71.076994
 },
 {
   "Line":"Orange",
   "Station":"Tufts Medical",
   "stop_lat":42.349662,
   "stop_long":-71.063917
 },
 {
   "Line":"Orange",
   "Station":"Wellington",
   "stop_lat":42.40237,
   "stop_long":-71.077082
 }
}

r1stations = 
{
 {
   "Line":"Red",
   "Station":"Alewife",
   "stop_lat":42.395428,
   "stop_long":-71.142483
 },
 {
   "Line":"Red",
   "Station":"Andrew",
   "stop_lat":42.330154,
   "stop_long":-71.057655
 },
 {
   "Line":"Red",
   "Station":"Ashmont",
   "stop_lat":42.284652,
   "stop_long":-71.06448899999999
 },
 {
   "Line":"Red",
   "Station":"Braintree",
   "stop_lat":42.2078543,
   "stop_long":-71.0011385
 },
 {
   "Line":"Red",
   "Station":"Broadway",
   "stop_lat":42.342622,
   "stop_long":-71.056967
 },
 {
   "Line":"Red",
   "Station":"Central Square",
   "stop_lat":42.365486,
   "stop_long":-71.103802
 },
 {
   "Line":"Red",
   "Station":"Charles/MGH",
   "stop_lat":42.361166,
   "stop_long":-71.070628
 },
 {
   "Line":"Red",
   "Station":"Davis",
   "stop_lat":42.39674,
   "stop_long":-71.121815
 },
 {
   "Line":"Red",
   "Station":"Downtown Crossing",
   "stop_lat":42.355518,
   "stop_long":-71.060225
 },
 {
   "Line":"Red",
   "Station":"Fields Corner",
   "stop_lat":42.300093,
   "stop_long":-71.061667
 },
 {
   "Line":"Red",
   "Station":"Harvard Square",
   "stop_lat":42.373362,
   "stop_long":-71.118956
 },
 {
   "Line":"Red",
   "Station":"JFK/UMass",
   "stop_lat":42.320685,
   "stop_long":-71.052391
 },
 {
   "Line":"Red",
   "Station":"Kendall/MIT",
   "stop_lat":42.36249079,
   "stop_long":-71.08617653
 },
 {
   "Line":"Red",
   "Station":"North Quincy",
   "stop_lat":42.275275,
   "stop_long":-71.029583
 },
 {
   "Line":"Red",
   "Station":"Park Street",
   "stop_lat":42.35639457,
   "stop_long":-71.0624242
 },
 {
   "Line":"Red",
   "Station":"Porter Square",
   "stop_lat":42.3884,
   "stop_long":-71.11914899999999
 },
 {
   "Line":"Red",
   "Station":"Quincy Adams",
   "stop_lat":42.233391,
   "stop_long":-71.007153
 },
 {
   "Line":"Red",
   "Station":"Quincy Center",
   "stop_lat":42.251809,
   "stop_long":-71.005409
 },
 {
   "Line":"Red",
   "Station":"Savin Hill",
   "stop_lat":42.31129,
   "stop_long":-71.053331
 },
 {
   "Line":"Red",
   "Station":"Shawmut",
   "stop_lat":42.29312583,
   "stop_long":-71.06573796000001
 },
 {
   "Line":"Red",
   "Station":"South Station",
   "stop_lat":42.352271,
   "stop_long":-71.05524200000001
 },
 {
   "Line":"Red",
   "Station":"Wollaston",
   "stop_lat":42.2665139,
   "stop_long":-71.0203369
 }
}

  // global
var stations;
var distances = [];
var myLatLng;
var nearestLatLon;
var map;

var allMarkers = [];
var getMarker = function (lat, lng){
  allMarkers.forEach(function(el){
    if(el.getPosition().lat() == lat && el.getPosition().lng() == lng){
      el.setAnimation(google.maps.Animation.BOUNCE);
    }
  });
};

// jquery
$(document).ready(function() {
  $('.progress').animate({ width: '100%' }, 4000);
});

// promises.all returns an array with all data from each AJAX call

Promise.all([getBStatus(), getBInfo()])
  .then(mergeResponses)
  .then(addGoogleMapsScript);
  console.log(getBStatus);

function mergeResponses (responses) {

  var statusResponse = responses[0];
  var locationResponse = responses[1];

  // creating a new object with status information

  var stationsPathStatus = statusResponse.data.stations;
  var combinedStationsObj = {};

  stationsPathStatus.forEach(function(el) {
    var numBikesAvailKey = Object.keys(el)[1];
    var numStationsAvailKey = Object.keys(el)[2];
    var isRentingKey = Object.keys(el)[4];
    var isReturningKey = Object.keys(el)[5];
    combinedStationsObj[el.station_id] = {
      numBikesAvailKey: el.num_bikes_available,
      numStationsAvailKey: el.num_docks_available,
      isRentingKey: el.is_renting,
      isReturningKey: el.is_returning
    };
  });

  // adding info to the already created station object

  var stationsFromInfo = locationResponse.data.stations;
  stationsFromInfo.forEach(function(el) {
    var key = el.station_id;
    var lonVal = el.lon;
    var latVal = el.lat;
    var nameVal = el.name;

    combinedStationsObj[key].lat = latVal;
    combinedStationsObj[key].lon = lonVal;
    combinedStationsObj[key].name = nameVal;

    stations = combinedStationsObj;
  });
}


function getBStatus() {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: 'https://gbfs.bcycle.com/bcycle_denver/station_status.json',
      method: 'GET'
    }).done(function (bStatusAJAXReturn) {
      resolve(bStatusAJAXReturn);
    }).fail(function(err) {
      reject(err);
    });
  });
}

function getBInfo() {
  return new Promise(function(resolve, reject) {
    $.ajax ({
      url: 'https://gbfs.bcycle.com/bcycle_denver/station_information.json',
      method: 'GET'
    }).done(function (bStationInfoAJAXReturn) {
      resolve(bStationInfoAJAXReturn);
    }).fail(function(err) {
      reject(err);
    });
  });
}

function addGoogleMapsScript () {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.src  = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzaOBIjmRJeiSfhiXhPC4Wo4syHsQG_hc&callback=geoFindMe&libraries=geometry';
  $('head').append(s);
}

// Passing in lat and lon perameters from geoFindMe

function newMap(lat, lng) {
  myLatLng = new google.maps.LatLng(lat, lng);
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: myLatLng
  });
  return map;
}

function newMarker(pos,map,title,icon,numBikesAvail) {
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
    title: title,
    icon: icon
  });
  distanceAway(pos, map, title, numBikesAvail)

  return marker;
}
var greenMarker = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
var blueMarker = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

function distanceAway(stationLoc, userLocation, name, numBikesAvail) {

  var distance = parseFloat((google.maps.geometry.spherical.computeDistanceBetween(
    stationLoc, userLocation) * 0.000621371).toFixed(2));

  distances.push({
    name: name,
    distance: distance,
    stationLatLon: stationLoc,
    num_bikes_avail: numBikesAvail
  });
}

function initMap (lat, lng) {
  var myLatLng = new google.maps.LatLng(lat, lng);
  var map = newMap(lat,lng);
  var marker = newMarker(myLatLng, map,'Current Location', greenMarker);

  // instead of a for loop, use map
  // var markers = stations.map(...);
  // markers.forEach(... )

  for (var station in stations) {
    var latitude = (stations[station].lat);
    var lon = (stations[station].lon);
    var name = (stations[station].name);
    var numBikesAvail =  (stations[station].numBikesAvilKey);
    var coordinates = new google.maps.LatLng(latitude, lon);
    newMarker(coordinates, map, name, blueMarker, numBikesAvail);
  }

  var infowindow = new google.maps.InfoWindow({
    content:'Your current location'
  });

  infowindow.open(map,marker);

  // return the marker from mapMarker



  detClosest(distances);

}

function detClosest(distancesArr) {
  var index = 0;
  var value = 100000;

  for (var i = 0; i < distancesArr.length; i++) {
    if (distancesArr[i].distance < value) {
      value = distancesArr[i].distance;
      index = i;
    }
  }

  var nearStationName = distancesArr[index].name;
  var nearestDistance = value;
  nearestLatLon = distancesArr[index].stationLatLon;

  var pathTo = [myLatLng, nearestLatLon];
  console.log(pathTo);

  var flightPath = new google.maps.Polyline({
    path:pathTo,
    strokeColor:'#BB2034',
    strokeOpacity:0.65,
    strokeWeight:8
  });

  getMarker(distancesArr[index].stationLatLon.lat(), distancesArr[index].stationLatLon.lng());

  flightPath.setMap(map);
  // var nearMile = value;
  $('.station').prepend("<div class='col-md-6 text-center'><p> Distance (Miles): </p><p><span class='bold'>" + nearestDistance + "</span></p></div>");
  $('.station').prepend("<div class='col-md-6 text-center'><p> Nearest Station: </p><p class='bold text-center'>" + nearStationName + "</p></div>");
  $('.progress').remove();

}

// Retrieve user location

function geoFindMe() {

  console.log('stations', stations.length);


  var output = document.getElementById('out');

  if (!navigator.geolocation) {
    output.innerHTML = '<p>Geolocation is not supported by your browser</p>';
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;


    initMap(latitude, longitude);
  }

  function error() {
    output.innerHTML = 'Unable to retrieve your location';
  }

  // output.innerHTML = "<p>Locating…</p>";

  navigator.geolocation.getCurrentPosition(success, error);
}

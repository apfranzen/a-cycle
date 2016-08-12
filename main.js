// global
var stations;
var distances = [];
var myLatLng;
var nearestLatLon;
var map;

// jquery
$(document).ready(function() {
  $('.progress').animate({ width: '100%' }, 4000);
});

// promises.all returns an array with all data from each AJAX call

Promise.all([getBStatus(), getBInfo()])
  .then(mergeResponses)
  .then(addGoogleMapsScript);

function mergeResponses (responses) {

  var statusResponse = responses[0];
  var locationResponse = responses[1];

  // creating a new object with status information

  var stationsPathStatus = statusResponse.data.stations;
  var combinedStationsObj = {};

  for (var i = 0; i < stationsPathStatus.length; i++) {
    var numBikesAvailKey = Object.keys(stationsPathStatus[i])[1];
    var numStationsAvailKey = Object.keys(stationsPathStatus[i])[2];
    var isRentingKey = Object.keys(stationsPathStatus[i])[4];
    var isReturningKey = Object.keys(stationsPathStatus[i])[5];
    combinedStationsObj[stationsPathStatus[i].station_id] = {
      numBikesAvailKey: stationsPathStatus[i].num_bikes_available,
      numStationsAvailKey: stationsPathStatus[i].num_docks_available,
      isRentingKey: stationsPathStatus[i].is_renting,
      isReturningKey: stationsPathStatus[i].is_returning
    };
  }

  // adding info to the already created station object

  var stationsFromInfo = locationResponse.data.stations;

  for (var j = 0; j < stationsFromInfo.length; j++) {

    var key = stationsFromInfo[j].station_id;
    var lonVal = stationsFromInfo[j].lon;
    var latVal = stationsFromInfo[j].lat;
    var nameVal = stationsFromInfo[j].name;

    combinedStationsObj[key].lat = latVal;
    combinedStationsObj[key].lon = lonVal;
    combinedStationsObj[key].name = nameVal;

  }

  stations = combinedStationsObj;

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

function initMap (lat, lng) {

  myLatLng = new google.maps.LatLng(lat, lng);
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: myLatLng
  });

  // instead of a for loop, use map
  // var markers = stations.map(...);
  // markers.forEach(... )

  for (var station in stations) {
    var latitude = (stations[station].lat);
    var lon = (stations[station].lon);
    var name = (stations[station].name);
    var numBikesAvail =  (stations[station].numBikesAvilKey);
    var coordinates = new google.maps.LatLng(latitude, lon);
    mapMarker(map, coordinates, name);
  }

  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'Current Location',
    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  });

  // marker.setMap(map);
  //
  var infowindow = new google.maps.InfoWindow({
    content:'Your current location'
  });

  infowindow.open(map,marker);

  // return the marker from mapMarker

  function mapMarker (map, coordinates, name) {
    new google.maps.Marker({
      position: coordinates,
      map: map,
      title: name,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
    var myLatLng = new google.maps.LatLng(lat, lng);
    var distanceArray = distanceAway(coordinates, myLatLng, name, numBikesAvail);
  }

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

  flightPath.setMap(map);
  // var nearMile = value;
  $('.station').prepend("<div class='col-md-6 text-center'><p> Distance (Miles): </p><p><span class='bold'>" + nearestDistance + "</span></p></div>");
  $('.station').prepend("<div class='col-md-6 text-center'><p> Nearest Station: </p><p class='bold text-center'>" + nearStationName + "</p></div>");
  $('.progress').remove();

}

// Retrieve user location

function geoFindMe() {

  console.log('stations', stations);

  var output = document.getElementById('out');

  if (!navigator.geolocation) {
    output.innerHTML = '<p>Geolocation is not supported by your browser</p>';
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;

    console.log(latitude);
    console.log(longitude);

    initMap(latitude, longitude);
  }

  function error() {
    output.innerHTML = 'Unable to retrieve your location';
  }

  // output.innerHTML = "<p>Locating…</p>";

  navigator.geolocation.getCurrentPosition(success, error);
}

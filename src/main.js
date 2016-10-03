  // global
var stations;
var stationLocal = [];
var distances = [];
var currentLocation;
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
  .then(mergeStationsObj)
  .then(addGoogleMapsScript);

function mergeStationsObj (stationsObj) {

  var stationStatuses = stationsObj[0].data.stations;
  var stationInfos = stationsObj[1].data.stations;

  // creating a new object with status information forEach station
  var combinedStationsObj = {};

  stationStatuses.forEach(function(stationStatus) {
    combinedStationsObj[stationStatus.station_id] = {
        num_bikes_available: stationStatus.num_bikes_available,
        num_docks_available: stationStatus.num_docks_available,
        is_renting: stationStatus.is_renting,
        is_returning: stationStatus.is_returning
    };
  });

  stationInfos.forEach(function(stationInfo) {
    var key = stationInfo.station_id;

    combinedStationsObj[key].lat = stationInfo.lat;
    combinedStationsObj[key].lon = stationInfo.lon;
    combinedStationsObj[key].name = stationInfo.name;
  });

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

function newMap (lat, lng) {
  currentLocation = new google.maps.LatLng(lat, lng);
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: currentLocation
  });
  return map;
}

function newMarker(stationLatLng,map,title,numBikesAvail,name,isReturning,callback,icon) {
  stationLocal.push(new google.maps.Marker({
    position: stationLatLng,
    map: map,
    title: title,
    bikesAvail: numBikesAvail,
    name: name,
    isReturning: isReturning,
    distance: distanceAway(stationLatLng, currentLocation),
    icon: icon,
  }))
}

function distanceAway(stationLatLng, userLocation) {

  return parseFloat((google.maps.geometry.spherical.computeDistanceBetween(
    stationLatLng, userLocation) * 0.000621371).toFixed(2));

}



var greenMarker = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
var blueMarker = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

function initMap (lat, lng) {

  var userLocation = new google.maps.LatLng(lat, lng);
  var map = newMap(lat,lng);
  var marker = newMarker(userLocation, map,'Current Location', greenMarker);

  for (var station in stations) {
    var name = (stations[station].name);
    var numBikesAvail =  (stations[station].num_bikes_available);
    var isReturning =  (stations[station].is_returning) === 1 ? true : false;
    var stationLatLng = new google.maps.LatLng(stations[station].lat, stations[station].lon);
    newMarker(stationLatLng, map, 'station', numBikesAvail, name, isReturning);
  }


  var infowindow = new google.maps.InfoWindow({
    content:'Your current location'
  });

  infowindow.open(map,marker);

  detClosest();
}

function detClosest() {



  var index = 0;
  var value = 100000;

  for (var i = 0; i < stationLocal.length; i++) {
    if (stationLocal[i].distance < value && stationLocal[i].distance > 0) {
      value = stationLocal[i].distance;
      index = i;
    }
  }

  var nearStationName = stationLocal[index].name;
  var nearestDistance = stationLocal[index].distance;
  var nearestLatLon = new google.maps.LatLng(stationLocal[index].lat, stationLocal[index].lon);

  console.log('nearestStationName: ', nearStationName);

  console.log('current location: ', currentLocation, 'nearestLatLon: ', nearestLatLon);

  var pathTo = [currentLocation, nearestLatLon];
  console.log(pathTo);

  var flightPath = new google.maps.Polyline({
    path:pathTo,
    strokeColor:'#BB2034',
    strokeOpacity:0.65,
    strokeWeight:8
  });

  // getMarker(distancesArr[index].stationLatLon.lat(), distancesArr[index].stationLatLon.lng());

  flightPath.setMap(map);
  // var nearMile = value;
  $('.station').prepend("<div class='col-md-6 text-center'><p> Distance (Miles): </p><p><span class='bold'>" + nearestDistance + "</span></p></div>");
  $('.station').prepend("<div class='col-md-6 text-center'><p> Nearest Station: </p><p class='bold text-center'>" + nearStationName + "</p></div>");
  $('.progress').remove();

}

// Retrieve user current location

function geoFindMe() {
  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;

    initMap(latitude, longitude);
  }

  function error() {
    output.innerHTML = 'Unable to retrieve your location';
  }

  navigator.geolocation.getCurrentPosition(success, error);
}

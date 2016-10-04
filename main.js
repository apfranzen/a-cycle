  // global
var stations = [];
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

function mergeStationsObj (stationsArr) {
  console.log('stationsArr: ', stationsArr);

  var stationStatuses = stationsArr[0].data.stations;
  var stationInfos = stationsArr[1].data.stations;

  var combinedStationsArr = [];

  for (var i = 0; i < stationStatuses.length; i++) {

    combinedStationsArr.push(
    {
          station_id: stationStatuses[i].station_id,
          num_bikes_available: stationStatuses[i].num_bikes_available,
          num_docks_available: stationStatuses[i].num_docks_available,
          is_renting: stationStatuses[i].is_renting,
          is_returning: stationStatuses[i].is_returning,
          lat : stationInfos[i].lat,
          lon : stationInfos[i].lon,
          name : stationInfos[i].name

  });
}


  // creating a new object with status information forEach station

  console.log('combinedStationsArr: ', combinedStationsArr);
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

function newMap (currentLocation) {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: currentLocation
  });
  return map;
}

// function newMarker(stationLatLng,map,title,icon,numBikesAvail,name,isReturning,callback) {
//   console.log('isReturning: ', isReturning);
//   stationLocal.push(new google.maps.Marker({
//     position: stationLatLng || null,
//     map: map || null,
//     title: title || null,
//     bikesAvail: numBikesAvail || null,
//     name: name || null,
//     isReturning: isReturning || null,
//     distance: distanceAway(stationLatLng, currentLocation) || null,
//     icon: icon || null
//   }))
// }

// function newMarker(stationLatLng,map,title,icon,numBikesAvail,name,isReturning,callback)

function newMarker(stationLatLng,map,title,icon) {
  new google.maps.Marker({
    position: stationLatLng || null,
    map: map || null,
    title: title || null,
    // bikesAvail: numBikesAvail || null,
    // name: name || null,
    // isReturning: isReturning || null,
    // distance: distanceAway(stationLatLng, currentLocation) || null,
    icon: icon || null
  });
}

function distanceAway(stationLatLng, userLocation) {

  return parseFloat((google.maps.geometry.spherical.computeDistanceBetween(
    stationLatLng, userLocation) * 0.000621371).toFixed(2));

}



var greenMarker = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
var blueMarker = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

function initMap (currentLocation) {

  var map = newMap(currentLocation);
  var marker = newMarker(currentLocation, map,'Current Location');

  var infowindow = new google.maps.InfoWindow({
    content:'Your current location'
  });

  infowindow.open(map,marker);

  // var marker = new google.maps.Marker({
  //   position: currentLocation,
  //   map: map,
  //   title: 'Hello World!'
  // });

  console.log('stationLocal: ', stationLocal);

  for (var station in stations) {
    var name = (stations[station].name);
    var numBikesAvail =  (stations[station].num_bikes_available);
    var isReturning =  (stations[station].is_returning) === 1 ? true : false;
    var stationLatLng = { lat: stations[station].lat, lng: stations[station].lon };
    newMarker(stationLatLng, map, 'station', greenMarker);
  }

  console.log('stations: ', stations[0]);
  detClosest(map);


}

function detClosest(map) {



  var index = 0;
  var value = 100000;

  for (var i = 0; i < stations[0].length; i++) {
    if (stations[0][i].distance < value && stations[0][i].distance > 0) {
      value = stations[0][i].distance;
      index = i;
    }
  }

  var nearStationName = stations[0][index].name;
  var nearestDistance = stations[0][index].distance;
  var nearestLatLon = new google.maps.LatLng(stations[0][index].lat, stations[0][index].lon);

  console.log('nearestStationName: ', nearStationName);

  console.log('current location: ', currentLocation, 'nearestLatLon: ', nearestLatLon);

  // var pathTo = [currentLocation, nearestLatLon];
  var pathTo = [
    {lat: 37.772, lng: -122.214},
    {lat: 21.291, lng: -157.821}
  ]
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
    var lat  = position.coords.latitude;
    var lng = position.coords.longitude;
    currentLocation = {lat: lat, lng: lng}

    initMap(currentLocation);
  }

  function error() {
    output.innerHTML = 'Unable to retrieve your location';
  }

  navigator.geolocation.getCurrentPosition(success, error);
}

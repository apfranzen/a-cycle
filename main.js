  // global
var stations = [];
var stationLocal = [];
var distances = [];
var currentLocation;
var map;
var combinedStationsArr;

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

  geoFindMe().then(promise => console.log(promise));

  // promise.then(function(result) {
  // console.log(result); // "Stuff worked!"
  // }, function(err) {
  //   console.log(err); // Error: "It broke"
  // });
});

// promises.all returns an array with all data from each AJAX call

Promise.all([getBStatus(), getBInfo(), geoFindMe()])
    // .then(geoFindMe)
    // console.log(stationInfo);
    .then(mergeStationsObj)
    // .then(addGoogleMapsScript);


function mergeStationsObj (stationsArr) {
  console.log('stationsArr: ', stationsArr);

  var stationStatuses = stationsArr[0].data.stations;
  var stationInfos = stationsArr[1].data.stations;

  combinedStationsArr = [];

    for (var i = 0; i < stationStatuses.length; i++) {

      combinedStationsArr.push(
      {
            station_id: stationStatuses[i].station_id,
            num_bikes_available: stationStatuses[i].num_bikes_available,
            num_docks_available: stationStatuses[i].num_docks_available,
            is_renting: stationStatuses[i].is_renting,
            is_returning: stationStatuses[i].is_returning,
            lat: stationInfos[i].lat,
            lon: stationInfos[i].lon,
            name: stationInfos[i].name,
            distanceAway: distanceAway(stationInfos[i].lat, stationInfos[i].lon)

      });
    }


  // creating a new object with status information forEach station
  return combinedStationsArr
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

// function addGoogleMapsScript () {
//   console.log('addGoogleMapsScript');
//   var s = document.createElement('script');
//   s.type = 'text/javascript';
//   s.src  = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzaOBIjmRJeiSfhiXhPC4Wo4syHsQG_hc&libraries=geometry';
//   $('head').append(s);
// }

// Passing in lat and lon perameters from geoFindMe

function newMap (currentLocation) {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: currentLocation
  });
  return map;
}

function newMarker(stationLatLng,map,title,icon) {
  new google.maps.Marker({
    position: stationLatLng || null,
    map: map || null,
    title: title || null,
    icon: icon || null
  });
}

// function distanceAway(nearestLatLon, userLocation) {
//
//   console.log('nearestLatLon: ', nearestLatLon);
//   console.log('currentLocation: ', currentLocation);
//
//   return parseFloat((google.maps.geometry.spherical.computeDistanceBetween(
//     nearestLatLon, currentLocation) * 0.000621371).toFixed(2));
//
// }

function distanceAway (lat, lon, unit) {
  console.log('lat: ', lat);
  console.log('lon: ', lon);
  console.log('currentLocation.lat: ', currentLocation.lat);
  console.log('currentLocation.lng: ', currentLocation.lng);

	var radlat1 = Math.PI * lat/180
	var radlat2 = Math.PI * currentLocation.lat/180
	var theta = lon-currentLocation.lng
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return parseFloat(dist.toFixed(2));
}



var greenMarker = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
var blueMarker = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

function initMap (currentLocation) {

  console.log('init map hit');

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


  combinedStationsArr.forEach(function(station) {
    var name = (station.name);
    var numBikesAvail =  (station.num_bikes_available);
    var isReturning =  (station.is_returning) === 1 ? true : false;
    var stationLatLng = { lat: station.lat, lng: station.lon };
    newMarker(stationLatLng, map, name, greenMarker);
  })

  detClosest(map);

}

function detClosest(map) {

  // var distanceArray

  var index = 0;
  var value = 100000;

  combinedStationsArr.forEach(function(station, index) {
    if (station.distance < value && station.distance > 0) {
      value = station.distance;
      index = index;
    }
  })

  var nearStationName = combinedStationsArr[index].name;
  var nearestDistance = combinedStationsArr[index].distance;
  var nearestLatLon = {lat: combinedStationsArr[index].lat, lng: combinedStationsArr[index].lon};
  // var nearestLatLon = new google.maps.LatLng(combinedStationsArr[index].lat, combinedStationsArr[index].lon);

  var pathTo = [
    currentLocation,
    nearestLatLon
  ]

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

// Retrieve user current location

function geoFindMe() {
  return new Promise(function(resolve, reject) {
  // do a thing, possibly async, then…
    return navigator.geolocation.getCurrentPosition(function(position) {
      if(position){
        resolve(position);
      }
      else {
        console.log('not working');
        reject('Not working')
      }
      console.log(position);
        // resolve('success');
    })
  });
}


// return new Promise(
//   function geoFindMe(stationInfo) {
//   console.log('geoFindMe found');
//   function success(position) {
//     console.log('hit geo findMe');
//     var lat  = position.coords.latitude;
//     var lng = position.coords.longitude;
//     currentLocation = {lat: lat, lng: lng};
//     console.log('lat: ', lat);
//
//     resolve(currentLocation);
//   }
//
//   function error() {
//     output.innerHTML = 'Unable to retrieve your location';
//     reject(output.innerHTML)
//   }
//
//   navigator.geolocation.getCurrentPosition();
// })

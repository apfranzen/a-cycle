// Global
var map;
// var getMarker = function (lat, lng){
//   allMarkers.forEach(function(el){
//     if(el.getPosition().lat() == lat && el.getPosition().lng() == lng){
//       el.setAnimation(google.maps.Animation.BOUNCE);
//     }
//   });
// };

// jquery
$(document).ready(function() {
  $('.progress').animate({ width: '100%' }, 4000);
});

// promises.all returns an array with all data from each bCycle AJAX call and get's user location

Promise.all([getBStatus(), getBInfo(), geoFindMe()])
    .then(mergeStationsObj)
    .then(detClosest)
    .then(initMap)


function mergeStationsObj (masterData) {
  console.log('masterData: ', masterData);

  combinedStationsArr = [];

    let stationStatuses =  masterData[0].data.stations;
    let stationInfos = masterData[1].data.stations;
    let currentLocation = masterData[2].coords;

  for (var i = 0; i < stationStatuses.length; i++) {

    for (var j = 0; j < stationInfos.length; j++) {
      if (stationInfos[j].station_id === stationStatuses[i].station_id) {

        combinedStationsArr.push(
        {
              station_id: stationStatuses[i].station_id,
              num_bikes_available: stationStatuses[i].num_bikes_available,
              num_docks_available: stationStatuses[i].num_docks_available,
              is_renting: stationStatuses[i].is_renting,
              is_returning: stationStatuses[i].is_returning,
              lat: stationInfos[j].lat,
              lon: stationInfos[j].lon,
              closestToUser: false,
              name: stationInfos[j].name,
              currentLat: currentLocation.latitude,
              currentLng: currentLocation.longitude,
              distanceAway: distanceAway(stationInfos[j].lat, stationInfos[j].lon, currentLocation.latitude, currentLocation.longitude)

        });
      }
    }
  }
  console.log('combinedStationsArr: ', combinedStationsArr);
  // creating a new object with status information forEach station
  return combinedStationsArr
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

function newMap (currentLocation) {
  console.log('newMap: ', currentLocation);
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: currentLocation
  });
  return map;
}

function newMarker(latLng,map,title,icon,options,closest,userLatLng) {
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    title: title,
    icon: icon
  });

  var infowindow = new google.maps.InfoWindow({
    content:options
  });

  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  if (title === 'Current Location') {
    infowindow.open(map,marker);
  }

  if (closest === true) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    flightPath(latLng, userLatLng)
  }
}

function distanceAway (lat1, lon1, lat2, lon2, unit) {

	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
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

function initMap (combinedStationsArr) {
  let currentLocation =
    {
      lat: combinedStationsArr[0].currentLat,
      lng: combinedStationsArr[0].currentLng
    }

  var map = newMap(currentLocation);
  var marker = newMarker(currentLocation, map,'Current Location',blueMarker,'Current Location');

  // create a marker for all stations
  combinedStationsArr.forEach(function(station) {

    var name = station.name;
    var stationLatLng = { lat: station.lat, lng: station.lon };
    var userLatLng = { lat: station.currentLat, lng: station.currentLng };
    var closestToUser = station.closestToUser;
    var isReturning = (station.is_returning) === 1 ? 'Yes' : 'False'
    var stationData =
    "<ul>" +
      "<li><h4> Station Name: "  + station.name + "</h4></li>" +
      "<li> Number of Bikes Available: " + station.num_bikes_available + "</li>" +
      "<li> Is Station Returning? " + isReturning + "</li>" +
    "</ul>"

    newMarker(stationLatLng, map, name, greenMarker, stationData, closestToUser, userLatLng);

  })

  map = map;
  return combinedStationsArr;
}

function detClosest(combinedStationsArr) {

  console.log(combinedStationsArr);
  var nearestIndex = 0;
  var nearestDistance = 100;
  var nearestStationName = combinedStationsArr[nearestIndex].name;

  combinedStationsArr.forEach(function(station, index) {
    if (station.distanceAway < nearestDistance && station.num_bikes_available > 0) {
      nearestDistance = station.distanceAway;
      nearestIndex = index;
    }
  })
  // change the value of closestToUser to true
  combinedStationsArr[nearestIndex].closestToUser = true;
  console.log('detClosest hit');
  appendHTML(nearestDistance, nearestStationName);
  return combinedStationsArr
}

function appendHTML(nearestDistance, nearestStationName) {
  // append HTML for nearest station
  $('.station').prepend("<div class='col-md-6 text-center'><p> Distance (Miles): </p><p><span class='bold'>" + nearestDistance + "</span></p></div>");
  $('.station').prepend("<div class='col-md-6 text-center'><p> Nearest Station: </p><p class='bold text-center'>" + nearestStationName + "</p></div>");
  $('.progress').remove();
}

function flightPath(nearestLatLng, currentLatLng) {
  console.log('nearestLatLng', nearestLatLng);
  console.log('currentLatLng ', currentLatLng);

  var pathTo = [
    currentLatLng,
    nearestLatLng
  ]

  var flightPath = new google.maps.Polyline({
    path: pathTo,
    strokeColor:'#BB2034',
    strokeOpacity:0.65,
    strokeWeight:8
  });

  flightPath.setMap(map);

}

// Retrieve user current location

function geoFindMe() {
  return new Promise(function(resolve, reject) {
    return navigator.geolocation.getCurrentPosition(function(position) {
      if(position){
        resolve(position);
      }
      else {
        console.log('not working');
        reject('Not working')
      }
    })
  });
}

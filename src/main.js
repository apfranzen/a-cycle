var bcycleLocationLat;
var bcycleLocationLon;

// Your code here!
$(function () {
  console.log("sanity check");
  getBStatus();
  getBStationInfo();
  geoFindMe();
});

function getBStatus() {
  $.ajax ({
    url: 'https://gbfs.bcycle.com/bcycle_denver/station_status.json',
    method: 'GET'
  }).success(function (bStatus){
    // console.log(bStatus);
    // console.log(bStatus.data.stations);
    for (var i = 0; i < bStatus.data.stations.length; i++) {
      var stationID = (bStatus.data.stations[i].station_id);

      var numBikesAvail = (bStatus.data.stations[i].num_bikes_available);

      var numDocksAvail = (bStatus.data.stations[i].num_docks_available);

      // $("#select").append('<option>' + titles + '</option>');
      //img
    }
  });
}

function getBStationInfo() {
  $.ajax ({
    url: 'https://gbfs.bcycle.com/bcycle_denver/station_information.json',
    method: 'GET'
  }).success(function (bStationInfo){
    console.log(bStationInfo.data.stations);
    for (var i = 0; i < bStationInfo.data.stations.length; i++) {
      var address = (bStationInfo.data.stations[i].address);

      var latB = (bStationInfo.data.stations[i].lat);

      var lonB = (bStationInfo.data.stations[i].lon);
      bcycleLocationLat = latB;

      bcycleLocationLon = lonB;

      var stationIdInfo = (bStationInfo.data.stations[i].station_id);

      var numDocksAvail = (bStationInfo.data.stations[i].num_docks_available);
    }
  });
}

// Passing in lat and long perameters from geoFindMe
  function initMap(lat, lng) {
// Passing in lat and long perameters from geoFindMe
  var myLatLng = new google.maps.LatLng(lat, lng);

  var bLatLong = new google.maps.LatLng(bcycleLocationLat, bcycleLocationLon);

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: myLatLng
  });

  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'Hello World!'
  });

  var marker2 = new google.maps.Marker({
    position: bLatLong,
    map: map,
    title: 'B-cycle station'
  });
  console.log('miles apart: ' + (((google.maps.geometry.spherical.computeDistanceBetween(myLatLng, bLatLong))*0.000621371).toFixed(2)));
}

// Retrieve user location

function geoFindMe() {

  var output = document.getElementById("out");

  if (!navigator.geolocation){
    output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;

    // console.log(latitude);
    // console.log(longitude);

    initMap(latitude, longitude);

    // output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';
    //
    // var img = new Image();
    // img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";
    //
    // output.appendChild(img);
  }

  function error() {
    output.innerHTML = "Unable to retrieve your location";
  }

  // output.innerHTML = "<p>Locating…</p>";

  navigator.geolocation.getCurrentPosition(success, error);
}

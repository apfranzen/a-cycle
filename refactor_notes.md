Refactoring entire code to work off the array/object from the initial AJAX calls. Next step is to change the combinedStationsObj into an Array so that I can iterate through it through the remaining scope. The detClosest function need to be rewired to look in the initial Object.
-----
10/6:

The order of operations is getting into trouble. the mergeStations function is trying to call on the lat and lon from the geoFindMe before it is available. Remove the lat and lon from the initial station object construction and try to add the object later.

OR

dial the promise chain in and remove the document.ready to gain more control over order of operations

http-server -p 3000 -c-1 src

- [x] Promise.all run getBStatus, getBInfo, geoFindMe
- [x] .then (mergeData)
- [x] .then (initMap)
  - [ ] add marker for each station and current location
- [ ] .then
- [ ] .then distanceAway
- [ ] .then detClosest
- [ ] .then flightPath
- [ ] .marker bounce
- [ ] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex

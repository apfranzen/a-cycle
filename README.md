# 🚲 Welcome to the *a-cycle* Github Repository!🚲


[Visit the Deployed Website](https://bcycle-app.firebaseapp.com/)

## What is *a-cycle*?
*a-cycle* is an app that makes renting a bicycle easier! By automatically determining which [B-Cycle](https://denver.bcycle.com/) bike sharing station is nearest to your current location, *with a bicycle available*, *a-cycle* fills a void in the official B-cycle app.

### How does it work?
*a-cycle* determines the user's location (either by GPS or IP Address) and then accesses the [B-Cycle](https://denver.bcycle.com/) `API` for the information and status about all 88 B-cycle rental stations. The station with the shortest distance is determined as represented by the bouncing pin and the polyline to the station!

This app has 2 features that set it apart from the Office B-cycle app:
- Instead of having to guess which station is closest to you, the *a-cycle* app determines this for you.
- If a bicycle is not available at the nearest station, *a-cycle* will recommend the next nearest station.

_________
#### To start the server locally

1. run `npm install` in the terminal.
1. run `http-server -p 3000 -c-1 src` in the terminal.
1. copy and paste `http://localhost:3000` to your browser

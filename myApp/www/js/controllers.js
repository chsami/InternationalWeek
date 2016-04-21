angular.module('starter.controllers', [])

.controller('MapController', ['$q', function($scope, $ionicLoading, $q) {
	console.log("loaded.");

    google.maps.event.addDomListener(window, 'load', function() {
		
		 var schipperStraatRegion = [
			{lat: 51.22492769044706, lng: 4.4047611951828},
			{lat: 51.22664102679644, lng: 4.405166208744049},
			{lat: 51.22647977432962, lng: 4.401971697807312},
			{lat: 51.22492769044706, lng: 4.4047611951828}
			//{lat: 51.226554, lng: 4.403657466173172}
		  ];
		  
		  var stops = [
                        {"Geometry":{"Latitude":51.22650,"Longitude":4.40509}},
                        {"Geometry":{"Latitude":51.22653,"Longitude":4.40357}}
                    ] ;
					
					
	var map = new window.google.maps.Map(document.getElementById("map"));
 
 

    // new up complex objects before passing them around
    var directionsDisplay = new window.google.maps.DirectionsRenderer({suppressMarkers: true});
    var directionsService = new window.google.maps.DirectionsService();

    Tour_startUp(stops);

    window.tour.fitBounds(map);
	directionsDisplay.setMap(map);
	
    if (stops.length > 1)
        window.tour.calcRoute(directionsService, directionsDisplay);
	});

	function Tour_startUp(stops) {
		if (!window.tour) window.tour = {
			updateStops: function (newStops) {
				stops = newStops;
        },
        // map: google map object
        // directionsDisplay: google directionsDisplay object (comes in empty)
		

		/*setPosition : function loadMap(mapz, directionsDisplay) {
			setTimeout(function() {
				navigator.geolocation.getCurrentPosition(function(position) {
					var pos = position;
					var myLatlng = new google.maps.LatLng(parseFloat(position.coords.latitude),parseFloat(position.coords.longitude));
					lol = new google.maps.Map(mapz, {
						// Center map (but check status of geocoder)
						center: myLatlng,
						zoom: 8,
						mapTypeId: google.maps.MapTypeId.ROADMAP,
					});
					//map.setZoom(1);
					console.log(pos);
					map.setCenter(pos.coords);
					//map.setOptions(myOptions);
					directionsDisplay.setMap(map);
				}, function(error) {
				
			})
			
			}, 5000);
		},*/
		
        fitBounds: function (map) {
            var bounds = new window.google.maps.LatLngBounds();

            // extend bounds for each record
            angular.forEach(stops, function (key, val) {
                var myLatlng = new window.google.maps.LatLng(key.Geometry.Latitude, key.Geometry.Longitude);
                bounds.extend(myLatlng);
            });
            map.fitBounds(bounds);
        },
        calcRoute: function (directionsService, directionsDisplay) {
            var batches = [];
            var itemsPerBatch = 10; // google API max = 10 - 1 start, 1 stop, and 8 waypoints
            var itemsCounter = 0;
            var wayptsExist = stops.length > 0;

            while (wayptsExist) {
                var subBatch = [];
                var subitemsCounter = 0;

                for (var j = itemsCounter; j < stops.length; j++) {
                    subitemsCounter++;
                    subBatch.push({
						zoom: 2,
                        location: new window.google.maps.LatLng(stops[j].Geometry.Latitude, stops[j].Geometry.Longitude),
                        stopover: true
                    });
                    if (subitemsCounter == itemsPerBatch)
                        break;
                }

                itemsCounter += subitemsCounter;
                batches.push(subBatch);
                wayptsExist = itemsCounter < stops.length;
                // If it runs again there are still points. Minus 1 before continuing to
                // start up with end of previous tour leg
                itemsCounter--;
            }

            // now we should have a 2 dimensional array with a list of a list of waypoints
            var combinedResults;
            var unsortedResults = [{}]; // to hold the counter and the results themselves as they come back, to later sort
            var directionsResultsReturned = 0;

            for (var k = 0; k < batches.length; k++) {
                var lastIndex = batches[k].length - 1;
                var start = batches[k][0].location;
                var end = batches[k][lastIndex].location;

                // trim first and last entry from array
                var waypts = [];
                waypts = batches[k];
                waypts.splice(0, 1);
                waypts.splice(waypts.length - 1, 1);

                var request = {
                    origin: start,
                    destination: end,
                    waypoints: waypts,
                    travelMode: window.google.maps.TravelMode.WALKING
                };
                (function (kk) {
                    directionsService.route(request, function (result, status) {
                        if (status == window.google.maps.DirectionsStatus.OK) {

                            var unsortedResult = { order: kk, result: result };
                            unsortedResults.push(unsortedResult);

                            directionsResultsReturned++;

                            if (directionsResultsReturned == batches.length) // we've received all the results. put to map
                            {
                                // sort the returned values into their correct order
                                unsortedResults.sort(function (a, b) { return parseFloat(a.order) - parseFloat(b.order); });
                                var count = 0;
                                for (var key in unsortedResults) {
                                    if (unsortedResults[key].result != null) {
                                        if (unsortedResults.hasOwnProperty(key)) {
                                            if (count == 0) // first results. new up the combinedResults object
                                                combinedResults = unsortedResults[key].result;
                                            else {
                                                // only building up legs, overview_path, and bounds in my consolidated object. This is not a complete
                                                // directionResults object, but enough to draw a path on the map, which is all I need
                                                combinedResults.routes[0].legs = combinedResults.routes[0].legs.concat(unsortedResults[key].result.routes[0].legs);
                                                combinedResults.routes[0].overview_path = combinedResults.routes[0].overview_path.concat(unsortedResults[key].result.routes[0].overview_path);

                                                combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getNorthEast());
                                                combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getSouthWest());
                                            }
                                            count++;
                                        }
                                    }
                                }
                                directionsDisplay.setDirections(combinedResults);
                                var legs = combinedResults.routes[0].legs;
                                // alert(legs.length);
                                for (var i=0; i < legs.length;i++){
				  var markerletter = "A".charCodeAt(0);
				  markerletter += i;
                                  markerletter = String.fromCharCode(markerletter);
                                  createMarker(directionsDisplay.getMap(),legs[i].start_location,"marker"+i,"some text for marker "+i+"<br>"+legs[i].start_address,markerletter);
                                }
                                var i=legs.length;
                                var markerletter = "A".charCodeAt(0);
			        markerletter += i;
                                markerletter = String.fromCharCode(markerletter);
                                createMarker(directionsDisplay.getMap(),legs[legs.length-1].end_location,"marker"+i,"some text for the "+i+"marker<br>"+legs[legs.length-1].end_address,markerletter);
                            }
                        }
                    });
                })(k);
            }
        }
    };
}
	var infowindow = new google.maps.InfoWindow(
  { 
    size: new google.maps.Size(150,50)
  });

	var icons = new Array();
	icons["red"] = new google.maps.MarkerImage("mapIcons/marker_red.png",
      // This marker is 20 pixels wide by 34 pixels tall.
      new google.maps.Size(20, 34),
      // The origin for this image is 0,0.
      new google.maps.Point(0,0),
      // The anchor for this image is at 9,34.
      new google.maps.Point(9, 34));



	function getMarkerImage(iconStr) {
	   if ((typeof(iconStr)=="undefined") || (iconStr==null)) { 
		  iconStr = "red"; 
	   }
	   if (!icons[iconStr]) {
		  icons[iconStr] = new google.maps.MarkerImage("http://www.google.com/mapfiles/marker"+ iconStr +".png",
		  // This marker is 20 pixels wide by 34 pixels tall.
		  new google.maps.Size(20, 34),
		  // The origin for this image is 0,0.
		  new google.maps.Point(0,0),
		  // The anchor for this image is at 6,20.
		  new google.maps.Point(9, 34));
	   } 
	   return icons[iconStr];

	}
  // Marker sizes are expressed as a Size of X,Y
  // where the origin of the image (0,0) is located
  // in the top left of the image.
 
  // Origins, anchor positions and coordinates of the marker
  // increase in the X direction to the right and in
  // the Y direction down.

	var iconImage = new google.maps.MarkerImage('mapIcons/marker_red.png',
      // This marker is 20 pixels wide by 34 pixels tall.
      new google.maps.Size(20, 34),
      // The origin for this image is 0,0.
      new google.maps.Point(0,0),
      // The anchor for this image is at 9,34.
      new google.maps.Point(9, 34));
	var iconShadow = new google.maps.MarkerImage('http://www.google.com/mapfiles/shadow50.png',
      // The shadow image is larger in the horizontal dimension
      // while the position and offset are the same as for the main image.
      new google.maps.Size(37, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(9, 34));
      // Shapes define the clickable region of the icon.
      // The type defines an HTML &lt;area&gt; element 'poly' which
      // traces out a polygon as a series of X,Y points. The final
      // coordinate closes the poly by connecting to the first
      // coordinate.
  var iconShape = {
      coord: [9,0,6,1,4,2,2,4,0,8,0,12,1,14,2,16,5,19,7,23,8,26,9,30,9,34,11,34,11,30,12,26,13,24,14,21,16,18,18,16,20,12,20,8,18,4,16,2,15,1,13,0],
      type: 'poly'
  };


	function createMarker(map, latlng, label, html, color) {
		// alert("createMarker("+latlng+","+label+","+html+","+color+")");
		var contentString = '<b>'+label+'</b><br>'+html;
		var marker = new google.maps.Marker({
			position: latlng,
			map: map,
			shadow: iconShadow,
			icon: getMarkerImage(color),
			shape: iconShape,
			title: label,
			zIndex: Math.round(latlng.lat()*-100000)<<5
			});
			marker.myname = label;

		google.maps.event.addListener(marker, 'click', function() {
			infowindow.setContent(contentString); 
			infowindow.open(map,marker);
			});
		return marker;
	}
	
	 $scope.map = map;
}])

.controller('DashCtrl', function($scope, $location, $window) {
	console.log($scope);
	$scope.goCulture = function() {
        $window.location.assign('/#/tab/maps');
		
    };
	
})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});


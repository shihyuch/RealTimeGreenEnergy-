/*
 * @file 
 * Server Code 
 *
 * Server code for periodically pulling data from APIs and providing it to infographic layout
 * 
 */
 var express = require('express')
 var app = express()
 var request = require('superagent')
 var gApiToken = process.env.gApiToken
 var async = require('async')
 var appId = process.env.appId
 var cityCoordinates = require('./cities')
 var cities = Object.keys(cityCoordinates)
 var data
 var currentConditions = {}
 var pubnub = require("pubnub")({
 	ssl: true,
 	publish_key   : process.env.publish_key,
 	subscribe_key : process.env.subscribe_key
 });

/*
 * refreshData
 * 
 * Initiates API calls for all cities one my one
 */
 function refreshData () {
 	data = {}
 	var i=0
 	fetch(cities[i], cityCoordinates[cities[i]], i, data)	
 }

/*
 * fetch
 *
 * Runs three async REST API calls to get the current data from
 * - timezone
 * - Sunrise and sunset time
 * - weather data
 *
 * Collates the data into a JSON object and publishes on channel
 * Also, calls recursively for all cities.
 *
 * @param place - city name
 * @param coordinates - latitude and longitude coordinates of the city
 * @param i - city index in the stored city list (cities.js)
 * @param aggregate - aggregated data array for all cities
 * 
 */ 
 function fetch (place, coordinates, i, aggregate) {	
 	async.parallel([
 		function(callback) {
 			request
 			.get('https://maps.googleapis.com/maps/api/timezone/json')
 			.query('location='+coordinates[1]+','+coordinates[0])
 			.query({timestamp: Math.floor(new Date().getTime()/1000)})
 			.query({key: gApiToken})
 			.end(function(err, res){			
 				if(err) { console.log(err); callback(true); return; }
 				obj = res.body;
 				callback(false, obj);				
 			});
 		},
 		function(callback){
 			request
 			.get('http://api.sunrise-sunset.org/json')
 			.query({lat:coordinates[1]})
 			.query({lng: coordinates[0]})
 			.query({formatted: 0})
 			.end(function(err, res){
 				if(err) { console.log(err); callback(true); return; }
 				obj = res.body.results;
 				callback(false, obj);				
 			})
 		},		
 		function(callback){
 			request
 			.get('http://api.openweathermap.org/data/2.5/weather')
 			.query({lat:coordinates[1]})
 			.query({lon: coordinates[0]})
 			.query({APPID: appId})
 			.end(function(err, res){
 				if(err) { console.log(err); callback(true); return; }
 				obj = res.body;
 				callback(false, obj);				
 			})
 		}		
 		],
  /*
   * Collate results
   */
   function(err, results) {
   	if (err) {
   		console.log('Error in fetching from API')
   		return
   	} else {   	
   		try {
   			console.log("Results", JSON.stringify(results));
   		var data = {   		
   			'place': place,
   			'coordinates': [coordinates[1], coordinates[0]],
   			'timeZoneId': results[0].timeZoneId,
   			'sunrise': results[1].sunrise,
   			'sunset': results[1].sunset,
   			'temperature': results[2].main.temp,
   			'wind': results[2].wind.speed,
   			'humidity': results[2].main.humidity,
   			'icon': results[2].weather[0].icon,
   			'description': results[2].weather[0].description
   		};
   		
   		if (i == cities.length -1) {
   			aggregate[place] = data;   		
   			currentConditions = aggregate   		
   			pub(currentConditions)
   		}
   		else {
   			++i
   			console.log('fetching city...', i)
   			aggregate[place] = data;	
   			fetch(cities[i], cityCoordinates[cities[i]], i, aggregate)
   		}		
   		} catch (e) {
   			console.log(e)
   		}	
   		
   	}
   }
   );
}

//This is where periodic update happens, currently set to 15 mins
refreshData()
setInterval(refreshData, 900000)

/*
 *
 * PubNub Subscribe - Listen to requests from client and send them the 
 * current conditions for all cities, without fetching. 
 *
 * Fetch happens only at the predefined regular interval
 */
 pubnub.subscribe({
 	channel: "wnPutTime",
 	callback: function(message) {
 		pub(currentConditions)
 	}
 });

/*
 *
 * PubNub Publish - Publish the updated current conditions for all cities after fetch
 * @param data - current conditions as collated by the fetch method. 
 */

 function pub(data) {	
 	pubnub.publish({
 		channel: 'wnGet',
 		message: data,
 		callback: function(m) {
 			console.log(m)
 		}, 
 		error: function(err) {
 			console.log(err)
 		}
 	})
 };

//Server begins to execute here
app.use(express.static('public'))
app.listen(process.env.PORT || 3000, function() {
	console.log('Weather Now listening on *:', process.env.PORT || 3000)
})
$(function() {
  // CONSTANTS 
  var colorCold = '004BA8'
  var colorHot = 'D7263D'

  //In Celsius
  var minTemp = 0 
  var maxTemp = 50 
  var transitionTemp = 25

  // specify popup options 
  var popupOptions = {
    'maxWidth': '300'    
  }

  var uuid = pubnub.uuid()
  var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp Feedback</a>'
  })

  //To enable multiple popups to be open
  //Ref: http://stackoverflow.com/questions/9047931/leaflet-js-open-all-popup-bubbles-on-page-load/16707921#16707921
  L.Map = L.Map.extend({
    openPopup: function(popup) {
      this._popup = popup
      return this.addLayer(popup).fire('popupopen', {
        popup: this._popup
      })
    }
  })

  var map = L.map('map', {zoomControl: false}).addLayer(mapboxTiles).setView([0, 50], 2)
  map.touchZoom.disable()
  map.doubleClickZoom.disable()
  map.scrollWheelZoom.disable()

//Container to store current weather conditions
  var places = {}
  
  
//Calculate lighter and darker shades for Temp color 
//Source : http://www.sitepoint.com/javascript-generate-lighter-darker-color/
  function colorLuminance(hex, lum) {
    lum = lum || 0
    var rgb = "#",
    c, i
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i * 2, 2), 16)
      c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
      rgb += ("00" + c).substr(c.length)
    }
    return rgb
  }

  /*
  * Function to create the popup html content or secondary card info
  *
  * Uses mustache template for generating HTML
  * @param place - city name
  */
  function getPopup(place) {
    var template = $('#popup').html()
    var timeZoneId = place.timeZoneId
    //var danger_score = (place.temperature - 253.15)/273.15
    var info = {
      place: place.place.split(' ').join(''),
      sunrise: moment(place.sunrise).tz(timeZoneId).format('hh:mm:ss A'),
      sunset: moment(place.sunset).tz(timeZoneId).format('hh:mm:ss A'),
      time: moment().tz(timeZoneId).format('YYYY-MM-DD hh:mm:ss A'),
      temperature: Math.floor(place.temperature - 273.15).toString() + ' \xB0 C',
      summary: place.description,
      danger: ((place.danger - 253.15)/273.15 * 300).toFixed(2).toString() + ' %',
      humidity: place.humidity
    }
    return Mustache.render(template, info)
  }

  /*
  * Function to create the html content or primary card info
  *
  * Uses mustache template for generating HTML
  * @param place - city name
  */
  function getMarker(place) {    
    var template = $('#map-marker').html()
    var weather = {
      place: place.place,
      id: place.place.split(' ').join(''),
      humidity: place.humidity,
      weather: place.icon,
      tempColor: getTempColor(place.temperature)      
    }

    place.temperature - 273.15 < minTemp ? weather.tempSolid = '#'+colorCold : place.temperature -273.15 > maxTemp ? weather.tempSolid = '#'+colorHot : 
    place.wind >= 11 ? weather.wind = 'windHigh' : weather.wind = 'wind'    
    moment(place.sunrise).isBefore(moment()) == moment(place.sunset).isBefore(moment()) ? weather.backgroundColor = 'rgba(0, 0, 0, 0.2)' : weather.backgroundColor = 'rgba(252, 246, 177, 0.6)'
    return Mustache.render(template, weather)
  }

  /*
   * Main rendering function for infographic
   *
   * Render the primary card for each city using the available weather data.
   *
   *
   */ 
  function refreshView() {    
    Object.keys(places).forEach(function(key){  
      var name = key.split(' ').join('')
      var place = places[key]
      $('.'+name).replaceWith(getPopup(place))
      if ($('#'+name).length) {        
        $('#'+name).replaceWith(getMarker(place))  
      }
      else {        
        L.marker(place.coordinates, {
        icon: getIcon(place)
      }).bindPopup(getPopup(place), popupOptions).addTo(map)
      }
    })    
  }

  /*
   *
   * Function for calculating the color gradient for displaying temperature
   *
   *
   */ 
  function getTempColor(temperature) {    
    var tempCelsius = temperature - 273.15
    if (tempCelsius < minTemp || tempCelsius > maxTemp) {
      return 
    }
    return tempCelsius > transitionTemp ? colorLuminance(colorHot, 1 - ((tempCelsius - transitionTemp) / (maxTemp - transitionTemp))) : colorLuminance(colorCold, 1 - ((transitionTemp - tempCelsius) / (transitionTemp - minTemp)))
  }
  
  /*
   * Function to set the icon on mapbox for each city
   *
   * Sets up the class and primary card HTML rendering by calling getmarker ( ) internally.
   * Called only once during initial display of map.
   */
  function getIcon(place) {
    return L.divIcon({
      className: 'div-icon',
      iconSize: [35, 36],
      html: getMarker(place)
    })
  }
  
/*
 *
 * Publish function for getting the weather data for the first time after page load.
 *
 * Called on PubNub Connect.
 */
  function pub() {
    console.log("publishing")
    pubnub.publish({
      channel: "wnPutTime",
      message: {
        'uuid': uuid
      },
      callback: function(m) {
        console.log(m)
      }
    })
  }

//PubNub Subscribe registration
  pubnub.subscribe({
    channel: 'wnGet',
    message: function(message) {      
      places = message
    }, 
    connect: pub,
    error: function(err) {
      console.log(err)
    }
  })  

  //Redraw every second
  window.setInterval(refreshView, 1000)

  // Sample Marker for testing
  var sampleMarker = {
    coordinates: [45, 45],
    place: "San Francisco",
    sunrise: "2015-11-11T00:46:56+00:00",
    sunset: "2015-11-11T12:21:07+00:00",
    temperature: 300.15,
    timeZoneId: "Asia/Calcutta",
    icon: "50n",
    wind: 12,
    humidity: 70  
  }
  
  // Add sample marker to Map
  //L.marker([45, 45], {icon: getIcon(sampleMarker)}).bindPopup(getPopup(sampleMarker), popupOptions).addTo(map)
})

# RealTimeGreenEnergy-
#

##Introduction This project is an attempt to 
(1) Visualize green energy information around the world by real-time way. It is a basic infographic dashboard which is data driven and supports user interactivity. It captures weather data from openweathermap.org and visualizes potential green power  based on weather conditions with a simple interface on top of world map.

(2) Leverage techniques and frameworks taught in the course: down sampling, context, form and D3, respectively.

(3) Really tell a story through data - explore questions about green energy around the world  in a way not traditionally possible


##Steps for hosting

###Prerequisites a) You should have a google developer API access. Update server.js file with API key in line 11.

b)You should have a PubNub account .Update the PubNub publish and subscribe key in server.js line 20,21 & in config.js, Line 1 & 2

c) You should have a API key for http://openweathermap.org/ and update that in server.js in line 13

d) You should have a Mapbox api account and place the api key in config.js , Line 3.

e) You must have Node.js installed on the server where the application will be installed.

###Steps for installing application server

   Change directory to weather-infographic : 'cd weather-infographic'

    Configure the server.js and config.js with the api keys as per the prerequisite section above

    Run the npm package install command to install all dependencies : 'npm install'

    Start the server : 'node server.js'. Optionally, you can run the server under forever to ensure continuous operation.

##Working

    Open the browser and type http://IP-ADDRESS:3000 , where IP-ADDRES can be localhost ( if testing locally) or the actual IP address of the server (if testing remotely). For example, open http://localhost:3000/ at your local computer.

    The webpage will open and display a world map.

    The map will be overlayed with icons that will display the current GREEEN ENERGY RESOURCE conditions for 23 cities across the world.

    Click on any icon for any city to get the current estimated values of power with respect to each natural sources, e.g., water, solar, for that city.

    Keep the webpage open to see the real-time changes in estimated power over a period of time.


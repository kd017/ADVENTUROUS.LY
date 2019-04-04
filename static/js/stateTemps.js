// ===============================================
// Base variable declarations and map setup
// ===============================================
var baseurl = "http://localhost:5000/averages?";
var selectedYear = 2018;
var qurl = baseurl + "year=" + selectedYear;
var yearSlider = document.getElementById("mapYearRange");
var yearOutput = document.getElementById("mapYearLabel");
yearOutput.innerHTML = `Year: ${yearSlider.value}`;

var light = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
});

var statesMap = L.map("map", {
    center: [38,-96],
    zoom: 4,
    layers: [light]
});


function toFahrenheit(temp) {
    return temp * 9 / 5 + 32
}


// States layer that gets updated with the timeline slider
var statesLayer = L.geoJson(statesData, 
    {style: {color: "white", weight: 1, fillColor: "white", fillOpacity: .75}}).addTo(statesMap);


// ===============================================
// States Array Updater
// ===============================================
// Updates the states array with the new api call,
// then allows the color upddater and tooltip
// updater functions to be called.
// ===============================================
var statesArray = [];
function updateTemps(qurl, callback1, callback2) {
    statesArray = [];
    d3.json(qurl).then(function(data) {
        data.forEach(state => {
            statesArray.push(state);
        })
        callback1();
        callback2();
    });
}


// ===============================================
// Color update functions
// ===============================================
// This first one determines which color to return
// based on the temperature.
function selectColor(t) {
    return t > 80 ? "#67000d" :
    t > 70 ? "#a50f15" :
    t > 60 ? "#cb181d" :
    t > 50 ? "#ef3b2c" :
    t > 40 ? "#fb6a4a" :
    t > 30 ? "#fc9272" :
    t > 20 ? "#fcbba1" :
    t > 10 ? "#fee0d2" :
            "#fff5f0";
}


// This loops through the statesArray until it finds
// the correct state, then updates the color based
// on its average temperature for that year.
function updateColors(feature) {
    var t;
    statesArray.some(state => {
        if (state.STATE_NAME === feature.properties.name) {
            t = toFahrenheit(state.TAVG);
            // console.log(t);
        };
    });

    return {
        color: "white",
        weight: 1,
        fillColor: selectColor(t),
        fillOpacity: .8
    }
}


// ===============================================
// Popup updater
// ===============================================
// var newT = 0;
function updatePopup(feature) {
    // console.log(feature.feature)
    var name, year, tavg, tmin, tmax;
    statesArray.some(state => {
        if (state.STATE_NAME === feature.feature.properties.name) {
            // console.log(state)
            name = state.STATE_NAME;
            year = state.DATE;
            tavg = toFahrenheit(state.TAVG);
            tmin = toFahrenheit(state.TMIN);
            tmax = toFahrenheit(state.TMAX);
        };
    });
    return `<h5>${name}</h5>
            <p><b>YEAR:</b> ${year}</p>
            <p><b>TAVG: </b> ${tavg.toFixed(2)}F</p>
            <p><b>TMIN: </b> ${tmin.toFixed(2)}F</p>
            <p><b>TMAX: </b> ${tmax.toFixed(2)}F</p>`;
}




// Initial color updater
updateTemps(qurl, function() {
    statesLayer.setStyle(updateColors);
    },
    function() {
        statesLayer.bindPopup(updatePopup);
    });


// Legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend leaflet-control-layers'),
        temperatures = [0, 10, 20, 30, 40, 50, 60, 70, 80];
        // labels = [];

    div.innerHTML = `<h6>Avg Temp</h6>`
    for (var i = 0; i < temperatures.length; i++) {
        div.innerHTML +=
            '<i style="background:' + selectColor(temperatures[i] + 1) + '"></i> ' +
            temperatures[i] + (temperatures[i + 1] ? '&ndash;' + (temperatures[i + 1] -1) + 'F<br>' : 'F+');
    }

    return div;
};

legend.addTo(statesMap);

// ===============================================
// Slider/Range event listeners
// ===============================================
// oninput to update the display of the selected
// year.  This one is on input to update it in
// real-time as the slider is moved.
yearSlider.oninput = function() {
    yearOutput.innerHTML = `Year: ${this.value}`;
}

// onchange to update the colors of the states.
// This one is on change so that there aren't
// hundreds of API calls as someone drags the 
// slider back and forth.  It makes a pretty
// light show if it is set to oninput though.
yearSlider.onchange = function() {
    selectedYear = this.value;
    qurl = baseurl + "year=" + selectedYear;
    updateTemps(qurl, function() {
        statesLayer.setStyle(updateColors);
    },
    function() {
        statesLayer.closePopup();
        statesLayer.unbindPopup();
        statesLayer.bindPopup(updatePopup);
    });
    
};
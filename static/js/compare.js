default_state1 = 'CA'
default_state2 = 'NY'
default_year1 = '1925'
default_year2 = '2018'


function load_dropdowns() {
    url = "/states"
    d3.json(url).then(states => {
        // <option value="VA">Virginia</option>
        d3.select('#state1').selectAll('option')
            .data(states)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        d3.select('#state2').selectAll('option')
            .data(states)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        d3.select('#state1').property('value', default_state1);
        d3.select('#state2').property('value', default_state2);
    });

    button = d3.select('#filter-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        state1 = d3.select('#state1').property('value');
        state2 = d3.select('#state2').property('value');
        if (!state1) {
            state1 = default_state1;
        }
        if (!state2) {
            state2 = default_state2;
        }

        update_charts(state1, state2);
    });

    button = d3.select('#reset-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        d3.select('#state1').property('value', default_state1);
        d3.select('#state2').property('value', default_state2);
        update_charts(default_state1, default_state2);
    });
}

function load_yr_dropdowns() {
    url = "/years"
    d3.json(url).then(years => {
        // <option value="VA">Virginia</option>
        d3.select('#year1').selectAll('option')
            .data(years)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        d3.select('#year2').selectAll('option')
            .data(years)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        d3.select('#year1').property('value', default_year1);
        d3.select('#year2').property('value', default_year2);
    });

    button = d3.select('#filter-btn-yr')
    button.on('click', function () {
        d3.event.preventDefault();
        year1 = d3.select('#year1').property('value');
        year2 = d3.select('#year2').property('value');
        if (!year1) {
            year1 = default_year1;
        }

        if (!year2) {
            year2 = default_year2;
        }

        update_maps(year1, year2);
    });

    button = d3.select('#reset-btn-yr')
    button.on('click', function () {
        d3.event.preventDefault();
        d3.select('#year1').property('value', default_year1);
        d3.select('#year2').property('value', default_year2);
        update_maps(default_year1, default_year2);
    });
}

function update_charts(state1, state2) {
    url = `/comparestates?state1=${state1}&state2=${state2}`;

    d3.json(url).then(data => {

        data1 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.TMAX * 9 / 5 + 32}; })
        data2 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.TMAX * 9 / 5 + 32}; })
        plotdata1 = [data1, data2]

        MG.data_graphic({
            data: plotdata1,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-1',
            x_label: 'Year',
            y_label: 'Max Temperature (F)',
            xax_format: d3.format('d'),
            xax_count: 20
        });
        d3.select('#compare-temp-heading').text(`Max Temperature - ${state1} vs ${state2}`)

        data3 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.TAVG * 9 / 5 + 32}; })
        data4 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.TAVG * 9 / 5 + 32}; })
        plotdata2 = [data3, data4]

        MG.data_graphic({
            data: plotdata2,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-2',
            x_label: 'Year',
            y_label: 'Avg Temperature (F)',
            xax_format: d3.format('d'),
            xax_count: 20
        });
        d3.select('#compare-avg-heading').text(`Average Temperature - ${state1} vs ${state2}`)


        data5 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.PRCP / 25.4}; })
        data6 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.PRCP / 25.4}; })
        plotdata3 = [data5, data6]

        MG.data_graphic({
            data: plotdata3,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-3',
            x_label: 'Year',
            y_label: 'Precipitation (in)',
            xax_format: d3.format('d'),
            xax_count: 20
        });
        d3.select('#compare-prcp-heading').text(`Precipitation - ${state1} vs ${state2}`)

    });
}

function update_maps(year1, year2) {
    url1 = `/geojson?start=${year1}`;
    url2 = `/geojson?start=${year1}`;

    d3.json(url1).then(data => render_map(data, year1, 'viz-yr-1'))
    d3.json(url2).then(data => render_map(data, year2, 'viz-yr-2'))
}

function render_map(data, year, target) {
   // d3.select(target).html("");

   var map = L.map(target, {
      center: [45.52, -122.67],
      zoom: 13
    });

    L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.streets",
      accessToken: API_KEY
    }).addTo(map);

    map.invalidateSize();
}

load_dropdowns();
update_charts(default_state1, default_state2);

load_yr_dropdowns();
update_maps(default_year1, default_year2);
function render_table(url) {
    if (!url) {
        url = "/geojson?limit=1000";
    }

    d3.json(url).then(data => {
        table_data = data.map(feature => {
            props = feature.properties;
            row = [props.DATE, props.STATION, props.NAME, props.ELEVATION, props.LATITUDE, props.LONGITUDE,
            props.STATE, props.TMAX, props.TMIN, props.TAVG, props.PRCP];
            return row
        })

        tcontainer = d3.select('#table-container');
        tcontainer.html('');
        tcontainer.append('table').attr('id', 'data-table').attr('width', '100%').classed('display compact', true)

        $(document).ready(function () {
            table = $('#data-table')
            if (table && (typeof table.DataTable === 'function')) {
                table.DataTable({
                    data: table_data,
                    autoWidth: false,
                    responsive: true,
                    columns: [
                        { title: "Year", width: "8%" },
                        { title: "Station ID", width: "15%" },
                        { title: "Station Name", width: "23%" },
                        { title: "Elevation", width: "9%" },
                        { title: "Lat.", width: "8%" },
                        { title: "Long.", width: "8%" },
                        { title: "State", width: "9%" },
                        { title: "Max Temp", width: "5%" },
                        { title: "Min Temp", width: "5%" },
                        { title: "Avg. Temp", width: "5%" },
                        { title: "Prcp", width: "5%" }
                    ],
                    "paging": true,
                    stateSave: true
                });
            }
        });
    });
}

function load_dropdowns() {
    url = "/states"
    d3.json(url).then(states => {
        // <option value="VA">Virginia</option>
        state_dd = d3.select('#state')
        state_dd.selectAll('option')
            .data(states)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);
    });

    url = "/years"
    d3.json(url).then(states => {
        // <option value="VA">Virginia</option>
        state_dd = d3.select('#date')
        state_dd.selectAll('option')
            .data(states)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);
    });

    button = d3.select('#filter-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        console.log('SUBMIT CLICKED')
        datevalue = d3.select('#date').property('value');
        statevalue = d3.select('#state').property('value');
        sid = d3.select('#sid').property('value');
        sname = d3.select('#sname').property('value');

        url = "/geojson";
        sep = '?';
        if (datevalue) {
            url += `${sep}start=${datevalue}`;
            sep = '&';
        }
        if (statevalue) {
            url += `${sep}state=${statevalue}`;
            sep = '&';
        }
        if (sid) {
            url += `${sep}station=${sid}`;
            sep = '&';
        }
        if (sname) {
            url += `${sep}name=${sname}`;
            sep = '&';
        }
        url += `${sep}limit=1000`;
        console.log(url)
        render_table(url);
    });

    button = d3.select('#reset-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        console.log('RESET CLICKED')
        d3.select('#date').property('value', '');
        d3.select('#state').property('value', '');
        d3.select('#sid').property('value', '');
        d3.select('#sname').property('value', '');
        render_table();
    });
}

load_dropdowns();
render_table();

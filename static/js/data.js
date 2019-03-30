function render_table(url) {
    if (!url) {
        url = "/geojson";
    }

    try {
        // table = $('#data-table').DataTable({
        //     retrieve: true,
        //     paging: false
        // });
        // if (table) {
        //     table.destroy();
        // }
    }
    catch (err) {
        // ignore 
    }

    d3.json(url).then(data => {
        table_data = data.map(feature => {
            return Object.values(feature.properties)
        })

        tcontainer = d3.select('#table-container');
        tcontainer.html('');
        tcontainer.append('table').attr('id', 'data-table').attr('width', '100%').classed('display', true)

        $(document).ready(function () {
            $('#data-table').DataTable({
                data: table_data,
                columns: [
                    { title: "Date"},
                    { title: "Elevation"},
                    { title: "Latitude"},
                    { title: "Longitude"},
                    { title: "Name"},
                    { title: "Precipitation"},
                    { title: "State"},
                    { title: "Station"},
                    { title: "Avg. Temp"},
                    { title: "Max Temp"},
                    { title: "Min Temp"}
                ]
            });
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
default_state1 = 'CA'
default_state2 = 'NY'


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
    });

    button = d3.select('#filter-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        state1 = d3.select('#state1').property('value');
        state2 = d3.select('#state2').property('value');
        if (state1) {
        }
        else {
            state1 = default_state1;
        }
        if (state2) {
        }
        else {
            state2 = default_state2;
        }

        update_charts(state1, state2);
    });

    button = d3.select('#reset-btn')
    button.on('click', function () {
        d3.event.preventDefault();
        d3.select('#state1').property('value', '');
        d3.select('#state2').property('value', '');
        update_charts(default_state1, default_state2);
    });
}

function update_charts(state1, state2) {
    url = `/comparestates?state1=${state1}&state2=${state2}`;

    d3.json(url).then(data => {

        data1 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.TMAX}; })
        data2 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.TMAX}; })
        plotdata1 = [data1, data2]

        MG.data_graphic({
            data: plotdata1,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-1',
            x_label: 'Year',
            y_label: 'Max Temperature',
            xax_format: d3.format('d'),
            xax_count: 20
        });

        data3 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.TAVG}; })
        data4 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.TAVG}; })
        plotdata2 = [data3, data4]

        MG.data_graphic({
            data: plotdata2,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-2',
            x_label: 'Year',
            y_label: 'Avg Temperature',
            xax_format: d3.format('d'),
            xax_count: 20
        });

        data5 = data.filter(d => d.STATE === state1).map(d => { return {"date":+d.DATE, "value": +d.PRCP}; })
        data6 = data.filter(d => d.STATE === state2).map(d => { return {"date":+d.DATE, "value": +d.PRCP}; })
        plotdata3 = [data5, data6]

        MG.data_graphic({
            data: plotdata3,
            full_width: true,
            height: 300,
            right: 40,
            legend: [state1, state2],
            target: '#viz-3',
            x_label: 'Year',
            y_label: 'Precipitation',
            xax_format: d3.format('d'),
            xax_count: 20
        });

        // plotdata3 = data.map(d => { return {"state":d.STATE, "date":+d.DATE, "value": +d.PRCP}; })
        // MG.data_graphic({
        //     data: plotdata3,
        //     chart_type: 'point',
        //     full_width: true,
        //     height: 300,
        //     right: 10,
        //     legend: [state1, state2],
        //     target: '#viz-3',
        //     x_accessor: 'date',
        //     y_accessor: 'value',
        //     color_accessor: 'state',
        //     color_type:'category',
        //     y_rug: true,
        //     x_label: 'Year',
        //     y_label: 'Precipitation',
        //     xax_format: d3.format('d'),
        //     xax_count: 20,
        //     yay_format: d3.format('d'),
        //     yay_count: 10,
        //     max_x:2018,
        // });
    });
}

load_dropdowns()
update_charts(default_state1, default_state2);
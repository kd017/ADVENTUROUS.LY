# Adventurously Data Access API

## Retrieve list of unique years
This API will be used to render year dropdown in filters
```bash
curl http://localhost:5000/years
```

## Retrieve list of unique stations
This API will be used to render station dropdown in filters
```bash
curl http://localhost:5000/stations
```

## Retrieve list of unique states
This API will be used to render state dropdown in filters
```bash
curl http://localhost:5000/states
```

## Retrieve GEOJSON data
This API is the primary data access API, which takes a filter and returns relevant data in GEOJSON format

Query Parameters Supported:
  1. start - Start Year (if not provided, 2018 will be used as default)
  2. end - End Year (if not provided, it will same as start)
  3. comparewith - year to compare with (end will be ignored, if compare with is provided)
  4. state - 2 letter state abbreviation
  5. station - station ID

* If no parameters are passed, only 2018 data is returned
```bash
curl http://localhost:5000/geojson
```

* If only start year is passed, end will be same as start
```bash
curl http://localhost:5000/geojson?start=1924
```

* If both start and end years are passed, data between those years is returned
```bash
curl http://localhost:5000/geojson?start=1924&end=1926
```

* If both start and comparewith years are passed, data of both those years is returned
```bash
curl http://localhost:5000/geojson?start=1924&comparewith=1926
```

Below filters can be used along with any of the above flavors of year filters and are simply anded to the condtion
* state
```bash
curl http://localhost:5000/geojson?start=1924&end=1926&state=CA
```

* station
```bash
curl http://localhost:5000/geojson?start=1924&end=1926&station=USC00140645
```

## Compare 2 States
This API is used to compare two states. Returns yearly avg for all stations in each state

Query Parameters Supported:
  1. state1 - 2 letter state abbreviation
  2. state2 - 2 letter state abbreviation

If no parameter is passed or just one parameter is passed, default (CA, WY) will be used
```bash
curl http://localhost:5000/comparestates
```

If both parameters are passed, yearly averages for both states are returned
```bash
curl http://localhost:5000/comparestates?state1=CA&state2=WY
```
import os

import pandas as pd
import numpy as np

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, or_, func

from flask import Flask, jsonify, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy
from geojson import Feature, Point, FeatureCollection
from states import *
from flasgger import Swagger
import json
from collections import OrderedDict


app = Flask(__name__)

#################################################
# Database Setup
#################################################

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db/adventurously.sqlite"

db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()

# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
climate_history = Base.classes.CLIMATE_HISTORY


#################################################
# Initialize Swagger for API Documentation
#################################################

app.config['SWAGGER'] = {
    "swagger_version": "2.0",
    "title": "Adventurously API",
    "headers": [
        ('Access-Control-Allow-Origin', '*'),
        ('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS"),
        ('Access-Control-Allow-Credentials', "true"),
    ]
    ,
    "specs": [{
        "version": '1.0.0',
        "title": "Adventurously API",
        "endpoint": 'v1_spec',
        "description": 'This is the version 1 of Adventurously Data Access API',
        "route": '/v1/spec',
        "rule_filter": lambda rule: rule.endpoint.startswith('v1.adv')
    }]
}

swagger = Swagger(app)


##############################
# Utility Methods
##############################

def asdict(elem):
    result = OrderedDict()
    for key in elem.__mapper__.c.keys():
        if getattr(elem, key) is not None:
            result[key] = str(getattr(elem, key))
        else:
            result[key] = getattr(elem, key)
    return result

def asfeature(elem):
    point = Point((elem.LATITUDE, elem.LONGITUDE))
    properties = OrderedDict()
    for key in elem.__mapper__.c.keys():
        if getattr(elem, key) is not None:
            properties[key] = str(getattr(elem, key))
        else:
            properties[key] = getattr(elem, key)
        if key == 'STATE':
            value = properties[key]
            if value in states_map:
                properties['STATE_NAME'] = states_map[value]
            else:
                properties['STATE_NAME'] = 'N/A'

    feature = Feature(geometry=point, properties=properties)
    return feature

def to_array(all):
    v = [ asdict(elem) for elem in all ]
    return v

def to_feature_coll(all):
    v = [ asfeature(elem) for elem in all ]
    return v

def statename(abbr):
    if abbr in states_map:
        return states_map[abbr]

    return 'UT'

def fixstate(abbr):
    if not abbr in states_map:
        return 'UT'

    return abbr

##############################
# Begin API 
##############################


@app.route("/")
@app.route("/home")
@app.route("/index.html")
def index():
    """Return the homepage."""
    return render_template("index.html")

@app.route("/tos")
def tos():
    """Return the apidocs."""
    return redirect("/apidocs")

@app.route("/dashboard.html")
def dashboard():
    """Return the homepage."""
    return render_template("dashboard.html")

@app.route("/data.html")
def data():
    """Return the homepage."""
    return render_template("data.html")


@app.route("/years", methods=['GET'], endpoint="v1.adv.years")
def years():
    """Returns unique year numbers present in the dataset
    ---
    tags:
      - Data Access API
    responses:
      '200':
        description: An array with year numbers. 
        schema:
          type: array
          items:
            type: number
            description: Unique year number
            example: 2018
      '500':
        description: Failure
    """
    distinct_years = db.session.query(climate_history.DATE).distinct().order_by(climate_history.DATE).all()
    return jsonify([year[0] for year in distinct_years])

@app.route("/stations", methods=['GET'], endpoint="v1.adv.stations")
def stations():
    """Returns unique stations present in the dataset
    ---
    tags:
      - Data Access API
    responses:
      '200':
        description: An array with station information. 
        schema:
          type: array
          items:
            type: object
            properties:
               station:
                  type: string
                  description: Station ID
                  example: "US009052008"
               name:
                  type: string
                  description: Station Name
                  example: "SIOUX FALLS ENVIRON. CANADA"
      '500':
        description: Failure
    """
    stations = db.session.query(climate_history.STATION, climate_history.NAME).distinct().order_by(climate_history.STATION).all()
    return jsonify([{"station":station[0], "name":station[1]} for station in stations])

@app.route("/states", methods=['GET'], endpoint="v1.adv.states")
def states():
    """Returns unique list state abbreviations present in the dataset
    ---
    tags:
      - Data Access API
    responses:
      '200':
        description: An array with state abbreviations. 
        schema:
          type: array
          items:
            type: string
            description: Station Abbreviation
            example: AZ
      '500':
        description: Failure
    """
    states = db.session.query(climate_history.STATE).distinct().order_by(climate_history.STATE).all()
    return jsonify([fixstate(state[0]) for state in states])

@app.route("/comparestates", methods=['GET'], endpoint="v1.adv.comparestates")
def comparestates():
    """Returns average weather data for two states for all years.
    ---
    tags:
      - Data Access API
    parameters:
      - in: query
        name: state1
        schema:
          type: string
          description: Abbreviation of state #1
          default: CA
      - in: query
        name: state2
        schema:
          type: string
          description: Abbreviation of state #2
          default: WY
    responses:
      '200':
        description: An array with average weather data. 
        schema:
          type: array
          items:
            type: object
            properties:
               STATE:
                  type: string
                  description: State abbreviation
                  example: AZ
               STATE_NAME:
                  type: string
                  description: State Name
                  example: Arizona
               DATE:
                  type: number
                  description: Date contains only year part (yyyy)
                  example: 2018
               TMAX:
                  type: number
                  description: Average of max temperatures at all stations in the state.
                  example: 20.6
               TMIN:
                  type: number
                  description: Average of min temperatures at all stations in the state.
                  example: -12.7
               TAVG:
                  type: number
                  description: Average of average temperatures at all stations in the state.
                  example: 15.0
               PRCP:
                  type: number
                  description: Average of average precipitation at all stations in the state.
                  example: 760.6
      '500':
        description: Failure
    """
    state1 = request.args.get('state1')
    state2 = request.args.get('state2')

    # Use default if both args are note passed...
    if state1 is None or state2 is None:
        state1 = 'CA'
        state2 = 'WY'

    results = db.session.query(climate_history.STATE, climate_history.DATE, 
                               func.avg(climate_history.TMAX).label('TMAX'),
                               func.avg(climate_history.TMIN).label('TMIN'),
                               func.avg(climate_history.TAVG).label('TAVG'),
                               func.avg(climate_history.PRCP).label('PRCP')).\
                          filter(or_(climate_history.STATE == state1, climate_history.STATE == state2)).\
                          group_by(climate_history.STATE, climate_history.DATE).all()

    return jsonify([{"STATE":fixstate(row[0]), "STATE_NAME":statename(row[0]),"DATE":row[1], "TMAX":row[2], "TMIN":row[3], "TAVG":row[4], "PRCP":row[5]} for row in results])

@app.route("/averages", methods=['GET'], endpoint="v1.adv.averages")
def averages():
    """Returns averages weather data for all states for the specified year or all years (in no parameter is provided)
    ---
    tags:
      - Data Access API
    parameters:
      - in: query
        name: year
        schema:
          type: string
          description: Year number 
          example: 2018
    responses:
      '200':
        description: An array with average weather data.
        schema:
          type: array
          items:
            type: object
            properties:
               STATE:
                  type: string
                  description: State abbreviation
                  example: AZ
               STATE_NAME:
                  type: string
                  description: State Name
                  example: Arizona
               DATE:
                  type: number
                  description: Date contains only year part (yyyy)
                  example: 2018
               TMAX:
                  type: number
                  description: Average of max temperatures at all stations in the state.
                  example: 35.0
               TMIN:
                  type: number
                  description: Average of min temperatures at all stations in the state.
                  example: -12.7
               TAVG:
                  type: number
                  description: Average of average temperatures at all stations in the state.
                  example: 16.9
               PRCP:
                  type: number
                  description: Average of average precipitation at all stations in the state.
                  example: 866.8
      '500':
        description: Failure
    """
    year = request.args.get('year')
    query = db.session.query(climate_history.STATE, climate_history.DATE,
                               func.avg(climate_history.TMAX).label('TMAX'),
                               func.avg(climate_history.TMIN).label('TMIN'),
                               func.avg(climate_history.TAVG).label('TAVG'),
                               func.avg(climate_history.PRCP).label('PRCP')
                               )
    if year is not None:
        query = query.filter(climate_history.DATE == year)

    results = query.group_by(climate_history.STATE, climate_history.DATE).all()

    return jsonify([{"STATE":fixstate(row[0]), "STATE_NAME":statename(row[0]), "DATE":row[1], "TMAX":row[2], "TMIN":row[3], "TAVG":row[4], "PRCP":row[5]} for row in results])

@app.route("/geojson", methods=['GET'], endpoint="v1.adv.geojson")
def geojson():
    """Returns weather data in GeoJSON format.
    ---
    tags:
      - Data Access API
    parameters:
      - in: query
        name: start
        schema:
          type: number
          description: Staring year number 
          default: 2018
      - in: query
        name: end
        schema:
          type: number
          description: Ending year number (defaults to start)
          example: 2018
      - in: query
        name: comparewith
        schema:
          type: number
          description: Year to compare with (end will be ignored, if compare with is provided)
          example: 2018
      - in: query
        name: state
        schema:
          type: string
          description: State abbreviation used to filter
          example: AZ
      - in: query
        name: station
        schema:
          type: string
          description: Station ID
          example: "US009052008"
      - in: query
        name: name
        schema:
          type: string
          description: Station Name
          example: "SIOUX FALLS ENVIRON. CANADA"
      - in: query
        name: limit
        schema:
          type: number
          description: Used to limit number of records returned
          example: 1000
    responses:
      '200':
        description: A GeoJSON feature collection
        schema:
          type: array
          items:
            type: object
            properties:
               type:
                  type: string
                  description: type of GeoJSON element
                  example: "Feature"
               geometry:
                  type: object
                  properties:
                     type:
                        type: string
                        description: type of feature
                        example: "Point"
                     coordinates:
                        type: array
                        minItems: 2
                        maxItems: 2
                        items:
                            type: number
                            description: lat/long
                        example: [10.00, -10.00]
               properties:
                  type: object
                  properties:
                     STATE:
                        type: string
                        description: State abbreviation
                        example: AZ
                     STATE_NAME:
                        type: string
                        description: State 
                        example: Arizona 
                     STATION:
                        type: string
                        description: Station ID
                     NAME:
                        type: string
                        description: Station name
                     DATE:
                        type: number
                        description: Date contains only year part (yyyy)
                        example: 2018
                     TMAX:
                        type: number
                        description: Max temperature at the station
                        example: 26.96
                     TMIN:
                        type: number
                        description: Min temperature at the station
                        example: 7.43
                     TAVG:
                        type: number
                        description: Average temperature at the station
                        example: 17.19
                     PRCP:
                        type: number
                        description: Precipitation at the station
                        example: 353.6
                     ELEVATION:
                        type: number
                        description: Elevation of the station
                        example: 1271.0
                     LATITUDE:
                        type: number
                        description: Latitude
                        example: 32.2553
                     LONGITUDE:
                        type: number
                        description: Longitude
                        example: -109.8369
                     index:
                        type: number
                        description: Index of the record
                        example: 1
      '500':
        description: Failure
    """
    # Query Parameters Supported:
    #   1. start - Start Year (if not provided, 2018 will be used as default)
    #   2. end - End Year (if not provided, it will same as start)
    #   3. comparewith - year to compare with (end will be ignored, if compare with is provided)
    #   4. state - 2 letter state abbreviation
    #   5. station - station ID
    #   6. name - station Name
    #   7. limit - return top n records
    start = request.args.get('start')
    end = request.args.get('end')
    comparewith = request.args.get('comparewith')
    state = request.args.get('state')
    station = request.args.get('station')
    name = request.args.get('name')
    limit = request.args.get('limit')

    if start is None:
        start = 2018
    if end is None and comparewith is None:
        end = start

    query = db.session.query(climate_history)

    if comparewith is None:
        query = query.filter(climate_history.DATE >= start)
    else:
        query = query.filter(or_(climate_history.DATE == start, climate_history.DATE == comparewith))

    if end is not None:
        query = query.filter(climate_history.DATE <= end)
    if state is not None:
        query = query.filter(climate_history.STATE == state)
    if station is not None:
        query = query.filter(climate_history.STATION.like(f'%{station}%'))
    if name is not None:
        query = query.filter(climate_history.NAME.like(f'%{name}%'))
    if limit is not None:
        query = query.limit(int(limit))

    data = query.all()

    return jsonify(to_feature_coll(data))

@app.route("/news", methods=['GET'], endpoint="v1.adv.news")
def news():
    """Returns news items from static content DB
    ---
    tags:
      - Data Access API
    responses:
      '200':
        description: An array of news items
        schema:
          type: array
          items:
            type: object
            properties:
                title:
                    type: string
                    description: Title of the news article
                    example: "Seeking drought relief: The Navajo turn to NASA"
                href: 
                    type: string
                    description: Hyperlink of the news article
                    example: "https://climate.nasa.gov/news/2853/seeking-drought-relief-the-navajo-turn-to-nasa/"
                image: 
                    type: string
                    description: Image of the news article
                    example: "https://climate.nasa.gov/system/news_items/list_view_images/2853_20190322-WildHorses-320x240.jpg"
                index:
                    type: number
                    description: Index in the DB
                    example: 0
                teaser: 
                    type: string
                    description: Teaser of the news article
                    example: "Combining precipitation data from various sources, NASA’s Western Water Applications Office (WWAO), the Navajo Nation and the Desert Research Institute are working together to improve the Navajos’ ability to monitor and report drought."
      '500':
        description: Failure
    """
    engine = create_engine('sqlite:///db/scraped_content.sqlite', echo=False)
    df = pd.read_sql('select * from NEWS', con=engine)

    return jsonify(df.to_dict(orient='records'))


if __name__ == "__main__":
    app.run(debug=True)

import os

import pandas as pd
import numpy as np

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, or_

from flask import Flask, jsonify, render_template, request
from flask_sqlalchemy import SQLAlchemy
from geojson import Feature, Point, FeatureCollection

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

import json
from collections import OrderedDict


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

    feature = Feature(geometry=point, properties=properties)
    return feature

def to_array(all):
    v = [ asdict(elem) for elem in all ]
    return v

def to_feature_coll(all):
    v = [ asfeature(elem) for elem in all ]
    return v

@app.route("/")
@app.route("/home")
def index():
    """Return the homepage."""
    return render_template("index.html")


@app.route("/years", methods=['GET'])
def years():
    distinct_years = db.session.query(climate_history.DATE).distinct().order_by(climate_history.DATE).all()
    return jsonify([year[0] for year in distinct_years])

@app.route("/stations", methods=['GET'])
def stations():
    stations = db.session.query(climate_history.STATION, climate_history.NAME).distinct().order_by(climate_history.STATION).all()
    return jsonify([{"station":station[0], "name":station[1]} for station in stations])

@app.route("/states", methods=['GET'])
def states():
    states = db.session.query(climate_history.STATE).distinct().order_by(climate_history.STATE).all()
    return jsonify([state[0] for state in states])


@app.route("/geojson", methods=['GET'])
def geojson():
    # Query Parameters Supported:
    #   1. start - Start Year (if not provided, 2018 will be used as default)
    #   2. end - End Year (if not provided, it will same as start)
    #   3. comparewith - year to compare with (end will be ignored, if compare with is provided)
    #   4. state - 2 letter state abbreviation
    #   5. station - station ID
    start = request.args.get('start')
    end = request.args.get('end')
    comparewith = request.args.get('comparewith')
    state = request.args.get('state')
    station = request.args.get('station')

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
        query = query.filter(climate_history.STATION == station)

    data = query.all()

    return jsonify(to_feature_coll(data))

if __name__ == "__main__":
    app.run(debug=True)

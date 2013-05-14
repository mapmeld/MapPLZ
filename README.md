# MapPLZ

## What it is

Make Google Maps with psuedocode

Store and fork programs

<img src="http://i.imgur.com/hiIJNjD.png"/>

## MapPLZ Spec

Functions, parameters, and callbacks are essential to JavaScript programming. They are also confusing.

MapPLZ replaces geocoding callbacks, viewports, and other details with a simple syntax. For example, a map centered on San Francisco:

    map
      @ "San Francisco, CA"
    plz

Coordinates are in square brackets, in format [latitude, longitude]. They can be mixed with geocoded coordinates.

    line
      [ 10, 10 ]
      [ 0, 0 ]
      @ "Pittsburgh, PA"
    plz

Parameters can be in any order. The only exception is coordinates in a line or shape.

These two markers are equivalent:

    marker
      @ "San Francisco, CA"
      "Hello World"
    plz
    marker
      "Hello World"
      @ "San Francisco, CA"
    plz

Comments are written between parentheses

    ( comments are written between parentheses )
    map
      ( just like in human language )
      @ "Boston, MA"
    plz

Spellers are welcome to use PLEASE instead of PLZ, but have you noticed the language is called MapPLZ ?

### Maps and Plz

Start your mapping code with:

    map
    plz

Center your map with a written location or coordinates. Here are two examples:

    map
      @ "San Francisco, CA"
    plz

    map
      [ 40, -70 ]
    plz

### Markers

Place a red Google Maps marker at a coordinate:

    marker
      @ "New York City, NY"
    plz
    marker
      [ 40, -70 ]
    plz

Add a popup message:

    marker
      "Write a message"
      [ 40, -70 ]
    plz

### Lines and Shapes

Lines and shapes are similar to markers, but have multiple coordinates:

    line
      [ 10, 10 ]
      [ 0, 0 ]
      @ "Pittsburgh, PA"
      "Write a message"
    plz

You can add a hexadecimal color (such as #f00 or #ff0000) to lines and shapes:

    line
      [ 10, 10 ]
      [ 0, 0 ]
      @ "Pittsburgh, PA"
      "Write a message"
      #f00
    plz

## Setup

### Local

Install packages

    npm install

Start your neo4j server

    neo4j-community-1.8/bin/neo4j start

Start the app

    npm start

### On Heroku

    heroku create APP_NAME
    heroku addons:add neo4j --neo4j-version 1.8
    git push heroku master
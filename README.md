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

If you don't set a center of your map, the viewport will be set to display all markers, lines, and shapes

    map
      line
        @ "San Francisco, CA"
        @ "Santa Cruz, CA"
      plz
      
      line
        @ "San Francisco, CA"
        @ "Berkeley, CA"
      plz
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

You can also use names of <a href="http://www.w3schools.com/cssref/css_colornames.asp">CSS colors</a> (including "orange", "purple", or "silver"). They have to start with a # to be interpreted as colors.

    line
      [ 10, 10 ]
      [ 0, 0 ]
      #purple
    plz

### Buttons

You can add simple on/off buttons which control when layers are displayed on the map:

    map
      button        
        marker
          "MoMA"
          @ "11 W 53rd St, New York City, NY"
        plz
      plz
    plz

Place any markers, lines, and shapes inside 'button ... plz' and they will be controlled by the button.

You can set the color and title of each button.

    button
      #ff00ff
      "Purple Button"
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
# Earthquake map

This uses [OpenLayers](http://openlayers.org) to map data obtained from the [USGS](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) Earthquake GeoJSON feed.

## Display controls

### Use Heatmap
> toggle the display between numerical display and heatmap
### Type
> Data selection: Last Hour, Last Day, Last Week. All maps are updated every 5 minutes.
### Source Map
- There are several different OSM maps you can select from 
  - [Wiki](https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png)
  - [Regular](https://maps-cdn.salesboard.biz/styles/klokantech-3d-gl-style/{z}/{x}/{y}.png)
  - [Black&white](http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png)
  - [Watercolor](http://{a-c}.tile.stamen.com/watercolor/{z}/{x}/{y}.png)

### Show Labels
  Toggle the labels.

## Legend
  The numerical display provides the following informaion:
  
  - **Magnitude**: both the text and size of circle.
  - **Age**: Fades from opaque Red to transparent Blue
  - **Depth**: Size and opacity of the circle border, 1 px = 100 miles

  
---
>> **NOTE:** *Although Redux is part of the install, it is not current in use, but intended for some future enhancements*
# Turf tracker map

## prep data
  - get precinct GeoJSON from https://www.ocvote.com/maps/data/?file=precincts.js
  - get precincts of interest from Google sheet
  - export Google sheet to CSV with columns Id, City, Total
  - filter GeoJSON to include only precincts in sheet: `python filter_geojson.py`
  - convert to TopoJSON with http://mapshaper.org/ (smaller filesizem and fixes "Polygons and MultiPolygons should follow the right-hand rule" error)

## TODO:
  - fix weird geometry
  - mouseover - which fields?
  - legend
  - real data source - update csv field names?
  - permissions - use Google Sheets API with authentication?


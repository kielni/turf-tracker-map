# Turf tracker map

## prep geo data
  - get precinct GeoJSON from https://www.ocvote.com/maps/data/?file=precincts.js ([oc-precincts.json](data/oc-precincts.json)) -- precints are strings with leading 0s
  - get precincts for district from election results: https://www.ocvote.com/maps/bin/get.php?type=results-map&election=pri2018&contest=UNITED%20STATES%20REPRESENTATIVE%2045th%20District&= ([oc-45-results.json](data/oc-45-results.json)) -- precincts are integers
  - filter GeoJSON to include only precincts in sheet: `python filter_geojson.py` ([precincts.json](data/precincts.json))
  - convert to TopoJSON with http://mapshaper.org/ (smaller filesize, fixes "Polygons and MultiPolygons should follow the right-hand rule" error); export to [topo-precincts.json](data/topo-precincts.json)

## prep color data
  - export sheet to csv with `Id,City,Total` columns ([sample.csv](data/sample.csv))

## TODO:
  - mouseover - which fields?
  - real data source - update csv field names?
  - permissions - use Google Sheets API with authentication?


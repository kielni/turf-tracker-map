# Turf tracker map

## prep geo data
  - get precinct GeoJSON from https://www.ocvote.com/maps/data/?file=precincts.js ([oc-precincts.json](data/oc-precincts.json)) -- precints are strings with leading 0s
  - get precincts for district from election results: https://www.ocvote.com/maps/bin/get.php?type=results-map&election=pri2018&contest=UNITED%20STATES%20REPRESENTATIVE%2045th%20District&= ([oc-45-results.json](data/oc-45-results.json)) -- precincts are integers
  - filter GeoJSON to include only precincts in sheet: `python filter_geojson.py` ([precincts.json](data/precincts.json))
  - convert to [TopoJSON](https://github.com/topojson/topojson) with http://mapshaper.org/ (smaller filesize, fixes "Polygons and MultiPolygons should follow the right-hand rule" error); export to [topo-precincts.json](data/topo-precincts.json)

## prep color data

create Google sheet with two adjacent columns
  - `id` must match a unique feature identifier in the GeoJSON
  - `value` must be numeric

## config

create config key with these key/value pairs:

```
key: {
    topoURL: URL to TopoJSON,
    topoObjects: key under objects in topojson,
    featureKey: key of unique feature identifier,
    googleApiKey: Google API key with Sheets API enabled,
    googleClientId: Google OAuth client id,
    sheetId: Google Sheet identifier,
    sheetRange: range containing id, value used to fill features,
}
```

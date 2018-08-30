# Turf tracker map

## prep geo data
  - get precinct GeoJSON from https://www.ocvote.com/maps/data/?file=precincts.js ([oc-precincts.json](data/oc-precincts.json))
  - get precincts for district from election results: https://www.ocvote.com/maps/bin/get.php?type=results-map&election=pri2018&contest=UNITED%20STATES%20REPRESENTATIVE%2045th%20District&= ([oc-45-results.json](data/oc-45-results.json)) -- precincts are integers
  - filter GeoJSON to include only precincts in sheet: `python filter_geojson.py` ([precincts.json](data/precincts.json))
  - convert to [TopoJSON](https://github.com/topojson/topojson) with http://mapshaper.org/ (smaller filesize, fixes "Polygons and MultiPolygons should follow the right-hand rule" error); export to [topo-precincts.json](data/topo-precincts.json)

## prep color data

create Google sheet with two adjacent columns
  - `id` must match a unique feature identifier in the GeoJSON
  - `value`
  - `label` label for tooltip (optional; use `id` if not specified)

## config

create config key with these key/value pairs:

```
key: {
    topoURL: URL to TopoJSON,
    topoObjects: key under objects in topojson,
    topoDocId: Google Drive ID for TopoJSON file,
    geoDocId: Google Drive ID for GeoJSON file,
    featureKey: key of unique feature identifier,
    googleApiKey: Google API key with Sheets API enabled,
    googleClientId: Google OAuth client id,
    sheetId: Google Sheet identifier,
    sheetRange: range containing id, value used to fill features,
    scaleType: numeric or ordinal,
    projection: d3 projection object, to convert geo data to document coordinates (`geoIdentity` if already projected)
}
```

only one of `topoURL`, `topoDocId`, or `geoDocId` should be set


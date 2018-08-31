/*
  add ?v=key to the URL to select which config to use
  default uses OC topo data and a world-viewable sheet containing random data
*/

const CONFIG = {
  default: {
    topoURL: 'data/topo-precincts.json',
    topoObjects: 'precincts',
    featureKey: 'PRECINCT',
    googleApiKey: 'AIzaSyBbFRkJQyz2Vq7p6cMM8TxbTxJjhlKAGMM',
    googleClientId: '347410550467-7dln585kevabrvj7hkmu6mronb40hvof.apps.googleusercontent.com',
    sheetId: '1PBW_ndyLJl70TCJ3i00iQGYoo0it28qKvsA2_BSMbWY',
    sheetRange: 'map_data!B1:C',
    scaleType: 'numeric',
    // California Albers https://bl.ocks.org/mbostock/5562380
    projection: d3.geoAlbers()
      .parallels([34, 40.5])
      .rotate([120, 0]),
  },

  ca45: {
    sheetId: '1Flx8mqYV6Iuh0UOvKzeLVGqXjNlX9HE29ogOn9nU4c4',
    sheetRange: 'map_data!B1:C',
  },

  az: {
    topoDocId: '1LNc8RBq3g5ONgeuoKHU8pa1TFTC39It5',
    topoObjects: 'az_2018_precincts',
    topoURL: null,
    featureKey: 'GISPRECINC',
    sheetId: '1Y4tnSa0Zx8tWRPzoNGnPgMazXE9CCB5CywjaABKJDI0',
    sheetRange: 'az_turf_map!A2:C',
    scaleType: 'ordinal',
    // already projected
    projection: d3.geoIdentity()
  }
};

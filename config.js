/*
  add ?v=key to the URL to select which config to use
  default uses OC topo data and a world-viewable sheet containing random data
*/

const CONFIG = {
  default: {
    topoURL: 'data/ca-45.json',
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
    topoDocId: '1o-iX6TDqzaZhtm4xUFSnXWgZQvey8XKC',
    topoObjects: 'az_2018_precincts',
    topoURL: null,
    featureKey: 'GISPRECINC',
    sheetId: '1YMMSTUieuSbCIfR-Zrn6J8b5uf-ebYELe6H89h_yjk8',
    sheetRange: 'az_turf_map!A2:C',
    scaleType: 'ordinal',
    // already projected, but +y is up in latitude, but svg +y is down
    // https://github.com/d3/d3-geo/issues/68
    projection: d3.geoIdentity().reflectY(true)
  }
};

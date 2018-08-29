var debug;

const CONFIG = {
  default: {
    topoURL: 'data/topo-precincts.json',
    topoObjects: 'precincts',
    featureKey: 'PRECINCT',
    googleApiKey: 'AIzaSyBbFRkJQyz2Vq7p6cMM8TxbTxJjhlKAGMM',
    googleClientId: '347410550467-7dln585kevabrvj7hkmu6mronb40hvof.apps.googleusercontent.com',
    sheetId: '1PBW_ndyLJl70TCJ3i00iQGYoo0it28qKvsA2_BSMbWY',
    sheetRange: 'map_data!B1:C',
  },
};

const configKey = 'default';  // TODO: from URL
const config = CONFIG[configKey];

const dataPromises = [];

/*
  - start loading geo data immediately
  - do Google Auth if needed
  - load sheet data for Sheets API
  - when both data sets loaded, draw map
*/

// start loading geodata
dataPromises.push(d3.json(config.topoURL));

/*
  TODO:
  - update draw map to use config
  - update Google auth to use config (feature id (PrecinctP, PRECINCT), legend)
*/
const drawMap = function(topo, values) {
  const container = d3.select('#map');
  const margin = 20;
  const width = window.innerWidth - (margin * 2);
  const height = window.innerHeight - (margin * 2);

  const geojson = topojson.feature(topo, topo.objects[config.topoObjects]);

  // https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
  const zoomed = function() {
    d3.select('svg g').attr('transform', d3.event.transform);
  }
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed)

  const svg = container.append('svg')
    .attr('height', height)
    .attr('width', width);
  svg.call(zoom);

  // California Albers https://bl.ocks.org/mbostock/5562380
  const projection = d3.geoAlbers()
    .parallels([34, 40.5])
    .rotate([120, 0])
    .fitSize([width - (2 * margin), height - (2 * margin)], geojson)

  const geoGenerator = d3.geoPath()
    .projection(projection);

  // https://github.com/d3/d3-scale-chromatic
  const color = d3.scaleSequential(d3.interpolateGnBu);

  const tooltip = d3.select('body').append('div')
    .attr('class', 'map-tooltip')
    .style('opacity', 0);

  const map = svg.append('g')
    .attr('class', 'precincts')
    .selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('d', geoGenerator)
    .attr('id', (d) => `p${d.properties[config.featureKey]}`)
    .attr('fill', (d) => {
      const key = d.properties[config.featureKey];
      if (!(key in values)) {
        console.log(`${key} missing`);
      }
      return key in values ? color(values[key]) : '#eee';
    })
    .attr('stroke', '#000')
    .on('mouseover', (d) => {
      const key = d.properties[config.featureKey];
      const pct = key in values ? `${Math.round(values[key] * 100)}%` : 'N/A'
      tooltip.transition()
        .duration(200)
        .style('opacity', .95);
      tooltip.html(`${key}: ${pct}`)
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');
      d3.select(`#p${key}`)
        .attr('stroke', '#0000ff')
        .attr('stroke-width', 2);
    })
    .on('mouseout', (d) => {
      d3.selectAll('.precincts path')
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });

  // legend from https://bl.ocks.org/OliverWS/c1f4c521cae9f379c95ace6edc1c5e30
  const legendWidth = 300;
  const x = d3.scaleLinear()
    .domain([0, 100])
    .rangeRound([width - 50 - legendWidth, width - 50]);
  const legend = svg.append('g')
    .attr('class', 'key')
    .attr('transform', 'translate(0,40)');

  const bars = [];
  for (let i = 0; i < 100; i++) {
    bars.push(i);
  }
  legend.selectAll('rect')
    .data(bars)
    .enter().append('rect')
      .attr('height', 8)
      .attr('x', d => x(d))
      .attr('width', legendWidth / bars.length)
      .attr('fill', d => color(d/100.0));

  legend.append('text')
    .attr('class', 'caption')
    .attr('x', x.range()[0])
    .attr('y', -6)
    .attr('fill', '#000')
    .attr('text-anchor', 'start')
    .attr('font-weight', 'bold');

  legend.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(x => `${x}%`)
      .tickValues(x.ticks(11)))
    .select('.domain')
      .remove();
};

const processData = function(data) {
  const [geojson, sheet] = data;
  const values = {};
  sheet.result.values.map((row) => {
    // id, value
    try {
      values[row[0]] = Number.parseFloat(row.Total.replace('%', '')) / 100;
    } catch (e) {
      console.error('error parsing row', row);
    }
  });
  debug = values;
  drawMap(geojson, values);
};

/***
  Google auth for Sheets API
  https://developers.google.com/sheets/api/quickstart/js
***/

const loadSheetsData = function() {
  dataPromises.push(gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetId,
    range: config.sheetRange,
  }));
  Promise.all(dataPromises).then(processData);
};

const updateSigninStatus = function(isSignedIn) {
  $('.error').hide();
  if (isSignedIn) {
    $('#googleAuthorize').hide();
    $('#googleSignout').show();
    $('.alert').hide()
    loadSheetsData();
  } else {
    $('#googleAuthorize').show();
    $('#googleSignout').hide();
    $('.alert').show()
  }
};

const initGoogleClient = function() {
  gapi.client.init({
    apiKey: config.googleApiKey,
    clientId: config.googleClientId,
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    $('#googleAuthorize').on('click', function() {
      gapi.auth2.getAuthInstance().signIn();
    });
    $('#googleSignout').on('click', function() {
      gapi.auth2.getAuthInstance().signOut();
    });
  }).catch(function (e) {
    $('.error').text(`error: ${e.details}`);
    $('.error').show();
  });
};

/***
  load data
***/
/*
d3.queue()
  .defer(d3.json, 'data/topo-precincts.json')  // precincts in topoJSON
  .defer(d3.csv, 'data/sample.csv')  // Id,City,Total
  .await(function (err, geojson, csv) {
    if (err) {
      console.error(err);
      return;
    }
    drawMap(geojson, csv);
  });
*/

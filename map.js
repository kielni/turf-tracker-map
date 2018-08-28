var debug;

/*
  TODO:
  - switch to d3 v5 (with promises)
  - start download of geodata; save promise
  - add promise for sheet data on auth success
  - on Promise.all, draw map
  - create config: topo URL, Google API key, client id, sheet id, sheet range, feature id (PrecinctP, PRECINCT), legend labe,
  - update draw map to use config
  - update Google auth to use config
  - set up sample sheets: post-process sheet data: replace 30, to value

*/
const drawMap = function(precincts, csv) {
  const container = d3.select('#map');
  const margin = 20;
  const width = window.innerWidth - (margin * 2);
  const height = window.innerHeight - (margin * 2);

  const geojson = topojson.feature(precincts, precincts.objects.precincts);

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

  const byId = {}
  const percents = [];
  csv.forEach((row) => {
    // "3059047": remove 30 prefix
    const key = row.Id.replace('30', '')
    if (!key || key === 'Total') {
      return;
    }
    // "80.95%": to decimal percentage
    try {
      const val = Number.parseFloat(row.Total.replace('%', '')) / 100;
      percents.push(val);
      byId[key] = val;
    } catch (e) {
      console.error('error parsing row', row, e);
    }
  });
  debug = byId;

  // https://github.com/d3/d3-scale-chromatic
  const color = d3.scaleSequential(d3.interpolateGnBu);

  const tooltip = d3.select('body').append('div')
    .attr('class', 'map-tooltip')
    .style('opacity', 0);

  geojson.features.forEach((feature) => {
    // numeric only
    feature.properties.key = feature.properties.PrecinctP.replace(/[^\d]/g, '');
  });

  const map = svg.append('g')
    .attr('class', 'precincts')
    .selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('d', geoGenerator)
    .attr('id', (d) => `p${d.properties.PRECINCT}`)
    .attr('fill', (d) => {
      const key = d.properties.key;
      //console.log(`${d.properties.PRECINCT}\t${byId[key]}\t${color(key)}`);
      if (!(key in byId)) {
        console.log(`${key} missing`);
      }
      return key in byId ? color(byId[key]) : '#eee';
    })
    .attr('stroke', '#000')
    .on('mouseover', (d) => {
      const key = d.properties.key;
      const pct = key in byId ? `${Math.round(byId[key] * 100)}%` : 'N/A'
      tooltip.transition()
        .duration(200)
        .style('opacity', .95);
      tooltip.html(`${d.properties.PRECINCT}: ${pct}`)
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');
      d3.select(`#p${d.properties.PRECINCT}`)
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
    .attr('font-weight', 'bold')
    .text('Canvassed');

  legend.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(x => `${x}%`)
      .tickValues(x.ticks(11)))
    .select('.domain')
      .remove();
};

/***
  Google auth for Sheets API
  https://developers.google.com/sheets/api/quickstart/js
***/
const loadSheetsData = function() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1Flx8mqYV6Iuh0UOvKzeLVGqXjNlX9HE29ogOn9nU4c4',
    range: 'map_data!B1:C',
  }).then(function(response) {
    console.log('response=', response);
  });
}

const updateSigninStatus = function(isSignedIn) {
  if (isSignedIn) {
    $('#googleAuthorize').hide();
    $('#googleSignout').show();
    loadSheetsData();
  } else {
    $('#googleAuthorize').show();
    $('#googleSignout').hide();
  }
}

const initGoogleClient = function() {
  console.log('initGoogleClient');
  gapi.client.init({
    apiKey: 'AIzaSyBbFRkJQyz2Vq7p6cMM8TxbTxJjhlKAGMM',
    clientId: '347410550467-7dln585kevabrvj7hkmu6mronb40hvof.apps.googleusercontent.com',
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    $('#googleAuthorize').on('click', function() {
      gapi.auth2.getAuthInstance().signIn();
    });
    $('#googleSignout').on('click', function() {
      gapi.auth2.getAuthInstance().signOut();
    });
  });
}

/***
  load data
***/
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

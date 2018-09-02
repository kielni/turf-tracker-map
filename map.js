/* global Vue d3 topojson gapi CONFIG $ */

const match = window.location.href.match(new RegExp(/v=(\w+)/));
const configKey = match && CONFIG[match[1]] ? match[1] : 'default';
const config = Object.assign(CONFIG.default, CONFIG[configKey]);


/*
  - start loading geo data immediately if it's a URL
  - do Google Auth for access to Drive (geodata) and/or Sheets (color mapping)
  - load color mapping from Sheets API
  - load topo data from Drive API (if config.topoDocId || config.geoDocId)
  - set values and labels on geo features from sheet data
  - draw map from geodata
*/

/* ***
  Google auth for Sheets and Drive API
  https://developers.google.com/sheets/api/quickstart/js
*** */
Vue.component('google-auth', {
  data: function data() {
    return {
      authorized: false,
      error: null,
    };
  },

  mounted: function mounted() {
    gapi.load('client:auth2', this.initGoogleClient);
  },

  methods: {
    initGoogleClient: function initGoogleClient() {
      // init Google API client
      gapi.client.init({
        apiKey: config.googleApiKey,
        clientId: config.googleClientId,
        discoveryDocs: [
          'https://sheets.googleapis.com/$discovery/rest?version=v4',
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
      }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
        this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      }).catch((e) => {
        console.error(e);
        this.error = `error: ${e.details}`;
      });
    },

    signIn: function signIn() {
      gapi.auth2.getAuthInstance().signIn();
    },

    signOut: function signOut() {
      gapi.auth2.getAuthInstance().signOut();
    },

    updateSigninStatus: function updateSigninStatus(isSignedIn) {
      this.error = null;
      this.authorized = isSignedIn;
      this.$emit('authorized', isSignedIn);
    },
  },

  template: '#google-auth-template',
});

const app = new Vue({ // eslint-disable-line no-unused-vars
  data: {
    error: null,
    authorized: false,
    // data
    dataPromises: [null, null],
    geo: {},
    // map
    geoGenerator: null,
    colorScale: null,
    mapG: null,
    svg: null,
    mapReady: false,
    mapWidth: 0,
    mapHeight: 0,
    nonWord: new RegExp('[\W ]', 'g'), // eslint-disable-line no-useless-escape
  },

  el: '#app',

  created: function created() {
    // start loading geodata if it's a URL
    if (config.topoURL) {
      this.dataPromises[0] = d3.json(config.topoURL);
    }
  },

  methods: {
    /* ***
      load and process data
    *** */

    loadSheetData: function loadSheetData() {
      return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: config.sheetId,
        range: config.sheetRange,
      });
    },

    loadGoogleData: function loadGoogleData() {
      const docId = config.topoDocId || config.geoDocId;

      if (docId) {
        // authorized HTTP GET request to the file's resource URL
        this.dataPromises[0] = gapi.client.drive.files.get({
          fileId: docId,
          alt: 'media',
        });
      }
      this.dataPromises[1] = this.loadSheetData();
      Promise.all(this.dataPromises).then((data) => {
        this.geo = this.processGeo(data[0]);
        this.processSheet(data[1]);
        this.drawMap();
      }).catch((e) => {
        console.error(e);
        this.error = `error: ${e.result.error.message}`;
      });
    },

    processGeo: function processGeo(geo) {
      // parse string data from Google Drive API
      const data = (config.topoDocId || config.geoDocId) ? JSON.parse(geo.body) : geo;

      // geoDocId is already geoJSON
      // otherwise convert topoJSON to geoJSON
      return config.geoDocId ? data : topojson.feature(data, data.objects[config.topoObjects]);
    },

    processSheet: function processSheet(sheet) {
      const mapping = {};

      // parse sheet data into map: { id: { value: x, label: y} }
      sheet.result.values.forEach((row) => {
        // id, value, [label]
        const id = `${row[0]}`; // cast to string
        let val = row[1];

        // if it looks like a number, try to parse it
        if (val.match(/^[\d\.%]+$/)) { // eslint-disable-line no-useless-escape
          try {
            val = Number.parseFloat(val.replace('%', '')) / 100;
          } catch (e) {
            console.error('error parsing row', row);

            return;
          }
        }
        mapping[id] = { value: val };
        if (row.length > 2) {
          mapping[id].label = row[2];
        }
      });

      // add value and label to geo features
      this.geo.features.forEach(function feature(f) {
        const key = f.properties[config.featureKey];

        if (key in mapping) {
          f.properties.ttValue = mapping[key].value;
          f.properties.ttLabel = mapping[key].label || key;
        } else {
          f.properties.ttValue = null;
          f.properties.ttLabel = key;
        }
      });
    },

    /* ***
      draw map from geodata
    *** */

    drawMap: function drawMap() {
      const container = d3.select('#map');
      const margin = 10;

      this.mapWidth = window.innerWidth - (margin * 2);
      this.mapHeight = window.innerHeight - (margin * 2);

      // https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
      const zoomed = function zoomed() {
        d3.select('svg g').attr('transform', d3.event.transform);
      };
      const zoom = d3.zoom()
        .scaleExtent([1, 100])
        .on('zoom', zoomed);

      // create projection and geo generator
      const projection = config.projection
        .fitSize([this.mapWidth, this.mapHeight], this.geo);

      this.geoGenerator = d3.geoPath()
        .projection(projection);

      // create scale: ordinal or sequential
      if (config.scaleType === 'ordinal') {
        // https://jnnnnn.blogspot.com/2017/02/distinct-colours-2.html
        const colors = [
          '#1b70fc', '#faff16', '#d50527', '#158940', '#f898fd', '#24c9d7', '#cb9b64',
          '#866888', '#22e67a', '#e509ae', '#9dabfa', '#437e8a', '#b21bff', '#ff7b91',
          '#94aa05', '#ac5906', '#82a68d', '#fe6616', '#7a7352', '#f9bc0f', '#b65d66',
          '#07a2e6', '#c091ae', '#8a91a7', '#88fc07', '#ea42fe', '#9e8010', '#10b437',
          '#c281fe', '#f92b75', '#07c99d', '#a946aa', '#bfd544', '#16977e', '#ff6ac8',
          '#a88178', '#5776a9', '#678007', '#fa9316', '#85c070',
        ];

        this.colorScale = d3.scaleOrdinal()
          .range(colors)
          .domain(this.colorDomain(this.geo));
      } else {
        // https://github.com/d3/d3-scale-chromatic
        this.colorScale = d3.scaleSequential(d3.interpolateGnBu);
      }

      // create svg with g and tooltip containers
      this.svg = container.append('svg')
        .attr('height', this.mapHeight)
        .attr('width', this.mapWidth);

      this.svg.call(zoom);
      this.mapG = this.svg.append('g')
        .attr('class', 'precincts');
      this.tooltip = d3.select('#map').append('div')
        .attr('class', 'map-tooltip')
        .style('opacity', 0);

      // draw paths from data
      this.updateMap();

      if (config.scaleType === 'numeric') {
        this.numericLegend();
      }
    },

    updateMap: function updateMap() {
      const features = this.mapG.selectAll('path')
        .data(this.geo.features, d => d.properties[config.featureKey]);

      /* eslint-disable indent */ // for d3 convention
      features.enter().append('path')
          .attr('d', this.geoGenerator)
          .attr('id', d => `p${this.cssId(d.properties[config.featureKey])}`)
          .attr('stroke', '#000')
          .attr('stroke-width', 0.5)
          .on('mouseover', (d) => {
            // show tooltip with value and label and highlight with thick blue border
            d3.event.stopPropagation();
            let val = d.properties.ttValue !== null ? d.properties.ttValue : 'N/A';
            const label = d.properties.ttLabel;

            if (config.scaleType === 'numeric' && val !== 'N/A') {
              val = `${Math.round(val * 100)}%`;
            } else if (!val) {
              val = 'N/A';
            }
            const html = `${label}: ${val}`;

            this.tooltip.transition()
              .duration(500)
              .style('opacity', 0.95)
              .style('height', html.length > 18 ? '40px' : '20px');
            this.tooltip.html(html)
              .style('left', `${d3.event.pageX}px`)
              .style('top', `${d3.event.pageY - 28}px`);
            d3.select(`#p${this.cssId(d.properties[config.featureKey])}`)
              .attr('stroke', '#0000ff')
              .attr('stroke-width', 2);
          })
          .on('mouseleave', () => {
            d3.event.stopPropagation();
            // reset border and hide tooltip
            d3.selectAll('.precincts path')
              .attr('stroke', '#000')
              .attr('stroke-width', 0.5);
            this.tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          })
        .merge(features)
          .attr('fill', (d) => {
            if (d.properties.ttValue !== null) {
              return this.colorScale(d.properties.ttValue);
            }
            console.log(`${d.properties[config.featureKey]} missing`);

            return '#eee';
          });
      /* eslint-enable indent */
      this.mapReady = true;
    },

    numericLegend: function numericLegend() {
      // https://bl.ocks.org/OliverWS/c1f4c521cae9f379c95ace6edc1c5e30
      const legendWidth = 300;
      const x = d3.scaleLinear()
        .domain([0, 100])
        .rangeRound([this.mapWidth - 50 - legendWidth, this.mapWidth - 50]);
      const legend = this.svg.append('g')
        .attr('class', 'key')
        .attr('transform', 'translate(0,40)');
      const bars = [];

      for (let i = 0; i < 100; i += 1) {
        bars.push(i);
      }
      legend.selectAll('rect')
        .data(bars)
        .enter().append('rect')
        .attr('height', 8)
        .attr('x', d => x(d))
        .attr('width', legendWidth / bars.length)
        .attr('fill', d => this.colorScale(d / 100.0));

      legend.append('text')
        .attr('class', 'caption')
        .attr('x', x.range()[0])
        .attr('y', -6)
        .attr('fill', '#000')
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold');

      legend.call(
        d3.axisBottom(x)
          .tickSize(13)
          .tickFormat(tickX => `${tickX}%`)
          .tickValues(x.ticks(11)))
        .select('.domain')
        .remove();
    },

    refresh: function refresh() {
      this.mapReady = false;
      // reload data from sheet, update values, and update map fill
      this.loadSheetData().then((sheet) => {
        this.processSheet(sheet);
        if (config.scaleType === 'ordinal') {
          this.colorScale.domain(this.colorDomain());
        }
        this.updateMap();
      });
    },

    colorDomain: function colorDomain() {
      // get unique values for categorical scale domain
      const values = this.geo.features.map(f => f.properties.ttValue);
      const uniq = Array.from(new Set(Object.values(values))).sort();

      return uniq[0] === '' ? uniq.slice(1) : uniq;
    },

    cssId: function cssId(val) {
      return val.replace(this.nonWord, '-');
    },

    updateAuthStatus: function updateAuthStatus(authorized) {
      this.authorized = authorized;
    },
  },

  watch: {
    authorized: function authorized(isAuthorized) {
      if (!isAuthorized) {
        return;
      }
      // sign out button top right
      this.$nextTick(() => {
        $('.sign-out').css('left', `${window.innerWidth - 80}px`);
      });
      this.loadGoogleData();
    },
  },
});

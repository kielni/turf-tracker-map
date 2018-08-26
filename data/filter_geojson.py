import csv
import json

def main():
    precincts = set()
    with open('turf.csv') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            precincts.add(row[0])

    with open('oc_precincts.json') as jsonfile:
        geo = json.load(jsonfile)
    keep = {
        'type': 'FeatureCollection',
        'name': geo['name'],
        'features': []
    }
    for feature in geo['features']:
        valid = True
        precinct = feature['properties']['PRECINCT']
        turf_precinct = '30%s' % feature['properties']['PRECINCT']
        if turf_precinct not in precincts:
            continue
        #print('%s coordinates=%s' % (precinct, len(feature['geometry']['coordinates'])))
        if len(feature['geometry']['coordinates']) > 1:
            print('updating coordinates for %s' % precinct)
            feature['geometry']['coordinates'] = [feature['geometry']['coordinates']]
        for coord in feature['geometry']['coordinates'][0]:
            try:
                val = float(coord[0])
                val = float(coord[1])
            except:
                valid = False
                print('%s invalid coord %s' % (precinct, coord))
        if not valid:
            print('%s invalid' % precinct)
            continue
        keep['features'].append(feature)

    with open('precincts.json', 'w') as jsonfile:
        jsonfile.write(json.dumps(keep))

if __name__ == '__main__':
    main()

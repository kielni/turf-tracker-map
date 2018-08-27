import csv
import json

def main():
    precincts = set()
    # list of precincts to keep, one per line
    with open('precincts.csv') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            precincts.add(int(row[0]))

    # all OC precincts, from https://www.ocvote.com/maps/data/?file=precincts.js
    with open('oc_precincts.json') as jsonfile:
        geo = json.load(jsonfile)
    keep = {
        'type': 'FeatureCollection',
        'name': geo['name'],
        'features': []
    }
    keep_ids = set()
    for feature in geo['features']:
        precinct = int(feature['properties']['PRECINCT'])
        if str(precinct) != feature['properties']['PRECINCT']:
            print('precinct mismatch: %s\t%s' % (precinct, feature['properties']['PRECINCT']))
        if precinct not in precincts or precinct in keep_ids:
            continue
        print('%s\t%s' % (precinct, len(keep_ids)))
        keep_ids.add(precinct)
        feature['properties']['precinctNum'] = precinct
        keep['features'].append(feature)

    with open('precincts.json', 'w') as jsonfile:
        jsonfile.write(json.dumps(keep))
    print('wrote %s features to precincts.json' % len(keep['features']))

if __name__ == '__main__':
    main()

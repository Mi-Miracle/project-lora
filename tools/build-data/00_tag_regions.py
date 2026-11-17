import json, collections
import sys
d = json.load(open(sys.argv[1]))
w = json.load(open(sys.argv[2]))
AR = {t['a3']: t['ar'] for t in w['T']}
AR.update({'SGP': 730, 'MLT': 316, 'BHR': 780})
mine = set(AR)
MAP = {'KOS': 'KSV', 'SDS': 'SSD', 'PSX': 'PSE', 'SAH': 'ESH', 'CYN': 'NCY', 'KAS': 'IND', 'KAB': 'KAZ', 'ESB': 'CYP', 'WSB': 'CYP', 'HKG': 'CHN',
       'ALD': 'FIN', 'GIB': 'GBR', 'MAF': 'FRA', 'SXM': 'NLD', 'CUW': 'NLD', 'ABW': 'NLD', 'VIR': 'USA', 'ASM': 'USA', 'MNP': 'USA', 'UMI': 'USA',
       'PYF': 'FRA', 'WLF': 'FRA', 'SPM': 'FRA', 'AIA': 'GBR', 'BMU': 'GBR', 'TCA': 'GBR', 'MSR': 'GBR', 'SHN': 'GBR', 'IOA': 'GBR', 'COK': 'NZL', 'USG': 'USA'}
KEEP = {'USA', 'RUS', 'TUR', 'IND', 'CHN', 'BRA', 'UKR', 'DEU', 'POL', 'CAN', 'AUS', 'MEX', 'IDN', 'IRN', 'ARG', 'KAZ'}
ONE = {'SGP', 'MLT', 'BHR', 'LUX', 'PSE', 'KSV', 'NCY', 'SOL', 'ESH', 'FLK', 'ATF', 'NCL', 'PRI', 'QAT', 'BRN', 'TLS', 'CYP'}
by = collections.defaultdict(list)
for x in d['features']:
    p = x['properties']; a = MAP.get(p['adm0_a3'], p['adm0_a3'])
    if p['name'] in ('Crimea', 'Sevastopol'): a = 'UKR'
    if a in mine: by[a].append(x)
out = []; modes = {}
for a, fs in by.items():
    area = AR.get(a, 1e9)
    regs = [x['properties'].get('region') for x in fs]
    rg = set(r for r in regs if r)
    if area < 22000 or a in ONE: mode = 'one'
    elif len(fs) > 40 and a not in KEEP and 4 <= len(rg) <= 45 and sum(1 for r in regs if r) > len(fs) * 0.7: mode = 'region'
    else: mode = 'adm1'
    modes[a] = mode
    for x in fs:
        p = x['properties']
        if mode == 'one': gid = a; nm = ''
        elif mode == 'region': r = p.get('region') or p.get('name_uk') or p.get('name') or p.get('adm1_code') or 'X'; gid = a + ':' + r; nm = r
        else: gid = a + ':' + (p.get('adm1_code') or p['name']); nm = p.get('name_uk') or p.get('name') or ''
        if a == 'UKR' and p['name'] == 'Kiev City': nm = 'Київ (місто)'
        if a == 'UKR' and p['name'] == 'Kiev': nm = 'Київська область'
        nm = nm.replace(' область', ' обл.') if nm else nm
        x['properties'] = {'gid': gid, 'cc': a, 'nm': nm}
        out.append(x)
print('features', len(out), 'groups', len(set(x['properties']['gid'] for x in out)))
print(collections.Counter(modes.values()))
json.dump({'type': 'FeatureCollection', 'features': out}, open(sys.argv[3], 'w'))

#!/usr/bin/env python3
"""Fail closed for store preparation. This is a bookkeeping gate, not a legal opinion."""
import pathlib,json,sys
root=pathlib.Path(__file__).resolve().parents[1]
record=json.loads((root/'rights/clearance.json').read_text())
required={'board-and-expression','brand-search','patent-scope','media-distribution','third-party-code','release-review'}
items=record.get('items',[])
assert len(items)==len(required) and {x['id'] for x in items}==required, 'Incomplete rights register'
open_items=[]
for item in items:
    evidence=item.get('evidence')
    exists=bool(evidence) and (root/'rights'/evidence).resolve().is_file()
    if item.get('status')!='reviewed' or not exists: open_items.append(item['id'])
if open_items:
    print('STORE PREPARATION BLOCKED: '+', '.join(open_items))
    print('Development/simulator play remains available. This check does not grant legal clearance.')
    sys.exit(2)
print('Recorded reviews present; this is not a guarantee of non-infringement or App Store approval.')

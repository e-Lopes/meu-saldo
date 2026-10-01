"""Restore signing credentials from Actions secrets without logging them."""
import base64
import os
from pathlib import Path

root = Path(__file__).resolve().parent.parent
names = ['MEUSALDO_KEYSTORE_BASE64', 'MEUSALDO_STORE_PASSWORD', 'MEUSALDO_KEY_ALIAS', 'MEUSALDO_KEY_PASSWORD']
values = {name: os.environ.get(name, '').rstrip('\r\n') for name in names}
if any(not values[name] for name in names):
    raise SystemExit('Configure the four Android signing secrets before publishing a release.')
if any('\n' in values[name] or '\r' in values[name] or '\\' in values[name] for name in names[1:]):
    raise SystemExit('Signing properties must not contain newlines or backslashes.')
key = root / '.tools/github-release.jks'
key.parent.mkdir(parents=True, exist_ok=True)
key.write_bytes(base64.b64decode(values[names[0]], validate=True))
key.chmod(0o600)
properties = root / 'keystore.properties'
properties.write_text('storeFile=.tools/github-release.jks\n'
                      + 'storePassword=' + values[names[1]] + '\n'
                      + 'keyAlias=' + values[names[2]] + '\n'
                      + 'keyPassword=' + values[names[3]] + '\n', encoding='utf-8')
properties.chmod(0o600)
print('Original signing key configured.')

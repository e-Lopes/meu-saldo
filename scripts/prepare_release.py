"""Prepare public release assets and refuse unsigned/mismatched APKs."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apk', required=True, type=Path)
    parser.add_argument('--aapt', required=True)
    parser.add_argument('--apksigner', required=True)
    parser.add_argument('--repository', default='e-Lopes/meu-saldo')
    parser.add_argument('--output', type=Path, default=ROOT / '.dist' / 'release')
    parser.add_argument('--tag')
    args = parser.parse_args()
    if args.repository != 'e-Lopes/meu-saldo':
        raise SystemExit('Repository must match the update URL compiled into the app.')
    config = json.loads((ROOT / 'app.json').read_text(encoding='utf-8'))['expo']
    version = config['version']
    code = config['android']['versionCode']
    package = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', version) or package['version'] != version:
        raise SystemExit('Keep app.json and package.json versions aligned using X.Y.Z.')
    if config['android']['package'] != 'br.com.meusaldo' or not isinstance(code, int) or code < 1:
        raise SystemExit('Keep the original package and use a positive Android versionCode.')
    tag = f'v{version}'
    if args.tag and args.tag != tag:
        raise SystemExit(f'Tag must be {tag}; update the Android version before publishing.')
    badging = subprocess.check_output([str(Path(args.aapt).resolve()), 'dump', 'badging', str(args.apk.resolve())], text=True, encoding='utf-8')
    if not re.search(rf"package: name='br.com.meusaldo' versionCode='{code}' versionName='{re.escape(version)}'", badging):
        raise SystemExit('APK and source versions do not match.')
    minimum = int(re.search(r"sdkVersion:'(\d+)'", badging).group(1))
    if minimum != 26:
        raise SystemExit('The APK must continue supporting Android 8 (minSdk 26).')
    if args.apk.stat().st_size > 100_000_000:
        raise SystemExit('APK exceeds the 100 MB limit supported by the version 1.2 updater.')
    certs = subprocess.check_output([str(Path(args.apksigner).resolve()), 'verify', '--print-certs', str(args.apk.resolve())], text=True, encoding='utf-8')
    fingerprint = re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]{64})', certs).group(1).lower()
    expected = (ROOT / 'release/signing-certificate.sha256').read_text().strip().lower()
    if fingerprint != expected:
        raise SystemExit('APK signature differs from the original release key. Do not distribute.')
    notes = (ROOT / 'release/notes.md').read_text(encoding='utf-8').strip()
    if len(notes) > 10000:
        raise SystemExit('Release notes exceed the supported size.')
    with args.apk.open('rb') as apk_file:
        digest = hashlib.file_digest(apk_file, 'sha256').hexdigest()
    args.output.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.apk, args.output / 'meu-saldo.apk')
    manifest = dict(versionCode=code, versionName=version, minSdk=minimum,
                    apkUrl=f'https://github.com/{args.repository}/releases/download/{tag}/meu-saldo.apk',
                    sha256=digest, sizeBytes=args.apk.stat().st_size, notes=notes)
    (args.output / 'update.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{tag}: signed APK and update.json prepared in {args.output}')


if __name__ == '__main__':
    main()

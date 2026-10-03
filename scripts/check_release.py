"""Skip published versions before starting an automatic Android build."""
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def release_required(version, releases):
    if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', version):
        raise ValueError('Use a version in X.Y.Z format.')
    tag = f'v{version}'
    for release in releases:
        if release['tag_name'] != tag:
            continue
        if release['draft'] or release['prerelease']:
            raise ValueError('This version has a draft/prerelease. Inspect it; it will not be overwritten.')
        assets = {asset['name'] for asset in release['assets']}
        if not {'meu-saldo.apk', 'update.json'} <= assets:
            raise ValueError('This version exists without the required assets. Inspect it before continuing.')
        return False
    return True


def main():
    repository = os.environ['GITHUB_REPOSITORY']
    if repository != 'e-Lopes/meu-saldo':
        raise SystemExit('Automatic publication is restricted to the original repository.')
    version = json.loads((ROOT / 'app.json').read_text(encoding='utf-8'))['expo']['version']
    # Listing failures must fail the job, never be interpreted as a missing release.
    pages = json.loads(subprocess.check_output(
        ['gh', 'api', '--paginate', '--slurp', f'repos/{repository}/releases?per_page=100'],
        text=True, encoding='utf-8',
    ))
    try:
        needed = release_required(version, [release for page in pages for release in page])
    except ValueError as error:
        raise SystemExit(str(error)) from error
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write(f'needed={str(needed).lower()}\n')
    message = f'v{version}: ' + ('build and publication requested.' if needed else 'already published; no build needed. Prepare a new version for new changes.')
    print(message)
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
        summary.write(message + '\n')


if __name__ == '__main__':
    main()

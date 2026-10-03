"""Publish verified candidate bytes; never rebuild or replace a release."""
import json
import os
import subprocess
import tempfile
from pathlib import Path


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True, encoding='utf-8')


def main():
    directory = Path(os.environ['CANDIDATE_DIR'])
    manifest = json.loads((directory / 'update.json').read_text(encoding='utf-8'))
    tag = 'v' + manifest['versionName']
    repository = os.environ['GH_REPO']
    # A successful API listing also distinguishes "absent" from auth/network failures.
    releases = json.loads(gh('api', '--paginate', '--slurp', f'repos/{repository}/releases?per_page=100'))
    versions = [release for page in releases for release in page]
    if any(release['tag_name'] == tag for release in versions):
        raise SystemExit('This version already exists (including drafts). Prepare a new version; no assets will be replaced.')
    for release in versions:
        if release['draft'] or release['prerelease']:
            continue
        if not any(asset['name'] == 'update.json' for asset in release['assets']):
            # Versions before the updater was introduced never included this asset.
            if release['tag_name'] in {'v1.0', 'v1.0.0', 'v1.1', 'v1.1.0'}:
                continue
            raise SystemExit('Published release without update.json: inspect it before publishing another candidate.')
        with tempfile.TemporaryDirectory() as temporary:
            gh('release', 'download', release['tag_name'], '--pattern', 'update.json', '--dir', temporary)
            previous = json.loads((Path(temporary) / 'update.json').read_text(encoding='utf-8'))
            if manifest['versionCode'] <= previous['versionCode']:
                raise SystemExit('Candidate versionCode must exceed every published release. Prepare a new version.')
    sha = os.environ['CANDIDATE_SHA']
    refs = json.loads(gh('api', f'repos/{repository}/git/matching-refs/tags/{tag}'))
    matching = [ref for ref in refs if ref['ref'] == f'refs/tags/{tag}']
    if matching:
        obj = matching[0]['object']
        while obj['type'] == 'tag':
            obj = json.loads(gh('api', f'repos/{repository}/git/tags/{obj["sha"]}'))['object']
        if obj['type'] != 'commit' or obj['sha'] != sha:
            raise SystemExit('Existing tag does not point to the candidate commit.')
    gh('release', 'create', tag, str(directory / 'meu-saldo.apk'), str(directory / 'update.json'),
       '--target', sha, '--title', f'Meu Saldo {manifest["versionName"]}',
       '--notes-file', str(directory / 'release-notes.md'), '--draft')
    gh('release', 'edit', tag, '--draft=false', '--latest')
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
        summary.write(f'Published {tag} from candidate run {os.environ["CANDIDATE_RUN_ID"]}, commit {sha}.\n\n')
        summary.write(f'APK SHA-256: `{manifest["sha256"]}`. No recompilation.\n')


if __name__ == '__main__':
    main()

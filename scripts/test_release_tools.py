"""Focused release-tool checks using temporary fixtures, without network or APK builds."""
import contextlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import candidate_source
import check_release
import prepare_release
import publish_candidate

ROOT = Path(__file__).resolve().parent.parent


class ReleaseToolsTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / 'scripts').mkdir()
        (self.root / 'release').mkdir()
        shutil.copyfile(ROOT / 'scripts/bump_release.cjs', self.root / 'scripts/bump_release.cjs')
        self.app = {'expo': {'version': '1.4.0', 'android': {'versionCode': 6, 'package': 'br.com.meusaldo'}}}
        self.write('app.json', self.app)
        self.write('package.json', {'version': '1.4.0'})
        self.write('package-lock.json', {'version': '1.4.0', 'packages': {'': {'version': '1.4.0'}}})
        (self.root / 'release/notes.md').write_text('Notas da versão anterior.\n', encoding='utf-8')
        (self.root / 'release/signing-certificate.sha256').write_text('a' * 64)

    def write(self, name, value):
        (self.root / name).write_text(json.dumps(value), encoding='utf-8')

    def bump(self, *args):
        return subprocess.run(['node', str(self.root / 'scripts/bump_release.cjs'), *args], capture_output=True)

    def test_bump_updates_all_versions_and_preserves_notes(self):
        result = self.bump('1.5.0')
        self.assertEqual(result.returncode, 0, result.stderr)
        app = json.loads((self.root / 'app.json').read_text())['expo']
        self.assertEqual((app['version'], app['android']['versionCode']), ('1.5.0', 7))
        self.assertEqual(json.loads((self.root / 'package.json').read_text())['version'], '1.5.0')
        lock = json.loads((self.root / 'package-lock.json').read_text())
        self.assertEqual((lock['version'], lock['packages']['']['version']), ('1.5.0', '1.5.0'))
        self.assertEqual((self.root / 'release/history/1.4.0.md').read_text(encoding='utf-8'), 'Notas da versão anterior.\n')
        self.assertIn('RELEASE_NOTES_PENDING', (self.root / 'release/notes.md').read_text())
        self.assertNotEqual(self.bump('1.5.0').returncode, 0)

    def test_invalid_and_older_versions_do_not_change_files(self):
        before = (self.root / 'app.json').read_bytes()
        for version in ('1.3.9', '1.4.0', '01.5.0', '1.5.0-beta', '1.5', '9007199254740992.0.0'):
            self.assertNotEqual(self.bump(version).returncode, 0, version)
            self.assertEqual((self.root / 'app.json').read_bytes(), before)

    def test_dry_run_does_not_write(self):
        before = {p: p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(self.bump('1.5.0', '--dry-run').returncode, 0)
        self.assertEqual(before, {p: p.read_bytes() for p in self.root.rglob('*') if p.is_file()})

    def prepare(self, verify=False, signature='a' * 64):
        apk = self.root / 'candidate.apk'
        if not apk.exists():
            apk.write_bytes(b'fixture APK bytes')
        args = ['prepare_release.py', '--apk', str(apk), '--aapt', 'aapt', '--apksigner', 'apksigner',
                '--output', str(self.root / 'output')]
        if verify:
            args.append('--verify-only')
        badging = "package: name='br.com.meusaldo' versionCode='6' versionName='1.4.0'\nsdkVersion:'26'"
        with patch.object(prepare_release, 'ROOT', self.root), patch.object(sys, 'argv', args), \
                patch.object(prepare_release.subprocess, 'check_output', side_effect=[badging, f'Signer #1 certificate SHA-256 digest: {signature}']), \
                contextlib.redirect_stdout(io.StringIO()):
            prepare_release.main()

    def test_verify_preserves_bytes_and_rejects_tampering(self):
        self.prepare()
        output = self.root / 'output'
        before = {p: p.read_bytes() for p in output.iterdir()}
        self.prepare(verify=True)
        self.assertEqual(before, {p: p.read_bytes() for p in output.iterdir()})
        (self.root / 'candidate.apk').write_bytes(b'tampered APK bytes')
        with self.assertRaises(SystemExit):
            self.prepare(verify=True)

    def test_wrong_signature_and_pending_notes_are_rejected(self):
        with self.assertRaises(SystemExit):
            self.prepare(signature='b' * 64)
        (self.root / 'release/notes.md').write_text('RELEASE_NOTES_PENDING')
        with self.assertRaises(SystemExit):
            self.prepare()

    def test_source_rejects_failed_foreign_and_wrong_workflow_runs(self):
        run = {'status': 'completed', 'conclusion': 'success', 'event': 'workflow_dispatch',
               'path': '.github/workflows/release.yml', 'head_repository': {'full_name': 'e-Lopes/meu-saldo'},
               'head_sha': 'c' * 40}
        self.assertEqual(candidate_source.candidate_commit(run, 'e-Lopes/meu-saldo'), 'c' * 40)
        self.assertEqual(candidate_source.candidate_commit({**run, 'event': 'push', 'head_branch': 'main'}, 'e-Lopes/meu-saldo'), 'c' * 40)
        for change in ({'conclusion': 'failure'}, {'event': 'pull_request'}, {'path': 'other.yml'},
                       {'head_repository': {'full_name': 'someone/other'}}, {'head_sha': 'invalid'},
                       {'event': 'push', 'head_branch': 'other'}):
            with self.assertRaises(ValueError):
                candidate_source.candidate_commit({**run, **change}, 'e-Lopes/meu-saldo')

    def test_automatic_release_skips_complete_versions_and_rejects_partial_releases(self):
        self.assertTrue(check_release.release_required('1.0.0', []))
        published = {'tag_name': 'v1.0.0', 'draft': False, 'prerelease': False,
                     'assets': [{'name': 'meu-saldo.apk'}, {'name': 'update.json'}]}
        self.assertFalse(check_release.release_required('1.0.0', [published]))
        self.assertTrue(check_release.release_required('1.0.1', [published]))
        for change in ({'draft': True}, {'prerelease': True}, {'assets': []}):
            with self.assertRaises(ValueError):
                check_release.release_required('1.0.0', [{**published, **change}])

    def test_automatic_release_api_failure_does_not_request_a_build(self):
        output = self.root / 'github-output'
        summary = self.root / 'summary'
        env = {'GITHUB_REPOSITORY': 'e-Lopes/meu-saldo', 'GITHUB_OUTPUT': str(output),
               'GITHUB_STEP_SUMMARY': str(summary)}
        with patch.dict(os.environ, env), patch.object(check_release, 'ROOT', self.root), \
                patch.object(check_release.subprocess, 'check_output', side_effect=subprocess.CalledProcessError(1, 'gh')):
            with self.assertRaises(subprocess.CalledProcessError):
                check_release.main()
        self.assertFalse(output.exists())

    def test_publisher_reuses_exact_files_and_commit(self):
        self.prepare()
        directory = self.root / 'output'
        before = {p: p.read_bytes() for p in directory.iterdir()}
        env = {'CANDIDATE_DIR': str(directory), 'GH_REPO': 'e-Lopes/meu-saldo',
               'CANDIDATE_SHA': 'c' * 40, 'CANDIDATE_RUN_ID': '123', 'GITHUB_STEP_SUMMARY': str(self.root / 'summary')}
        with patch.dict(os.environ, env), patch.object(publish_candidate, 'gh', side_effect=['[]', '[]', '', '']) as gh:
            publish_candidate.main()
        create = gh.call_args_list[2].args
        self.assertIn(str(directory / 'meu-saldo.apk'), create)
        self.assertIn(str(directory / 'update.json'), create)
        self.assertEqual(create[create.index('--target') + 1], 'c' * 40)
        self.assertIn('--draft', create)
        self.assertEqual(before, {p: p.read_bytes() for p in directory.iterdir()})

    def test_publisher_rejects_existing_release_and_mismatched_tag(self):
        self.prepare()
        env = {'CANDIDATE_DIR': str(self.root / 'output'), 'GH_REPO': 'e-Lopes/meu-saldo', 'CANDIDATE_SHA': 'c' * 40}
        with patch.dict(os.environ, env):
            with patch.object(publish_candidate, 'gh', return_value='[[{"tag_name":"v1.4.0"}]]') as gh:
                with self.assertRaises(SystemExit):
                    publish_candidate.main()
                self.assertEqual(gh.call_count, 1)
            refs = [{'ref': 'refs/tags/v1.4.0', 'object': {'type': 'commit', 'sha': 'd' * 40}}]
            with patch.object(publish_candidate, 'gh', side_effect=['[]', json.dumps(refs)]) as gh:
                with self.assertRaises(SystemExit):
                    publish_candidate.main()
                self.assertEqual(gh.call_count, 2)

    def test_publisher_rejects_non_increasing_version_code(self):
        self.prepare()
        env = {'CANDIDATE_DIR': str(self.root / 'output'), 'GH_REPO': 'e-Lopes/meu-saldo'}
        release = {'tag_name': 'v1.3.0', 'draft': False, 'prerelease': False, 'assets': [{'name': 'update.json'}]}
        def gh(*args):
            if args[0] == 'api':
                return json.dumps([[release]])
            self.assertEqual(args[:2], ('release', 'download'))
            destination = Path(args[args.index('--dir') + 1])
            (destination / 'update.json').write_text(json.dumps({'versionCode': 6}))
            return ''
        with patch.dict(os.environ, env), patch.object(publish_candidate, 'gh', side_effect=gh) as mocked:
            with self.assertRaises(SystemExit):
                publish_candidate.main()
            self.assertEqual(mocked.call_count, 2)


if __name__ == '__main__':
    unittest.main()

"""Resolve only a successful candidate build from this repository."""
import json
import os
import re
import subprocess


def candidate_commit(run, repository):
    if (run.get('status') != 'completed' or run.get('conclusion') != 'success'
            or run.get('event') not in {'workflow_dispatch', 'push'}
            or (run.get('event') == 'push' and run.get('head_branch') != 'main')
            or run.get('path') != '.github/workflows/release.yml'
            or run.get('head_repository', {}).get('full_name') != repository
            or not re.fullmatch(r'[a-f0-9]{40}', run.get('head_sha', ''))):
        raise ValueError('Choose a successful Gerar candidato Android run from this repository.')
    return run['head_sha']


def main():
    run_id = os.environ['CANDIDATE_RUN_ID']
    if not re.fullmatch(r'[1-9][0-9]*', run_id):
        raise SystemExit('Candidate run ID must be a positive integer.')
    repository = os.environ['GITHUB_REPOSITORY']
    def api(endpoint):
        return json.loads(subprocess.check_output(['gh', 'api', endpoint], text=True))
    run = api(f'repos/{repository}/actions/runs/{run_id}')
    sha = candidate_commit(run, repository)
    artifacts = api(f'repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100')['artifacts']
    candidates = [item for item in artifacts if item['name'] == 'meu-saldo-candidate' and not item['expired']]
    if len(candidates) != 1:
        raise SystemExit('The run must contain exactly one unexpired candidate artifact. Generate a new candidate if needed.')
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write(f'sha={sha}\n')
    print(f'Candidate run {run_id}, reviewed source {sha}.')


if __name__ == '__main__':
    main()

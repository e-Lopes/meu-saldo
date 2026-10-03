const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

function prepare(version, dryRun = false) {
  const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!pattern.test(version ?? '')) throw new Error('Informe uma versão X.Y.Z, como 1.5.0.');
  const app = read('app.json');
  const pkg = read('package.json');
  const lock = read('package-lock.json');
  const current = app.expo.version;
  if (
    !pattern.test(current) ||
    pkg.version !== current ||
    lock.version !== current ||
    lock.packages[''].version !== current
  )
    throw new Error('As versões atuais estão desalinhadas.');
  const next = version.split('.').map(Number);
  const previous = current.split('.').map(Number);
  const first = next.findIndex((part, index) => part !== previous[index]);
  if (
    next.some((part) => !Number.isSafeInteger(part)) ||
    first < 0 ||
    next[first] < previous[first]
  )
    throw new Error('A nova versão deve ser maior que a atual.');
  const code = app.expo.android.versionCode;
  if (!Number.isInteger(code) || code < 1 || code >= 2100000000)
    throw new Error('versionCode inválido ou sem espaço para incremento.');
  app.expo.version = pkg.version = lock.version = lock.packages[''].version = version;
  app.expo.android.versionCode = code + 1;
  const notesPath = path.join(root, 'release/notes.md');
  const notes = fs.readFileSync(notesPath, 'utf8');
  if (!dryRun) {
    // Preserve the previous notes before creating the next release's editable template.
    const archive = path.join(root, 'release/history', `${current}.md`);
    if (fs.existsSync(archive) && fs.readFileSync(archive, 'utf8') !== notes)
      throw new Error('As notas arquivadas desta versão são diferentes; confira release/history.');
    fs.mkdirSync(path.dirname(archive), { recursive: true });
    fs.writeFileSync(archive, notes);
    for (const [name, value] of [
      ['app.json', app],
      ['package.json', pkg],
      ['package-lock.json', lock],
    ])
      fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
    fs.writeFileSync(
      notesPath,
      `# Meu Saldo ${version}\n\n<!-- RELEASE_NOTES_PENDING: descreva as mudanças antes de gerar o candidato. -->\n`,
    );
  }
  console.log(
    `${dryRun ? 'Simulação: ' : ''}${current} → ${version}; versionCode ${code} → ${code + 1}.`,
  );
  console.log(
    `Edite release/notes.md, envie o commit e execute Gerar candidato Android. Tag prevista: v${version}.`,
  );
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 1 || args.length > 2 || (args[1] && args[1] !== '--dry-run'))
      throw new Error('Uso: npm run release:prepare -- X.Y.Z [--dry-run]');
    prepare(args[0], args[1] === '--dry-run');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { prepare };

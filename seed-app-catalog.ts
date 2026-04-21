import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({
  projectId: 'gen-lang-client-0272660678'
});
const db = getFirestore();
db.settings({ databaseId: 'ai-studio-b788ec34-cbce-4714-9164-f0c927c408a2' });

const CATALOG = [
  {
    name: 'Flux', category: 'Remote Access', developer: 'HypeRemote',
    logo: 'Flux', description: 'Remote desktop and management agent.',
    installCommands: {
      windows: { source: 'custom_url', packageId: 'hyperemote-agent-windows.exe',
        customInstallScript: "Invoke-WebRequest 'https://github.com/JessiJC44/HypeRMM/releases/latest/download/hyperemote-agent-windows.exe' -OutFile $env:TEMP\\agent.exe; Start-Process $env:TEMP\\agent.exe -Wait" },
      mac: { source: 'custom_url', packageId: 'hyperemote-agent-mac-arm',
        customInstallScript: "curl -sSL https://github.com/JessiJC44/HypeRMM/releases/latest/download/hyperemote-agent-mac-arm -o /tmp/agent && chmod +x /tmp/agent && /tmp/agent" },
      linux: { source: 'custom_url', packageId: 'hyperemote-agent-linux',
        customInstallScript: "curl -sSL https://github.com/JessiJC44/HypeRMM/releases/latest/download/hyperemote-agent-linux -o /tmp/agent && chmod +x /tmp/agent && /tmp/agent" },
    },
    isBuiltIn: true,
  },
  { name: 'Chocolatey', category: 'Package Manager', developer: 'Chocolatey Software', logo: 'Chocolatey', description: 'Package manager for Windows.',
    installCommands: { windows: { source: 'custom_url', packageId: 'choco-bootstrap',
      customInstallScript: "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" } }, isBuiltIn: true },
  { name: 'Homebrew', category: 'Package Manager', developer: 'Homebrew', logo: 'Homebrew', description: 'Package manager for macOS and Linux.',
    installCommands: {
      mac: { source: 'custom_url', packageId: 'brew-bootstrap', customInstallScript: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' },
      linux: { source: 'custom_url', packageId: 'brew-bootstrap', customInstallScript: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' },
    }, isBuiltIn: true },
  { name: 'Node.js LTS', category: 'Runtime', developer: 'OpenJS Foundation', logo: 'NodeJS', description: 'JavaScript runtime built on V8.',
    installCommands: { windows: { source: 'winget', packageId: 'OpenJS.NodeJS.LTS' }, mac: { source: 'homebrew', packageId: 'node@20' }, linux: { source: 'apt', packageId: 'nodejs' } }, isBuiltIn: true },
  { name: 'Python 3', category: 'Runtime', developer: 'Python Software Foundation', logo: 'Python', description: 'Python programming language.',
    installCommands: { windows: { source: 'winget', packageId: 'Python.Python.3.12' }, mac: { source: 'homebrew', packageId: 'python@3.12' }, linux: { source: 'apt', packageId: 'python3' } }, isBuiltIn: true },
  { name: 'Git', category: 'Version Control', developer: 'Git', logo: 'Git', description: 'Distributed version control system.',
    installCommands: { windows: { source: 'winget', packageId: 'Git.Git' }, mac: { source: 'homebrew', packageId: 'git' }, linux: { source: 'apt', packageId: 'git' } }, isBuiltIn: true },
  { name: 'Visual Studio Code', category: 'IDE', developer: 'Microsoft', logo: 'VSCode', description: 'Code editor redefined.',
    installCommands: { windows: { source: 'winget', packageId: 'Microsoft.VisualStudioCode' }, mac: { source: 'homebrew_cask', packageId: 'visual-studio-code' }, linux: { source: 'snap', packageId: 'code' } }, isBuiltIn: true },
  { name: '7-Zip', category: 'Utility', developer: 'Igor Pavlov', logo: '7Zip', description: 'File archiver with high compression ratio.',
    installCommands: { windows: { source: 'winget', packageId: '7zip.7zip' } }, isBuiltIn: true },
  { name: 'Firefox', category: 'Browser', developer: 'Mozilla', logo: 'Firefox', description: 'Free and open-source web browser.',
    installCommands: { windows: { source: 'winget', packageId: 'Mozilla.Firefox' }, mac: { source: 'homebrew_cask', packageId: 'firefox' }, linux: { source: 'apt', packageId: 'firefox' } }, isBuiltIn: true },
  { name: 'Google Chrome', category: 'Browser', developer: 'Google', logo: 'Chrome', description: 'Fast, secure, free web browser.',
    installCommands: { windows: { source: 'winget', packageId: 'Google.Chrome' }, mac: { source: 'homebrew_cask', packageId: 'google-chrome' } }, isBuiltIn: true },
  { name: '1Password', category: 'Security', developer: 'AgileBits', logo: '1Password', description: 'Password manager.',
    installCommands: { windows: { source: 'winget', packageId: 'AgileBits.1Password' }, mac: { source: 'homebrew_cask', packageId: '1password' } }, isBuiltIn: true },
  { name: 'Bitwarden', category: 'Security', developer: 'Bitwarden', logo: 'Bitwarden', description: 'Open-source password manager.',
    installCommands: { windows: { source: 'winget', packageId: 'Bitwarden.Bitwarden' }, mac: { source: 'homebrew_cask', packageId: 'bitwarden' }, linux: { source: 'snap', packageId: 'bitwarden' } }, isBuiltIn: true },
  { name: 'Wireshark', category: 'Network', developer: 'Wireshark Foundation', logo: 'Wireshark', description: 'Network protocol analyzer.',
    installCommands: { windows: { source: 'winget', packageId: 'WiresharkFoundation.Wireshark' }, mac: { source: 'homebrew_cask', packageId: 'wireshark' }, linux: { source: 'apt', packageId: 'wireshark' } }, isBuiltIn: true },
  { name: 'Notion', category: 'Productivity', developer: 'Notion Labs', logo: 'Notion', description: 'All-in-one workspace.',
    installCommands: { windows: { source: 'winget', packageId: 'Notion.Notion' }, mac: { source: 'homebrew_cask', packageId: 'notion' } }, isBuiltIn: true },
  { name: 'Docker Desktop', category: 'Developer Tools', developer: 'Docker Inc.', logo: 'Docker', description: 'Containers for developers.',
    installCommands: { windows: { source: 'winget', packageId: 'Docker.DockerDesktop' }, mac: { source: 'homebrew_cask', packageId: 'docker' } }, isBuiltIn: true },
];

async function seed() {
  const existing = await db.collection('software_catalog').where('isBuiltIn', '==', true).get();
  const batch = db.batch();
  existing.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Removed ${existing.size} existing built-in entries.`);

  for (const entry of CATALOG) {
    await db.collection('software_catalog').add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✓ ${entry.name}`);
  }
  console.log(`Seeded ${CATALOG.length} entries.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

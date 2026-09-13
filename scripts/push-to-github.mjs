// Automated script to create a GitHub repository and push all workspace files using GitHub REST API
// Works without requiring git.exe to be installed!

import fs from 'fs';
import path from 'path';

const REPO_NAME = 'auravenue-smart-event-platform';
const REPO_DESCRIPTION = 'AuraVenue AI — The Intelligent, Accessible & Safe Smart Event Experience Platform (PromptWars x Hack Sprint)';

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.gemini', '.tmp']);
const IGNORE_FILES = new Set(['.DS_Store', 'Thumbs.db']);

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORE_DIRS.has(file)) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (!IGNORE_FILES.has(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  }

  return arrayOfFiles;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.argv[2];

  if (!token) {
    console.error(`
❌ Error: GitHub Token is required.

To push to GitHub, run this script with your GitHub Personal Access Token (classic with 'repo' scope):
  node scripts/push-to-github.mjs YOUR_GITHUB_TOKEN

Or set it in your environment:
  $env:GITHUB_TOKEN="your_token_here"
  node scripts/push-to-github.mjs

You can generate a token in 30 seconds at: https://github.com/settings/tokens (select 'repo' scope).
`);
    process.exit(1);
  }

  const rootDir = path.resolve('.');
  console.log(`🚀 Starting GitHub repository creation for: ${REPO_NAME}...`);

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token.trim()}`,
    'User-Agent': 'AuraVenue-Deployer',
  };

  // 1. Get authenticated user info
  console.log('👤 Fetching GitHub user profile...');
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    const err = await userRes.text();
    console.error('❌ Failed to authenticate with GitHub token:', err);
    process.exit(1);
  }
  const userData = await userRes.json();
  const username = userData.login;
  console.log(`✅ Authenticated as: ${username}`);

  // 2. Check or create repository
  console.log(`📦 Checking if repository "${REPO_NAME}" exists...`);
  let repoRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, { headers });
  
  if (repoRes.status === 404) {
    console.log(`Creating public repository: ${username}/${REPO_NAME}...`);
    repoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: REPO_NAME,
        description: REPO_DESCRIPTION,
        private: false,
        auto_init: true,
      }),
    });

    if (!repoRes.ok) {
      const err = await repoRes.text();
      console.error('❌ Failed to create repository:', err);
      process.exit(1);
    }
    console.log(`✅ Repository created: https://github.com/${username}/${REPO_NAME}`);
    await new Promise(r => setTimeout(r, 2500)); // wait for init
  } else {
    console.log(`✅ Repository already exists at: https://github.com/${username}/${REPO_NAME}`);
  }

  // 3. Collect files
  console.log('📂 Collecting project files...');
  const filePaths = getAllFiles(rootDir);
  console.log(`Found ${filePaths.length} files to upload.`);

  // 4. Upload blobs
  console.log('📤 Uploading file blobs to GitHub...');
  const treeItems = [];

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath);
    const isBinary = filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.ico') || filePath.endsWith('.pdf');

    const blobRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/blobs`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.toString(isBinary ? 'base64' : 'utf8'),
        encoding: isBinary ? 'base64' : 'utf-8',
      }),
    });

    if (!blobRes.ok) {
      console.warn(`Warning: failed to upload ${relativePath}`);
      continue;
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: relativePath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // 5. Create Git Tree
  console.log('🌲 Creating git tree...');
  const treeRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/trees`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree: treeItems }),
  });

  if (!treeRes.ok) {
    const err = await treeRes.text();
    console.error('❌ Failed to create tree:', err);
    process.exit(1);
  }
  const treeData = await treeRes.json();

  // 6. Get latest commit on main (if any)
  let parentCommitSha = null;
  const refRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/ref/heads/main`, { headers });
  if (refRes.ok) {
    const refData = await refRes.json();
    parentCommitSha = refData.object.sha;
  }

  // 7. Create Commit
  console.log('✍️ Creating commit...');
  const commitRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/commits`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'feat: Complete AuraVenue AI Smart Event Experience Platform (PromptWars x Hack Sprint)',
      tree: treeData.sha,
      parents: parentCommitSha ? [parentCommitSha] : [],
    }),
  });

  if (!commitRes.ok) {
    const err = await commitRes.text();
    console.error('❌ Failed to create commit:', err);
    process.exit(1);
  }
  const commitData = await commitRes.json();

  // 8. Update refs/heads/main
  console.log('🔗 Updating main branch reference...');
  const updateRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/refs/heads/main`, {
    method: parentCommitSha ? 'PATCH' : 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref: 'refs/heads/main',
      sha: commitData.sha,
      force: true,
    }),
  });

  if (!updateRes.ok) {
    // If ref didn't exist, create it
    await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/refs`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: 'refs/heads/main',
        sha: commitData.sha,
      }),
    });
  }

  console.log(`
🎉 SUCCESS! Your repository is public and live at:
👉 https://github.com/${username}/${REPO_NAME}
`);
}

main().catch(console.error);

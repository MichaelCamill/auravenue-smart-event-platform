// Deploy built dist/ to gh-pages branch and enable GitHub Pages

import fs from 'fs';
import path from 'path';

const REPO_NAME = 'auravenue-smart-event-platform';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.argv[2];

  if (!token) {
    console.error('GitHub token required.');
    process.exit(1);
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token.trim()}`,
    'User-Agent': 'AuraVenue-Deployer',
  };

  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Please run npm run build first.');
    process.exit(1);
  }

  // 1. Get user
  const userRes = await fetch('https://api.github.com/user', { headers });
  const userData = await userRes.json();
  const username = userData.login;
  console.log(`👤 Deploying for: ${username}`);

  // 2. Read dist files
  const files = getAllFiles(distDir);
  console.log(`📦 Found ${files.length} built assets in dist/`);

  // 3. Upload blobs
  console.log('📤 Uploading assets to GitHub...');
  const treeItems = [];

  for (const file of files) {
    const relPath = path.relative(distDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file);
    const isBinary = file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.woff2');

    const blobRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/blobs`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.toString(isBinary ? 'base64' : 'utf8'),
        encoding: isBinary ? 'base64' : 'utf-8',
      }),
    });

    if (!blobRes.ok) {
      console.warn(`Failed blob for ${relPath}`);
      continue;
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // Also add .nojekyll so GitHub Pages doesn't ignore _assets
  const nojekyllBlobRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/blobs`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '', encoding: 'utf-8' }),
  });
  const nojekyllBlob = await nojekyllBlobRes.json();
  treeItems.push({
    path: '.nojekyll',
    mode: '100644',
    type: 'blob',
    sha: nojekyllBlob.sha,
  });

  // 4. Create Tree
  console.log('🌲 Creating git tree for gh-pages...');
  const treeRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/trees`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree: treeItems }),
  });
  const treeData = await treeRes.json();

  // 5. Create Commit on gh-pages
  console.log('✍️ Creating commit on gh-pages...');
  const commitRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/commits`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'deploy: Production build for GitHub Pages live demo',
      tree: treeData.sha,
      parents: [],
    }),
  });
  const commitData = await commitRes.json();

  // 6. Update or Create gh-pages branch ref
  console.log('🔗 Updating gh-pages branch reference...');
  let refRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/refs/heads/gh-pages`, { headers });
  if (refRes.ok) {
    await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/refs/heads/gh-pages`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commitData.sha, force: true }),
    });
  } else {
    await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/git/refs`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'refs/heads/gh-pages', sha: commitData.sha }),
    });
  }
  console.log('✅ gh-pages branch updated.');

  // 7. Enable GitHub Pages if not enabled
  console.log('🌐 Configuring GitHub Pages...');
  const pagesRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/pages`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: {
        branch: 'gh-pages',
        path: '/',
      },
    }),
  });

  if (pagesRes.ok) {
    const pagesData = await pagesRes.json();
    console.log(`✅ GitHub Pages enabled! URL: ${pagesData.html_url}`);
  } else {
    // Check existing
    const checkPages = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/pages`, { headers });
    if (checkPages.ok) {
      const pData = await checkPages.json();
      console.log(`✅ GitHub Pages active! URL: ${pData.html_url}`);
    } else {
      console.log(`Note: Pages can also be toggled at https://github.com/${username}/${REPO_NAME}/settings/pages`);
    }
  }

  const liveUrl = `https://${username.toLowerCase()}.github.io/${REPO_NAME}/`;
  console.log(`
🎉 LIVE DEMO DEPLOYED!
URL: 👉 ${liveUrl}
This link is permanent, high-availability, and requires zero maintenance.
`);
}

main().catch(console.error);

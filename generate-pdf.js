const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function main() {
  const md = fs.readFileSync(path.join(__dirname, 'docs/rings-announcement.md'), 'utf8');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 40px; color: #1a1a1a; line-height: 1.7; }
  h1 { color: #f5a623; border-bottom: 2px solid #f5a623; padding-bottom: 10px; }
  h2 { color: #333; margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  h3 { color: #555; margin-top: 28px; }
  pre, code { background: #f4f4f4; border-radius: 6px; padding: 2px 6px; font-size: 0.9em; }
  pre { padding: 16px; white-space: pre-wrap; word-break: break-word; }
  blockquote { border-left: 4px solid #f5a623; margin: 0; padding-left: 16px; color: #666; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th { background: #f5a623; color: white; padding: 10px 14px; text-align: left; }
  td { border: 1px solid #ddd; padding: 10px 14px; }
  tr:nth-child(even) td { background: #fafafa; }
  ul { padding-left: 20px; }
  li { margin: 6px 0; }
  hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
</style>
</head>
<body>
${marked(md)}
</body>
</html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.join(__dirname, 'docs/rings-announcement.pdf'),
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });
  await browser.close();
  console.log('✅ PDF saved to docs/rings-announcement.pdf');
}

main().catch(console.error);

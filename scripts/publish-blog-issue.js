const fs = require("fs");

const filePath = "index.html";
const marker = "<!-- POSTS_START -->";

const issueNumber = process.env.ISSUE_NUMBER || "";
const issueTitle = process.env.ISSUE_TITLE || "";
const issueBody = process.env.ISSUE_BODY || "";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function todayInTokyo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function extractField(body, label) {
  const regex = new RegExp(`### ${label}\\s+([\\s\\S]*?)(?=\\n### |$)`);
  const match = String(body).match(regex);
  return match ? match[1].trim() : "";
}

function normalizeIssueTitle(title) {
  return String(title)
    .replace(/^blog\s*:\s*/i, "")
    .replace(/^blog\s*$/i, "")
    .trim();
}

function bodyToParagraphs(text) {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => {
      const escaped = escapeHtml(paragraph).replaceAll("\n", "<br>\n        ");
      return `      <p>\n        ${escaped}\n      </p>`;
    })
    .join("\n\n");
}

const formTitle = extractField(issueBody, "Title");
const formBody = extractField(issueBody, "Body");

const title = formTitle || normalizeIssueTitle(issueTitle);
const body = formBody || issueBody;

if (!body.trim()) {
  throw new Error("Post body is empty.");
}

const date = todayInTokyo();

const titleHtml = title.trim()
  ? `      <h2>${escapeHtml(title.trim())}</h2>\n\n`
  : "";

const paragraphsHtml = bodyToParagraphs(body);

const entry = `\n\n    <section class="entry" data-issue="${escapeHtml(issueNumber)}">\n      <div class="date">${date}</div>\n${titleHtml}${paragraphsHtml}\n    </section>`;

const html = fs.readFileSync(filePath, "utf8");

if (!html.includes(marker)) {
  throw new Error(`Marker not found: ${marker}`);
}

if (html.includes(`data-issue="${issueNumber}"`)) {
  console.log(`Issue #${issueNumber} already published.`);
  process.exit(0);
}

const updated = html.replace(marker, `${marker}${entry}`);

fs.writeFileSync(filePath, updated, "utf8");

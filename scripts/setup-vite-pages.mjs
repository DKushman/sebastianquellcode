import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceDir = projectRoot;
const pagesDir = path.join(projectRoot, "src/pages");
const partialsDir = path.join(projectRoot, "src/partials");

const headerStartToken = '<div class="element_wrapper wrap_header">';
const headerEndToken = "</header></div>";
const footerStartToken = '<footer><div id="footercontainer">';
const footerEndToken = "</div></footer>";

const rootHtmlFiles = fs
  .readdirSync(sourceDir)
  .filter((fileName) => fileName.endsWith(".html"))
  .sort((a, b) => a.localeCompare(b));

if (rootHtmlFiles.length === 0) {
  throw new Error("No HTML files found in project root.");
}

const referenceFile = rootHtmlFiles.includes("index.html") ? "index.html" : rootHtmlFiles[0];
const referenceContent = fs.readFileSync(path.join(sourceDir, referenceFile), "utf8");

const headerStart = referenceContent.indexOf(headerStartToken);
const headerEnd = referenceContent.indexOf(headerEndToken);
if (headerStart === -1 || headerEnd === -1 || headerEnd < headerStart) {
  throw new Error(`Could not extract header from ${referenceFile}.`);
}

const footerStart = referenceContent.indexOf(footerStartToken);
const footerEnd = referenceContent.indexOf(footerEndToken);
if (footerStart === -1 || footerEnd === -1 || footerEnd < footerStart) {
  throw new Error(`Could not extract footer from ${referenceFile}.`);
}

let headerPartial = referenceContent.slice(headerStart, headerEnd + headerEndToken.length);
const footerPartial = referenceContent.slice(footerStart, footerEnd + footerEndToken.length);

headerPartial = headerPartial.replace(
  /<div class="pagetitle">[\s\S]*?<\/div>/,
  '<div class="pagetitle" id="pagetitle-dynamic"></div>'
);

headerPartial += `<script>
(function () {
  var links = document.querySelectorAll('#menu a[href]');
  var fileName = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('#menu li').forEach(function (li) {
    li.classList.remove('active', 'subactive', 'menusubitemactive');
  });

  var activeLink = Array.prototype.find.call(links, function (link) {
    var href = (link.getAttribute('href') || '').trim();
    return href && !href.startsWith('http') && href === fileName;
  });

  if (activeLink) {
    var activeItem = activeLink.closest('li');
    if (activeItem) {
      activeItem.classList.add('menusubitemactive');
      var parentSub = activeItem.parentElement ? activeItem.parentElement.closest('li.menuitem') : null;
      if (parentSub) {
        parentSub.classList.add('subactive');
      }
    }
  }

  var pageTitle = document.title || '';
  var titleParts = pageTitle.split(' - ');
  var cleanTitle = titleParts[titleParts.length - 1] || pageTitle;
  var pageTitleTarget = document.getElementById('pagetitle-dynamic');
  if (pageTitleTarget) {
    pageTitleTarget.textContent = cleanTitle.trim() || 'Home';
  }
})();
</script>`;

fs.mkdirSync(partialsDir, { recursive: true });
fs.mkdirSync(pagesDir, { recursive: true });

fs.writeFileSync(path.join(partialsDir, "header.html"), headerPartial, "utf8");
fs.writeFileSync(path.join(partialsDir, "footer.html"), footerPartial, "utf8");

for (const fileName of rootHtmlFiles) {
  const inputPath = path.join(sourceDir, fileName);
  const outputPath = path.join(pagesDir, fileName);
  let content = fs.readFileSync(inputPath, "utf8");

  const thisHeaderStart = content.indexOf(headerStartToken);
  const thisHeaderEnd = content.indexOf(headerEndToken);
  if (thisHeaderStart !== -1 && thisHeaderEnd !== -1 && thisHeaderEnd > thisHeaderStart) {
    const before = content.slice(0, thisHeaderStart);
    const after = content.slice(thisHeaderEnd + headerEndToken.length);
    content = `${before}<include src="../partials/header.html"></include>${after}`;
  }

  const thisFooterStart = content.indexOf(footerStartToken);
  const thisFooterEnd = content.indexOf(footerEndToken);
  if (thisFooterStart !== -1 && thisFooterEnd !== -1 && thisFooterEnd > thisFooterStart) {
    const before = content.slice(0, thisFooterStart);
    const after = content.slice(thisFooterEnd + footerEndToken.length);
    content = `${before}<include src="../partials/footer.html"></include>${after}`;
  }

  fs.writeFileSync(outputPath, content, "utf8");
}

console.log(`Prepared ${rootHtmlFiles.length} pages in src/pages using shared header/footer partials.`);

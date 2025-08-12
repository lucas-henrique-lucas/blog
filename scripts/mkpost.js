// @ts-check

/**
 * @typedef { '-b' | '-p' } Post_Type
 */

const { existsSync, writeFileSync } = require("fs");
const { resolve } = require("path");

// Função para gerar data com fuso horário local real (Brasil)
function getBrazilDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(
    2,
    "0"
  );
  const offsetSign = offsetMinutes <= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${offsetHours}:00`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
}

// get 3rd cli args as post type
const type = /** @type {Post_Type} */ (process.argv[2]);

// and the rest will joined as title
const title = process.argv.slice(3).join(" ");

// check if type value is passed
if (!type) {
  console.error(`⚠ type is required. Either use '-b' or '-p'.\n`);
  process.exit(1);
}

// check title value passed
if (!title) {
  console.error(`⚠ title is required\n`);
  process.exit(1);
}

// check type value
if (!["-b", "-p"].includes(type)) {
  console.error(`⚠ type must be '-b' for blog or '-p' for photo\n`);
  process.exit(1);
}

// map post directories with post type
/** @type {Record<Post_Type, string>} */
const post_dirs = { "-b": "./src/blog", "-p": "./src/photos" };

// map post layouts with post type
/** @type {Record<Post_Type, string>} */
const post_layouts = {
  "-b": "main/post-blog.html",
  "-p": "main/post-photos.html",
};

// create slug from title (primeiras 5 palavras)
const slug = title.toLowerCase().split(/\s+/g).slice(0, 5).join("-");

// resolve post file that make use of slug
const post_file = resolve(post_dirs[type], slug + ".md");

// check if post file already exists
if (existsSync(post_file)) {
  console.error(
    `⚠ post with slug "${slug}" already exists in "${post_dirs[type]}".\n`
  );
  process.exit(1);
}

// data atual no formato correto
const currentDate = getBrazilDateTime();

// format frontmatter based on type
let frontmatter = "";
if (type === "-b") {
  frontmatter = `---
layout: ${post_layouts[type]}
title: ${title.toLowerCase().replace(/(?:^|\\s)\\w/g, (m) => m.toUpperCase())}
description: TODO
keyword: TODO
cover: /asset/blog/
date: ${currentDate}
tags:
 - TODO
---

# TODO
`;
} else if (type === "-p") {
  frontmatter = `---
layout: ${post_layouts[type]}
title: ${title.toLowerCase().replace(/(?:^|\\s)\\w/g, (m) => m.toUpperCase())}
description: TODO
keyword: TODO
cover:
  - url: /asset/photos/
thumbnail: /asset/photos/thumbnail/
date: ${currentDate}
tags:
  - TODO
---

# TODO
`;
}

// write frontmatter to a post file
writeFileSync(post_file, frontmatter);

console.log(`✔ post created:`, post_file);

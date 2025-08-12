import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

import eleventyPluginFilesMinifier from "@sherby/eleventy-plugin-files-minifier";
import lazyImagesPlugin from "eleventy-plugin-lazyimages";

if (process.env.NODE_ENV?.toLocaleLowerCase() !== "production") {
  import("dotenv").then((dotenv) => dotenv.config());
}

export default function (eleventyConfig) {
  // minifier js
  import("./scripts/minify.js")
    .then((minifyModule) => {
      eleventyConfig.addTransform(
        "minify",
        minifyModule.default || minifyModule
      );
    })
    .catch((error) =>
      console.error("Error importing minify transform:", error)
    );

  // lazyImages and Files Minifier
  eleventyConfig.addPlugin(lazyImagesPlugin, {
    appendInitScript: false, // disable cdn script
  });
  if (process.env.NODE_ENV?.toLowerCase() === "production") {
    eleventyConfig.addPlugin(eleventyPluginFilesMinifier);
  }

  // Global data
  eleventyConfig.addGlobalData("lang", "pt-BR");
  eleventyConfig.addGlobalData("rootTitle", "Lucas");
  eleventyConfig.addGlobalData("rootURL", "https://lucs.netlify.app");
  eleventyConfig.addGlobalData(
    "quotes",
    "<em>Lembre-se que você é um ator em uma peça, e não o autor dela</em><br /><strong>― Epicteto ✋🏻🧠</strong>"
  );
  eleventyConfig.addGlobalData("SUPABASE_URL", process.env.SUPABASE_URL);
  eleventyConfig.addGlobalData("SUPABASE_KEY", process.env.SUPABASE_KEY);

  // Passthrough
  const passthroughCopies = [
    "src/robots.txt",
    "src/asset/",
    "src/CNAME",
    "admin",
    "public",
  ];
  passthroughCopies.forEach((path) => eleventyConfig.addPassthroughCopy(path));

  // Collections
  const collectionConfigs = [
    { name: "posts", glob: "src/blog/**/*.md" },
    { name: "photos", glob: "src/photos/**/*.md" },
    { name: "recentPosts", glob: "src/blog/*.md", limit: 3 },
    { name: "recentPhotos", glob: "src/photos/*.md", limit: 6 },
  ];
  collectionConfigs.forEach((config) => {
    eleventyConfig.addCollection(config.name, function (collectionApi) {
      let items = collectionApi.getFilteredByGlob(config.glob);
      return config.limit ? items.reverse().slice(0, config.limit) : items;
    });
  });

  // Filtros
  eleventyConfig.addFilter("firstCoverImage", function (cover) {
    if (!cover) return "";
    if (Array.isArray(cover) && typeof cover[0] === "object" && cover[0].url)
      return cover[0].url;
    if (typeof cover === "string") return cover;
    if (typeof cover === "object" && cover.url) return cover.url;
    return "";
  });

  eleventyConfig.addLiquidFilter("limitWords", function (str, wordLimit) {
    let words = str.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : str;
  });

  // ✅ Filtro novo para normalizar qualquer tipo de cover
  eleventyConfig.addFilter("normalizeCover", function (cover) {
    if (!cover) return [];

    if (typeof cover === "string") {
      return [{ url: cover }];
    }

    if (Array.isArray(cover)) {
      if (typeof cover[0] === "string") {
        return cover.map((item) => ({ url: item }));
      } else if (cover[0]?.url) {
        return cover;
      }
    }

    if (typeof cover === "object" && cover.url) {
      return [cover];
    }

    return [];
  });

  // Tags
  ["blog", "photos"].forEach((type) => {
    eleventyConfig.addCollection(`${type}Tags`, getTags(type));
  });

  function getTags(type) {
    return (collection) => {
      let tagsSet = new Set();
      collection.getAll().forEach((item) => {
        if (item.filePathStem.includes(`/${type}/`) && item.data.tags) {
          item.data.tags.forEach((tag) => {
            tagsSet.add(tag);
          });
        }
      });
      return Array.from(tagsSet);
    };
  }

  eleventyConfig.on("eleventy.before", async () => {
    const tailwindInputPath = path.resolve("./src/styles.css");
    const tailwindOutputPath = "./_site/asset/css/style.css";
    const cssContent = fs.readFileSync(tailwindInputPath, "utf8");
    const outputDir = path.dirname(tailwindOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const result = await postcss([tailwindcss()]).process(cssContent, {
      from: tailwindInputPath,
      to: tailwindOutputPath,
    });

    fs.writeFileSync(tailwindOutputPath, result.css);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
}

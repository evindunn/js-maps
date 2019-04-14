const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src", "index.js"),
  mode: "production",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, path.join("public", "js"))
  }
};

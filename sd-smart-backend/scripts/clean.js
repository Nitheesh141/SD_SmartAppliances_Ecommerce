const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  console.log(`Cleaning compiled output directory: ${distPath}`);
  try {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log("Successfully cleaned output directory.");
  } catch (error) {
    console.error(`Failed to clean output directory: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log("Output directory is already clean.");
}

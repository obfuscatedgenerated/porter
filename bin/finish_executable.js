import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { execPath, platform } from "process";
import { execSync } from "child_process";

const IS_WIN = platform === "win32";
const TARGET_NAME = IS_WIN ? "porter.exe" : "porter";

const DIST_DIR = join(process.cwd(), "dist");
const BLOB_PATH = join(DIST_DIR, "porter.blob");
const EXE_PATH = join(DIST_DIR, TARGET_NAME);

if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
}

// copy node binary to dist
try {
    copyFileSync(execPath, EXE_PATH);

    console.log(`Successfully copied Node binary:`);
    console.log(`From: ${execPath}`);
    console.log(`To:   ${EXE_PATH}`);
} catch (err) {
    console.error("Failed to copy binary:", err.message);
    process.exit(1);
}

// inject blob into node binary
const FUSE = "NODE_SEA_FUSE_f140d859295178026b456294a0843ad0";
try {
    execSync(`npx postject "${EXE_PATH}" NODE_SEA_BLOB "${BLOB_PATH}" --sentinel-fuse ${FUSE}`, { stdio: "inherit" });

    console.log("Successfully injected blob into binary.");
} catch (err) {
    console.error("Failed to inject blob:", err.message);
    process.exit(1);
}

import dotenv from "dotenv";
import path from "path";
import type { NextConfig } from "next";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;

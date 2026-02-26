import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrgPagesRepo = repositoryName.endsWith(".github.io");

const base = process.env.GITHUB_ACTIONS
  ? isUserOrOrgPagesRepo
    ? "/"
    : `/${repositoryName}/`
  : "/";

export default defineConfig({
  plugins: [react()],
  base,
});

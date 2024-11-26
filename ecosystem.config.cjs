module.exports = {
  apps: [
    {
      name: "renaSender",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      // exec_mode: "cluster",
      watch: ["public", "routes", "models", "views", "config", "./app.js"],
      ignore_watch: [
        "node_modules",
        "logs",
        "dist",
        ".idea",
        ".vscode",
        ".git",
        "./gitignore",
        "./Dockerfile",
        "./goorm.manifest",
        "./README.md",
        "./sender.info",
      ],
      env: {
        TZ: "Asia/Seoul",
      },
    },
  ],
};

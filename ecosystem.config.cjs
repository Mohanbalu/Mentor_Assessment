// ecosystem.config.cjs - Production Process Configuration for PM2
module.exports = {
  apps: [
    {
      name: "assessment-api-service",
      script: "./server/src/app.ts",
      interpreter: "node",
      interpreter_args: "--import tsx", // Fast, modern direct typescript compilation runner
      instances: "max",                 // Cluster across all CPU cores
      exec_mode: "cluster",             // Production cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

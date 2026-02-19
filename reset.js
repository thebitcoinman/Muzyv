module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: "rm -rf node_modules",
        path: "muzyv_frontend"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "npm install",
        path: "muzyv_frontend"
      }
    },
    {
      method: "notify",
      params: {
        html: "Reset complete!"
      }
    }
  ]
}

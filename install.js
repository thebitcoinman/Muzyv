module.exports = {
  run: [
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
        html: "Installation complete! Click 'Start' to launch Muzyv."
      }
    }
  ]
}

module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        message: "npm run dev",
        path: "muzyv_frontend",
        on: [
          {
            "event": "/http:\\/\\/(localhost|127\\.0\\.0\\.1):(\\d+)/",
            "done": true
          }
        ]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[0]}}"
      }
    },
    {
      method: "proxy.start",
      params: {
        url: "{{local.url}}",
        name: "Muzyv"
      }
    }
  ]
}

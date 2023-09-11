import serveStatic from 'serve-static'

export default () => ({
  name: 'general-assets',
  configureServer(server) {
    server.middlewares.use(serveStatic('public', { index: false }))
  }
})
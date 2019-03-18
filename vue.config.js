module.exports = {
    lintOnSave: false,
    baseUrl: '/dist/',
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:5299',
                changeOrigin: true
            }
        }
    },
}

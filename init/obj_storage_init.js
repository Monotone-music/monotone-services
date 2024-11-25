const Minio = require('minio')

const endpoint = process.env.MINIO_ENDPOINT
const port = parseInt(process.env.MINIO_PORT)
const useSSL = false
const accessKey = process.env.MINIO_ACCESS_KEY
const secretKey = process.env.MINIO_SECRET_KEY

const minioClient = new Minio.Client({
    endPoint: endpoint,
    port: port,
    useSSL: useSSL,
    accessKey: accessKey,
    secretKey: secretKey
})

module.exports = minioClient;
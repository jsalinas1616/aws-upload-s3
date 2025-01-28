const chokidar = require("chokidar");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Configurar el cliente de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
});

// Crear la carpeta si no existe
const folderToWatch = process.env.FOLDER_TO_WATCH;
if (!fs.existsSync(folderToWatch)) {
  fs.mkdirSync(folderToWatch);
}

// Función para subir archivo a S3
async function uploadFileToS3(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      Body: fileContent,
    });

    await s3Client.send(command);
    console.log(`✅ Archivo ${fileName} subido exitosamente a S3`);
  } catch (error) {
    console.error(`❌ Error al subir el archivo: ${error.message}`);
  }
}

// Configurar el watcher
const watcher = chokidar.watch(folderToWatch, {
  persistent: true,
  ignoreInitial: false,
});

// Eventos del watcher
watcher
  .on("add", (filePath) => {
    console.log(`📁 Nuevo archivo detectado: ${filePath}`);
    uploadFileToS3(filePath);
  })
  .on("error", (error) => {
    console.error(`❌ Error en el watcher: ${error}`);
  });

console.log(`🚀 Monitoreando la carpeta: ${folderToWatch}`);

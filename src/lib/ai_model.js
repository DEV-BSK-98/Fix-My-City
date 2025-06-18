const tf = require('@tensorflow/tfjs-node')
const path = require('path')

async function loadModel() {
    const modelPath = 'file://./ai_classifier/model.json'
    const model = await tf.loadLayersModel(modelPath)
    return model
}

function preprocessImage(imageBuffer) {
    const imageTensor = tf.node.decodeImage(imageBuffer, 3)

    const resized = tf.image.resizeBilinear(imageTensor, [224, 224])

    const normalized = resized.div(255.0)

    return normalized.expandDims(0)
}

export async function classifyImage(imageBuffer) {
    const model = await loadModel()
    const inputTensor = preprocessImage(imageBuffer)

    const prediction = model.predict(inputTensor)
    const probabilities = prediction.dataSync()

    console.log('Prediction probabilities:', probabilities)

    const classes = ['RDA', 'ZEMA']
    const predictedIndex = prediction.argMax(-1).dataSync()[0]

    return { label: classes[predictedIndex], confidence: probabilities[predictedIndex] }
}
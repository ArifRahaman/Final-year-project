const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Card = require('../models/Card');
const connectDB = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return data.text || '';
  } finally {
    await parser.destroy();
  }
};

const postJson = (urlString, body) => new Promise((resolve, reject) => {
  const url = new URL(urlString);
  const lib = url.protocol === 'https:' ? https : http;
  const payload = JSON.stringify(body);

  const req = lib.request({
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(JSON.parse(responseBody));
      } else {
        reject(new Error(`${res.statusCode} ${responseBody}`));
      }
    });
  });

  req.on('error', reject);
  req.write(payload);
  req.end();
});

const run = async () => {
  await connectDB();

  const cards = await Card.find({ 'resources.type': 'pdf' });
  let cardsUpdated = 0;
  let pdfsIngested = 0;

  for (const card of cards) {
    let cardChunks = 0;
    const pdfResources = card.resources.filter(resource => resource.type === 'pdf');

    for (const resource of pdfResources) {
      const filePath = path.join(__dirname, '..', resource.path.replace(/^[/\\]/, ''));
      if (!fs.existsSync(filePath)) {
        console.warn(`Missing PDF file: ${filePath}`);
        continue;
      }

      const text = await extractPdfText(filePath);
      if (!text.trim()) {
        console.warn(`No text extracted from: ${resource.originalName}`);
        continue;
      }

      const result = await postJson(`${AI_SERVICE_URL}/api/ai/ingest`, {
        card_id: card._id.toString(),
        text,
        source: resource.originalName
      });

      cardChunks += result.chunks_stored || 0;
      pdfsIngested += 1;
      console.log(`Ingested ${resource.originalName} for ${card.title}: ${result.chunks_stored} chunks`);
    }

    if (cardChunks > 0) {
      card.embeddingsReady = true;
      await card.save();
      cardsUpdated += 1;
    }
  }

  console.log(`Done. Cards updated: ${cardsUpdated}, PDFs ingested: ${pdfsIngested}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

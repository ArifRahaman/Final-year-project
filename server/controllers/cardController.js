const Card = require('../models/Card');
const AccessRequest = require('../models/AccessRequest');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { PDFParse } = require('pdf-parse');

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

// Fire-and-forget: extract text from PDFs and send to AI service for embedding
const ingestPdfsAsync = async (cardId, files) => {
  for (const file of files) {
    if (file.mimetype !== 'application/pdf') continue;
    try {
      const text = await extractPdfText(file.path);
      if (!text || text.trim().length === 0) continue;

      // POST to AI service
      const body = JSON.stringify({ card_id: cardId.toString(), text, source: file.originalname });
      const url = new URL(`${AI_SERVICE_URL}/api/ai/ingest`);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (resp) => {
        let responseBody = '';
        resp.on('data', (chunk) => {
          responseBody += chunk;
        });
        resp.on('end', async () => {
          if (resp.statusCode >= 200 && resp.statusCode < 300) {
            try {
              const result = JSON.parse(responseBody);
              await Card.findByIdAndUpdate(cardId, { embeddingsReady: result.chunks_stored > 0 });
              console.log(`✅ Ingested PDF: ${file.originalname} for card ${cardId} (${result.chunks_stored} chunks)`);
            } catch (e) {
              console.log(`✅ Ingested PDF: ${file.originalname} for card ${cardId}`);
            }
          } else {
            console.warn(`⚠️  PDF ingest failed for ${file.originalname}: ${resp.statusCode} ${responseBody}`);
          }
        });
      });
      req.on('error', (e) => console.warn(`⚠️  PDF ingest failed: ${e.message}`));
      req.write(body);
      req.end();
    } catch (e) {
      console.warn(`⚠️  PDF parse error for ${file.originalname}:`, e.message);
    }
  }
};

// Helper to determine resource type from mimetype
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('text/')) return 'text';
  return 'other';
};

// @desc    Create a new card
// @route   POST /api/cards
const createCard = async (req, res) => {
  try {
    const { title, description, subject, tags, textContent } = req.body;

    if (!title || !description || !subject) {
      return res.status(400).json({ message: 'Title, description, and subject are required' });
    }

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const resources = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        resources.push({
          type: getResourceType(file.mimetype),
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype
        });
      }
    }

    const card = await Card.create({
      title,
      description,
      subject,
      tags: parsedTags,
      resources,
      creator: req.user._id,
      textContent: textContent || ''
    });

    await card.populate('creator', 'name email role');

    // Trigger PDF ingestion async (non-blocking)
    if (req.files && req.files.length > 0) {
      const pdfFiles = req.files
        .filter(f => f.mimetype === 'application/pdf')
        .map(f => ({ ...f, path: path.join(__dirname, '..', 'uploads', f.filename) }));
      if (pdfFiles.length > 0) ingestPdfsAsync(card._id, pdfFiles);
    }

    res.status(201).json(card);
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Error creating card' });
  }
};

// @desc    Get all published cards (with search/filter)
// @route   GET /api/cards
const getCards = async (req, res) => {
  try {
    const { search, subject, tag, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (subject) {
      query.subject = new RegExp(subject, 'i');
    }
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cards = await Card.find(query)
      .populate('creator', 'name email role institution')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Card.countDocuments(query);

    res.json({
      cards,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Error fetching cards' });
  }
};

// @desc    Get card by ID (with access check)
// @route   GET /api/cards/:id
const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate('creator', 'name email role institution')
      .populate('accessList', 'name email');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Determine access level
    let accessLevel = 'none';
    if (req.user) {
      if (card.creator._id.toString() === req.user._id.toString()) {
        accessLevel = 'owner';
      } else if (card.accessList.some(u => u._id.toString() === req.user._id.toString())) {
        accessLevel = 'granted';
      } else {
        // Check if there's a pending request
        const existingRequest = await AccessRequest.findOne({
          student: req.user._id,
          card: card._id
        });
        if (existingRequest) {
          accessLevel = existingRequest.status;
        }
      }
    }

    res.json({ card, accessLevel });
  } catch (error) {
    console.error('Get card by ID error:', error);
    res.status(500).json({ message: 'Error fetching card' });
  }
};

// @desc    Get teacher's own cards
// @route   GET /api/cards/my/cards
const getMyCards = async (req, res) => {
  try {
    const cards = await Card.find({ creator: req.user._id })
      .populate('creator', 'name email role')
      .sort({ createdAt: -1 });

    // Get request counts for each card
    const cardsWithStats = await Promise.all(
      cards.map(async (card) => {
        const pendingCount = await AccessRequest.countDocuments({
          card: card._id,
          status: 'pending'
        });
        const cardObj = card.toObject();
        cardObj.pendingRequests = pendingCount;
        return cardObj;
      })
    );

    res.json(cardsWithStats);
  } catch (error) {
    console.error('Get my cards error:', error);
    res.status(500).json({ message: 'Error fetching your cards' });
  }
};

// @desc    Update card
// @route   PUT /api/cards/:id
const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this card' });
    }

    const { title, description, subject, tags, textContent, isPublished } = req.body;

    if (title) card.title = title;
    if (description) card.description = description;
    if (subject) card.subject = subject;
    if (tags) card.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (textContent !== undefined) card.textContent = textContent;
    if (isPublished !== undefined) card.isPublished = isPublished;

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        card.resources.push({
          type: getResourceType(file.mimetype),
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype
        });
      }
      // Ingest new PDFs
      const pdfFiles = req.files
        .filter(f => f.mimetype === 'application/pdf')
        .map(f => ({ ...f, path: path.join(__dirname, '..', 'uploads', f.filename) }));
      if (pdfFiles.length > 0) ingestPdfsAsync(card._id, pdfFiles);
    }

    await card.save();
    await card.populate('creator', 'name email role');

    res.json(card);
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Error updating card' });
  }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    if (card.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this card' });
    }

    // Delete associated files
    for (const resource of card.resources) {
      const filePath = path.join(__dirname, '..', resource.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete associated access requests
    await AccessRequest.deleteMany({ card: card._id });

    await Card.findByIdAndDelete(card._id);

    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Error deleting card' });
  }
};

module.exports = { createCard, getCards, getCardById, getMyCards, updateCard, deleteCard };

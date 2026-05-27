const messageService = require('../services/messageService');
const HttpError = require('../utils/httpError');

// GET /api/messages/conversations
async function listConversations(req, res) {
  const conversations = await messageService.listConversations(req.user.id);
  res.json({ conversations });
}

// GET /api/messages/conversations/:userId
async function getConversation(req, res) {
  const data = await messageService.getConversation(req.user.id, req.params.userId);
  res.json(data);
}

// POST /api/messages/conversations/:userId { text }
async function send(req, res) {
  const { text } = req.body || {};
  if (!text || !text.trim()) {
    throw new HttpError(400, 'Message text is required', 'missing_text');
  }
  const message = await messageService.sendMessage(
    req.user.id,
    req.params.userId,
    text.trim()
  );
  res.status(201).json({ message });
}

module.exports = { listConversations, getConversation, send };

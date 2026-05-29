const forumService = require('../services/forumService');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const search = (req.query.search || '').trim();
  const forums = await forumService.listForums({ search });
  res.json(forums);
}

async function create(req, res) {
  const { name, title, description } = req.body || {};
  const forumName = (name || title || '').trim();
  if (!forumName) {
    throw new HttpError(400, 'Forum name is required', 'missing_name');
  }
  const forum = await forumService.createForum({
    name: forumName,
    description: (description || '').trim(),
    createdBy: req.user.id,
    createdByName: req.user.displayName || req.user.id,
  });
  res.status(201).json(forum);
}

async function getOne(req, res) {
  const forum = await forumService.getForum(req.params.forumId);
  res.json(forum);
}

module.exports = { list, create, getOne };

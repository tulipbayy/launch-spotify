const forumService = require('../services/forumService');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const posts = await forumService.listPosts(req.params.forumId, {}, req.user.id);
  res.json({ posts });
}

async function create(req, res) {
  const { body } = req.body || {};
  if (!body || !body.trim()) {
    throw new HttpError(400, 'Post body is required', 'missing_body');
  }
  const post = await forumService.createPost(req.params.forumId, {
    body: body.trim(),
    authorId: req.user.id,
    authorName: req.user.profile?.displayName || req.user.id,
  });
  res.status(201).json({ post });
}

async function like(req, res) {
  const result = await forumService.toggleLike(
    req.params.forumId,
    req.params.postId,
    req.user.id
  );
  res.json(result);
}

module.exports = { list, create, like };

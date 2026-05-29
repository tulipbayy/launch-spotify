const forumService = require('../services/forumService');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const posts = await forumService.listPosts(req.params.forumId, {}, req.user.id);
  res.json(posts);
}

async function create(req, res) {
  const { text, content } = req.body || {};
  const body = (text || content || '').trim();
  if (!body) {
    throw new HttpError(400, 'Post content is required', 'missing_content');
  }
  const post = await forumService.createPost(req.params.forumId, {
    content: body,
    authorId: req.user.id,
    authorName: req.user.displayName || req.user.id,
  });
  res.status(201).json(post);
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

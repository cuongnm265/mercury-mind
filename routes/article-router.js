let express = require('express');
let router = express.Router();

let articleService = require('../mongoose/services/article-service');
let tagService = require('../mongoose/services/tag-service');
let userService = require('../mongoose/services/user-service');
let discussionService = require('../mongoose/services/discussion-service');

const chalk = require('chalk');

router.route('/initScore')
    .post(function (req, res) {
        console.log('init score');
        articleService.initScore(function (err) {
            if (err) res.status(400).send();
            res.status(202).send();
        });
    });

router.route('/initCommentcount')
    .post(function (req, res) {
        articleService.initCommentCount().then(() => {
            res.status(202).send();
        }).catch((err) => {
            res.status(500).send(err);
        })
    })

router.route('/initDiscussion')
    .post(function (req, res) {
        discussionService.initDiscussion(function (err) {
            if (err) res.status(400).send(err);
            res.status(202).send();
        });
        res.status(202).send();
    });


/** Article Router */
router.route('/')
    /** GET: Get all articles */
    .get(function (req, res) {
        let searchQuery = req.query.search;

        /** If no search query is specified , find all documents */
        if (searchQuery === undefined || searchQuery === '') {
            articleService.findAll(function (err, docs) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send(docs);
                }
            });
        } else {
            articleService.findByContent(searchQuery, function (err, docs) {
                if (err) res.status(404).send(err);
                else {
                    res.status(200).send(docs);
                }
            });
        }
    })
    /** POST: Submit new article to server*/
    .post(function (req, res) {
        let article = req.body;
        articleService.save(article, function (err, articleId) {
            if (err) {
                res.status(400).send(err);
            } else {
                if (article.tags) {
                    let tagsId = [];
                    for (let tag of article.tags) {
                        tagsId.push(tag.tag_id);
                    }
                    tagService.pushArticleToTags(articleId, tagsId).then(() => {
                        res.status(201).send();
                    }).catch((err) => {
                        res.status(400).send(err);
                    })
                } else {
                    res.status(201).send();
                }
            }
        });
    });

router.route('/users/:userId/suggestions')
    .get(function (req, res) {
        let user = req.params.userId;
        articleService.serveFeaturedArticlesForUser(user).then((articles) => {
            res.status(200).send(articles);
        }).catch((err) => {
            res.status(404).send(err);
        });
    })


/**
 * --------Begin of TAG Request -----------------------------------------------------
 */

router.route('/tags')
    .get(function (req, res) {
        tagService.findAll(function (err, docs) {
            if (err) {
                res.status(404).send(err);
            } else {
                res.status(200).send(docs);
            }
        })
    })
    .post(function (req, res) {
        let tag = req.body;
        tagService.save(tag, function (err) {
            if (err) res.status(400).send(err);
            else {
                res.status(201).send();
            }
        })
    });

router.route('/tags/:tagId')
    .get(function (req, res) {
        let tagId = req.params.tagId;
        tagService.findOne(tagId, function (err, doc) {
            if (err) res.status(400).send(err);
            else {
                res.status(200).send(doc);
            }
        });
    })
    .put(function (req, res) {
        let tagId = req.params.tagId;
        let body = req.body;
        tagService.update(tagId, body, function (err) {
            if (err) res.status(400).send();
            else {
                res.status(202).send();
            }
        });
    })
    .delete(function (req, res) {
        let tagId = req.params.tagId;
        tagService.remove(tagId, function (err) {
            if (err) res.status(400).send(err);
            else {
                res.status(202).send();
            }
        });
    });

/**
 * ----End of TAG Request-----------------------------------------------------
 */




/**
 * Route with Article Id
 */

router.route('/:articleId')
    /** GET: Get article with _id */
    .get(function (req, res) {
        let articleId = req.params.articleId;
        articleService.findOne(articleId, function (err, doc) {
            if (err) {
                res.status(404).send(err);
            } else {
                res.status(200).send(doc);
            }
        });
    })
    /** PUT: Update document */
    .put(function (req, res) {
        let articleId = req.params.articleId;
        let article = req.body;
        articleService.update(articleId, article).then(() => {
            res.status(202).send();
        }).catch((err) => {
            console.error(err);
            res.status(400).send();
        });
    })
    /** DELETE: Remove document */
    .delete(function (req, res) {
        let articleId = req.params.articleId;
        articleService.remove(articleId, function (err) {
            if (err) {
                res.status(404).send(err);
            } else {
                res.status(202).send();
            }
        });
    });

/**
 * Route request for comment
 */
router.route('/:articleId/comments')
    .get(function (req, res) {
        let articleId = req.params.articleId;
        discussionService.findOne(articleId, function (err, doc) {
            if (err) res.status(404).send();
            res.status(200).send(doc);
        })
    })
    .post(function (req, res) {
        let comment = req.body;
        let articleId = req.params.articleId;
        discussionService.addComment(articleId, comment, function (err) {
            if (err) res.status(400).send(err);
            else {
                articleService.increaseCommentCount(articleId).then(() => {
                    res.status(201).send();
                }).catch((err) => {
                    res.status(400).send(err);
                })
            }
        });
    });

router.route('/:articleId/comments/:commentId')
    .get(function (req, res) {
        let commentId = req.params.commentId;
        discussionService.findComment(commentId, function (err, doc) {
            if (err) res.status(404).send(err);
            res.status(200).send(doc);
        });
    })
    .put(function (req, res) {
        let comment = req.body;
        console.log(chalk.yellow(comment.text));
        let articleId = req.params.articleId;
        comment._id = req.params.commentId;
        discussionService.editComment(articleId, comment, function (err) {
            if (err) res.status(400).send(err);
            res.status(202).send();
        });
    })
    .delete(function (req, res) {
        let articleId = req.params.articleId;
        let commentId = req.params.commentId;
        discussionService.removeComment(articleId, commentId, function (err) {
            if (err) res.status(400).send(err);
            else {
                articleService.decreaseCommentCount(articleId).then(() => {
                    res.status(202).send();
                }).catch((err) => {
                    res.status(400).send(err);
                });
            }
        });
    });

/**
 * End of comment request
 */


/**
 * Get participants in article
 */

router.route('/:articleId/participants')
    .get(function (req, res) {
        let articleId = req.params.articleId;
        discussionService.getParticipants(articleId, function (err, doc) {
            if (err) res.status(404).send(err);
            res.status(200).send(doc);
        });
    })


module.exports = router;
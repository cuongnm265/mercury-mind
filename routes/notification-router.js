let express = require('express');
let router = express.Router();

let NotificationService = require('../mongoose/services/notification/notification-service');

const chalk = require('chalk');


/** Notification Route: /notification */


/** Get notification of user*/
router.route('/users/:userId')
    .get(function (req, res) {
        let recipient = req.params.userId;
        NotificationService.findbyUser(recipient, function (err, docs) {
            if(err) res.status(400).send(err);
            res.status(200).send(docs);
        })
    });
router.route('/types')
    /*Get all notification types*/
    .get(function (req, res) {
        NotificationService.findAllType(function (err, docs) {
            if (err) res.status(400).send(err);
            res.status(200).send(docs);
        });
    })
    /**Post new notifcation type */
    .post(function (req, res) {
        let newType = req.body;
        NotificationService.saveType(newType, function (err) {
            if (err) res.status(400).send(err);
            res.status(201).send();
        })
    });


router.route('/pushNotification')
    .post(function (req, res) {
        let notification = req.body;
        NotificationService.pushNotification(notification).then(() => {
            res.status(202).send();
        }).catch((err) => {
            res.status(400).send();
        })
    });
module.exports = router;
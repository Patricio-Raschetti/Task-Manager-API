const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    };
});

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    let { sortBy, completed, limit, skip } = req.query;
    limit = parseInt(limit);
    skip = parseInt(skip);

    if (completed) {
        if (completed.toLowerCase() === 'true' || completed.toLowerCase() === 'false') {
            match.completed = completed;
        };
    };
    if (sortBy) {
        const [field, direction] = sortBy.split(/_|:/);
        sort[field] = direction.toLowerCase() === 'desc' ? -1 : 1;
    };

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit,
                skip,
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    };
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            res.status(404).send();
        };
        res.send(task);
    } catch (e) {
        res.status(500).send();
    };
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid update within.'});
    };
    
    const _id = req.params-id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send();
        };
        updates.forEach(update => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send();
    };
});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        };
        res.send(task);
    } catch (e) {
        res.status(500).send();
    };
});

module.exports = router;
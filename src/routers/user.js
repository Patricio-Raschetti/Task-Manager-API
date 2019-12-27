const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();

// Public routes
// Create User.
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthTokenAndSave();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    };
});

// Login User.
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthTokenAndSave();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    };
});

// Auth routes.
// Logout User.
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    };
});

// Logout All Users.
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    };
});


router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        };
        res.send(user);
    } catch (e) {
        res.status(500).send();
    };
});

router.patch('/users/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update within.'});
    };

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        };
        
        for (const update of updates) {
            user[update] = req.body[update];
        };
        await user.save();
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}); removed to use Middleware in Model's Schema.
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    };
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        };
        res.send(user);
    } catch (e) {
        res.status(500).send();
    };
});

module.exports = router;
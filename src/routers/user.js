const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../services/emails');
const router = new express.Router();

// Public routes
// Create User.
router.post('/users', async (req, res) => {
    const allowedFields = ['name', 'age', 'email', 'password'];
    const isValidOperation = Object.keys(req.body).some(field => !allowedFields.includes(field));
    if (isValidOperation) {
        res.status(400).send('Invalid data within.');
    };
    try {
        const user = new User(req.body);
        const token = await user.generateAuthTokenAndSave();
        sendWelcomeEmail(user.email, user.name);
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

// Get User.
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

// Update User.
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update within.'});
    };
    try {
        for (const update of updates) {
            req.user[update] = req.body[update];
        };
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    };
});

// Delete User.
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    };
});


// Upload User Avatar.
router.post('/users/me/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 300, height: 300 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

// Get User Avatar.
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user.avatar) {
            throw new Error();
        };
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    };
});

// Delete User Avatar.
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = null;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    };
});


module.exports = router;
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../data/dbConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'shh';

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json('username and password required');
    }

    const existingUser = await db('users').where('username', username).first();
    if (existingUser) {
      return res.status(400).json('username taken');
    }

    const hash = bcrypt.hashSync(password, 8);
    const [id] = await db('users').insert({ username, password: hash });
    const newUser = await db('users').where('id', id).first();

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json('username and password required');
    }

    const user = await db('users').where('username', username).first();
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json('invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: `welcome, ${user.username}`,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

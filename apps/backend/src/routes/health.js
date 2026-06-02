const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'sti-backend',
    status: 'online'
  });
});

module.exports = router;

// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Port : Render utilise process.env.PORT (par défaut 10000)
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Clé secrète Yoco (doit être dans Render > Environment)
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

if (!YOCO_SECRET_KEY) {
  console.warn('⚠️ Attention : YOCO_SECRET_KEY non définie. Le paiement ne fonctionnera pas.');
}

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('❌ Fichier index.html non trouvé');
      res.status(500).send('Erreur : fichier HTML non trouvé.');
    }
  });
});

// Route de paiement
app.post('/paiement', async (req, res) => {
  const { token, amount } = req.body;

  if (!token || !amount) {
    return res.status(400).json({ message: 'Données manquantes : token ou montant.' });
  }

  if (!YOCO_SECRET_KEY) {
    return res.status(500).json({ message: '❌ Configuration : clé Yoco manquante.' });
  }

  try {
    const response = await fetch('https://api.yoco.com/v1/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Secret-Key': YOCO_SECRET_KEY
      },
      body: JSON.stringify({
        token,
        amountInCents: amount,
        currency: 'ZAR'
      })
    });

    const charge = await response.json();

    if (charge.status === 'SUCCESSFUL') {
      return res.json({
        message: `✅ Paiement réussi ! Montant : R${(amount / 100).toFixed(2)}`
      });
    } else {
      console.error('❌ Échec Yoco:', charge.error || charge);
      return res.status(400).json({
        message: `❌ Paiement refusé : ${charge.message || 'Erreur inconnue'}`
      });
    }
  } catch (error) {
    console.error('❌ Erreur serveur:', error.message);
    return res.status(500).json({
      message: 'Erreur réseau ou clé Yoco invalide.'
    });
  }
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
  console.log(`🔗 Accès : https://yoco-jsrb.onrender.com`);
});
require('dotenv').config();
const isHttp = require('is-http-url');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);

const urlSchema = new mongoose.Schema({
    original_url: {
        type: String,
        required: true
    },
    short_url: Number
});

let Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:urlShort', function(req, res) {
  Url.findOne({short_url: req.params.urlShort}).exec().then(data => {
    res.redirect(data.original_url);
  });
});

app.post('/api/shorturl', async (req, res) => {
  try {
    if (!isHttp(req.body.url)) throw new Error('invalid url');
    let url = new URL(req.body.url);
    let data = await findUrl(url.href);
    if (data) {
      res.json({original_url: data.original_url, short_url: data.short_url});
    } else {
      let short_url = Math.floor(Math.random() * 1000);
      let newUrl = new Url({original_url: url.href, short_url: short_url});
      newUrl.save().then(data => {
        res.json({original_url: data.original_url, short_url: data.short_url});
      });
    }
  } catch (e) {
    console.log(e);
    res.json({error: "invalid url"});
  }
});

async function findUrl(url, done) {
  return await Url.findOne({original_url: url}).exec();
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
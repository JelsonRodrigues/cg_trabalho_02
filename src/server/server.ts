const express = require('express');

const app = express();

// server will respond with files in src folder
app.use(express.static('src'));

app.listen('3000');
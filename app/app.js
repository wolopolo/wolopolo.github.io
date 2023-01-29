const express = require("express");
require('dotenv').config();

const app = express();
app.use(express.static(__dirname + '/publics'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home', {error: null});
});

const PORT = process.env.PORT_APP;
app.listen(PORT, () => {
    console.info("Server running at http://localhost:" + PORT);
});


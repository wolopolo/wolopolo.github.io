const express = require("express");
const fs = require("fs");
require('dotenv').config();

const app = express();
app.use(express.static(__dirname + '/publics'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home', { error: null });
});

const categories_api = require('./api/category-api');
const posts_api = require('./api/post-api');
const controller = [...categories_api, ...posts_api];

controller.forEach(api => {
    switch (api.method) {
        case 'GET':
            app.get(api.path, api.service);
            break;
        case 'POST':
            app.post(api.path, api.service);
            break;
        case 'PUT':
            app.put(api.path, api.service);
            break;
        case 'DELETE':
            app.delete(api.path, api.service);
            break;
        default:
            break;
    }
})

app.use((err, req, res, next) => {
    // res.setHeader("Content-type", "application/json");
    res.status(500);
    res.json(err);
    res.end();
})

const PORT = process.env.PORT_APP;
app.listen(PORT, () => {
    console.info("Server running at http://localhost:" + PORT);
});


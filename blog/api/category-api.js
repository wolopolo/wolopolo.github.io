const fs = require('fs');

const CATEGORY_PATH = '/categories';

function getCategories(req, res, next) {
    fs.readFile("data/category.json", "utf-8", (error, data) => {
        if (error) {
            next({ status: 500, message: error.message });
            return;
        }
        let categories = JSON.parse(data).map(c => { c.name });
        res.json({ status: 200, data: categories });
        res.end();
    });
}

module.exports = [
    {
        path: CATEGORY_PATH,
        method: 'GET',
        service: getCategories
    }
]
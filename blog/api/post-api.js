const fs = require('fs');
const util = require('../util/util');


const POST_PATH = '/posts';

function getPost(req, res, next) {
    fs.readFile("data/category.json", "utf-8", (error, data) => {
        if(error) {
            next({status: 500, message: error.message});
            return;
        }
        let posts = [];
        JSON.parse(data).forEach(c => posts.push(...c.posts));
        posts = posts.sort((o1, o2) => {
            let t1 = new Date(o1.createdDate).getTime();
            let t2 = new Date(o2.createdDate).getTime();
            return t1 - t2;
        }).filter((item, pos, ary) => {
            return !pos || item.id != ary[pos - 1].id;
        });
        res.json({status: 200, data: posts});
        res.end();
    });
};

function getPostDetail(req, res, next) {
    fs.readFile("data/" + req.params.postId + ".json", "utf-8", (error, data) => {
        if(error) {
            next({status: 500, message: error.message});
            return;
        }
        res.json({status: 200, data: JSON.parse(data)});
        res.end();
    });
};

function savePost(req, res, next) {
    const body = req.body;
    // new post
    if (util.isEmpty(body.id)) {
        body.id = new Date().getTime();
    }

    // save json data of post
    fs.writeFile('data/' + body.id + '.json', body, (error) => {
        if(error) {
            console.error(error.message);
            next({ status: 500, message: error.message});
            return;
        } else {
            console.info("Save file sucessful!");
        }
    });
    
    fs.readFile('data/category.json', (error, data) => {
        if(error) {
            console.error(error.message);
            next({ status: 500, message: error.message});
            return;
        }
        const newPostInCategory = {
            id: body.id,
            title: body.title,
            createdDate: body.createdDate,
            quote: body.quote
        };
        const categories = JSON.parse(data);
        const categoryIndex = categories.find(c => c.name == body.category);
        if(categoryIndex == undefined) next({status: 500, message: "Category không tồn tại!"});
        const category = categories[categoryIndex];
        const postIndex = category.posts.find(p => p.id == body.id);
        if(postIndex == undefined) {
            category.posts.push(newPostInCategory)
        } else {
            category.posts[postIndex] = newPostInCategory;
        }
        
        fs.writeFile('data/category.json', categories, (err) => {
            if(err) {
                console.error(err.message);
                next({ status: 500, message: err.message});
                return;
            }

            res.status(200);
            res.end();
        })
    });
}

function publishPost(req, res, next) {
    const postId = req.params.postId;
    fs.readFile("data/" + postId + ".json", (error, data) => {
        if(error) {
            next({status: 500, message: error.message});
            return;
        }
        
        const post = JSON.parse(data);

        fs.readdir("post", (error, files) => {
            if(error) {
                next({status: 500, message: error.message});
                return;
            }
    
            // load template
            // insert html post
            fs.readFile("post/template.html", (error, template) => {
                if(error) {
                    next({status: 500, message: error.message});
                    return;
                }
                
                template.replace("$post_content", .content);
            })
    
            const index = files.find(file => {
                var parts = file.split("_");
                return parts[parts.length - 1] == (postId + ".html");
            })
            if(index == undefined) {
                // create new file
    
            } else {
                // override
            }
        })
    });
}

module.exports = [
    {
        path: POST_PATH,
        method: 'GET',
        service: getPost
    },
    {
        path: POST_PATH + "/:postId",
        method: 'GET',
        service: getPostDetail
    },
    {
        path: POST_PATH,
        method: 'POST',
        service: savePost
    },
    {
        path: POST_PATH + "/publish/:postId",
        method: 'POST',
        service: publishPost
    }
]
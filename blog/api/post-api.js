const fs = require('fs');
const util = require('../util/util');
const showdown = require('showdown');
const simpleGit = require('simple-git');


const POST_PATH = '/api/posts';

function getPost(req, res, next) {
    fs.readFile("data/category.json", "utf-8", (error, data) => {
        if (error) {
            next({ status: 500, message: error.message });
            return;
        }
        let posts = [];
        JSON.parse(data).forEach(c => posts.push(...c.posts));
        posts = posts.sort((o1, o2) => {
            let t1 = new Date(o1.createdDate).getTime();
            let t2 = new Date(o2.createdDate).getTime();
            return t2 - t1;
        }).filter((item, pos, ary) => {
            return !pos || item.id != ary[pos - 1].id;
        });
        res.json({ status: 200, data: posts });
        res.end();
    });
};

function getPostDetail(req, res, next) {
    fs.readFile("data/" + req.params.postId + ".json", "utf-8", (error, data) => {
        if (error) {
            next({ status: 500, message: error.message });
            return;
        }
        res.json({ status: 200, data: JSON.parse(data) });
        res.end();
    });
};

function savePost(req, res, next) {
    const body = req.body;
    // new post
    if (util.isEmpty(body.id)) {
        body.id = new Date().getTime();
        body.status = 'TEMPORARY';
    }

    // save json data of post
    fs.writeFile('data/' + body.id + '.json', JSON.stringify(body), (error) => {
        if (error) {
            console.error(error.message);
            next({ status: 500, message: error.message });
            return;
        } else {
            console.info("Save file sucessful!");
        }
    });

    fs.readFile('data/category.json', (error, data) => {
        if (error) {
            console.error(error.message);
            next({ status: 500, message: error.message });
            return;
        }
        const newPostInCategory = {
            id: body.id,
            title: body.title,
            createdDate: body.createdDate,
            quote: body.quote,
            status: body.status
        };
        const categories = JSON.parse(data);
        const categoryIndex = categories.findIndex(c => c.name == body.category);
        if (categoryIndex == -1) next({ status: 500, message: "Category không tồn tại!" });
        const category = categories[categoryIndex];
        const postIndex = category.posts.findIndex(p => p.id == body.id);
        if (postIndex == -1) {
            category.posts.push(newPostInCategory)
        } else {
            category.posts[postIndex] = newPostInCategory;
        }

        fs.writeFile('data/category.json', JSON.stringify(categories), (err) => {
            if (err) {
                console.error(err.message);
                next({ status: 500, message: err.message });
                return;
            }

            let result = comitAndPushPostToGit('save post: ' + body.ttitle);

            if (result) {
                res.json({ status: 200, data: body });
                res.end();
            } else {
                res.status(500);
                res.json({ status: 500, message: 'Có lỗi khi save data trên github' });
                res.end();
            }
        })
    });
}

function publishPost(req, res, next) {
    const postId = req.params.postId;
    fs.readFile("data/" + postId + ".json", (error, data) => {
        if (error) {
            next({ status: 500, message: error.message });
            return;
        }

        const post = JSON.parse(data);

        fs.readdir("../archive", (error, files) => {
            if (error) {
                next({ status: 500, message: error.message });
                return;
            }

            // load template
            // insert html post
            fs.readFile("views/template.html", (error, template) => {
                if (error) {
                    next({ status: 500, message: error.message });
                    return;
                }

                const html = generateHTMLPost(template.toString(), post);

                const fileIndex = files.findIndex(file => {
                    var parts = file.split("_");
                    return parts[parts.length - 1] == (postId + ".html");
                })

                // xóa file cũ nếu có
                if (fileIndex != -1) {
                    fs.unlink("../archive/" + files[fileIndex], (err) => {
                        if (err) console.log(err.message);
                    });
                }

                // tạo file mới
                let fileName = util.toLowerCaseNonAccentVietnamese(post.title).replaceAll(' ', '_')
                    + "_" + post.id + ".html";
                fs.writeFile("../archive/" + fileName, html, (err) => {
                    if (err) {
                        console.error(err);
                        next({ status: 500, message: err.message });
                        return;
                    };

                    let isSuccess = comitAndPushPostToGit("[post] " + fileName);
                    if (isSuccess) {
                        // update status of post and 
                        // save json data of post
                        post.status = "PUBLISHED";

                        fs.writeFile('data/' + postId + '.json', JSON.stringify(post), (error) => {
                            if (error) {
                                console.error(error.message);
                                next({ status: 500, message: error.message });
                                return;
                            } else {
                                console.info("Save file sucessful!");
                            }
                        });

                        fs.readFile('data/category.json', (error, data) => {
                            if (error) {
                                console.error(error.message);
                                next({ status: 500, message: error.message });
                                return;
                            }
                            const newPostInCategory = {
                                id: post.id,
                                title: post.title,
                                createdDate: post.createdDate,
                                quote: post.quote,
                                status: post.status
                            };
                            const categories = JSON.parse(data);
                            const categoryIndex = categories.findIndex(c => c.name == post.category);
                            if (categoryIndex == -1) next({ status: 500, message: "Category không tồn tại!" });
                            const category = categories[categoryIndex];
                            const postIndex = category.posts.findIndex(p => p.id == post.id);
                            if (postIndex == -1) {
                                category.posts.push(newPostInCategory)
                            } else {
                                category.posts[postIndex] = newPostInCategory;
                            }

                            fs.writeFile('data/category.json', JSON.stringify(categories), (err) => {
                                if (err) {
                                    console.error(err.message);
                                    next({ status: 500, message: err.message });
                                    return;
                                }
                                res.json({ status: 200, message: "Success" });
                                res.end();
                            })
                        });
                    } else {
                        res.status(500);
                        res.json({ status: 500, message: "Fail" });
                        res.end();
                    }
                })
            })
        })
    });
}

function generateHTMLPost(template, post) {
    let mdStr = post.content;
    const converter = new showdown.Converter();
    converter.setOption('noHeaderId', true);
    let htmlStr = converter.makeHtml(mdStr);

    let titleLevels = [];
    while (/###\s.+\n/.test(mdStr)) {
        let h3 = /###\s.+\n/.exec(mdStr)[0].replace('### ', '').replace('\n', '');
        titleLevels.push(h3);
        mdStr = mdStr.replace(/###\s.+\n/, "$$$");
    }

    let headerIndex = 0;
    let titleLevel = '';
    while (/<h3>/.test(htmlStr)) {
        let idHeader = 'ih' + headerIndex;
        htmlStr = htmlStr.replace('<h3>', '<h3 id="' + idHeader + '">');
        titleLevel += '<a href="#' + idHeader + '">' + titleLevels[headerIndex] + '</a>'
        headerIndex++;
    }


    template = template.replace("$postTitle", post.title);
    template = template.replace("$postContent", htmlStr);
    template = template.replace("$titleLevel", titleLevel);
    template = template.replace("$createdDate", new Date(post.createdDate).toLocaleDateString('vi'));

    return template;
}

function comitAndPushPostToGit(messageCommit) {
    const git = simpleGit.simpleGit("../", { binary: 'git' });
    git.raw('add', '.', err => console.error(err.message));
    git.raw('commit', '-m ' + messageCommit, err => console.error(err.message));
    git.raw('push', err => console.error(err.message));
    return true;
}

function deletePost(req, res, next) {
    const postId = req.params.postId;

    // xóa ở data
    fs.readFile('data/' + postId + ".json", (err, data) => {
        if (err) {
            console.error(err.message);
            next({ status: 500, message: err.message });
            return;
        }
        const post = JSON.parse(data);
        fs.unlink("data/" + postId + ".json", (error) => {
            if (error) {
                console.error(error.message);
                next({ status: 500, message: error.message });
                return;
            }
        });

        // xóa ở category
        fs.readFile('data/category.json', (error, data) => {
            if (error) {
                console.error(error.message);
                next({ status: 500, message: error.message });
                return;
            }
            const categories = JSON.parse(data);
            const categoryIndex = categories.findIndex(c => c.name == post.category);
            if (categoryIndex == -1) next({ status: 500, message: "Category không tồn tại!" });
            const category = categories[categoryIndex];
            category.posts = category.posts.filter(p => p.id != post.id);

            fs.writeFile('data/category.json', JSON.stringify(categories), (err) => {
                if (err) {
                    console.error(err.message);
                    next({ status: 500, message: err.message });
                    return;
                }
            })
        });
    });

    // xóa ở post nếu có
    fs.readdir("../archive", (error, files) => {
        if (error) {
            next({ status: 500, message: error.message });
            return;
        }
        const fileIndex = files.findIndex(file => {
            var parts = file.split("_");
            return parts[parts.length - 1] == (postId + ".html");
        })

        // xóa file cũ nếu có
        if (fileIndex != -1) {
            fs.unlink("../archive/" + files[fileIndex], (err) => {
                if (err) console.log(err.message);
            });
        }
    })

    let isSuccess = comitAndPushPostToGit("[delete] delete post :" + postId);

    if (isSuccess) {
        res.json({ status: 200, message: "Success" });
        res.end();
    } else {
        res.json({ status: 500, message: "Đã có lỗi xảy ra" });
        res.end();
    }

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
    },
    {
        path: POST_PATH + "/:postId",
        method: 'DELETE',
        service: deletePost
    }
]

// for index.html
// fetch category
function generateElementHomePage() {
    fetch('blog/data/category.json')
        .then((response) => response.json())
        .then(categories => {
            // generate list element category
            categories.forEach(category => {
                let element = '<a class="item_category" href="category.html?category=' + category.name + '" >' + category.name + '</a>';
                document.getElementById("categories").insertAdjacentHTML('beforeend', element);
            })

            // generate list new post
            let posts = [];
            categories.forEach(c => posts.push(...c.posts.filter(p => p.status == "PUBLISHED")));
            let newPosts = posts.sort((o1, o2) => {
                let t1 = new Date(o1.createdDate).getTime();
                let t2 = new Date(o2.createdDate).getTime();
                return t2 - t1;
            }).filter((item, pos, ary) => {
                return !pos || item.id != ary[pos - 1].id;
            }).slice(0, 6);
            newPosts.forEach(newPost => {
                let element = `<a class="item_post" href="` + newPost.link + `">
                        <div class="item_date">` + new Date(newPost.createdDate).toLocaleDateString("vi") + `</div>
                        <div class="item_title">` + newPost.title + `</div>
                        <div class="item_temp">` + newPost.quote + `</div>
                    </a>`;
                document.getElementById("newPosts").insertAdjacentHTML('beforeend', element);
            })

            // generate list post of each category
            categories.forEach(category => {
                let postsInCate = category.posts.filter(p => p.status == "PUBLISHED").slice(-6);
                let element = `<div>
                    <div class="title_category">` + category.name + `</div>
                    <div class="list_item_category">`;

                postsInCate.forEach(p => {
                    element += `<a class="item_post" href="` + p.link + `">
                        <div class="item_date">` + new Date(p.createdDate).toLocaleDateString("vi") + `</div>
                        <div class="item_title">` + p.title + `</div>
                        <div class="item_temp">` + p.quote + `</div>
                    </a>`
                })

                element += `</div></div>`;

                document.getElementById("main").insertAdjacentHTML('beforeend', element);
            })
        });
}
generateElementHomePage();

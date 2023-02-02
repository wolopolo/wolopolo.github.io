
// for category.html
// fetch category
function generateElementAllPostPage() {
    fetch('blog/data/category.json')
        .then((response) => response.json())
        .then(categories => {

            let element = ``;
            categories.forEach(category => category.posts.filter(p => p.status == "PUBLISHED")
                .forEach(post => {
                    element += `<a class="item_post" href="` + post.link + `">
                    <div class="item_date">` + post.createdDate + `</div>
                    <div class="item_title">` + post.title + `</div>
                    <div class="item_temp">` + post.quote + `</div>
                </a>`
                }));

            document.getElementById("all_post").insertAdjacentHTML('beforeend', element);
        })
}
generateElementAllPostPage();
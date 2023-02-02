
// for category.html
// fetch category
function generateElementCategoryPage() {
    fetch('blog/data/category.json')
        .then((response) => response.json())
        .then(categories => {
            const urlParams = new URLSearchParams(window.location.search);
            const selectedCategory = urlParams.get('category');

            const category = categories.find(c => c.name = selectedCategory);
            document.getElementById("category_name").innerText = category.name;
            let element = ``;
            category.posts.forEach(post => {
                if (post.status == "PUBLISHED") {
                    element += `<a class="item_post" href="` + post.link + `">
                        <div class="item_date">` + post.createdDate + `</div>
                        <div class="item_title">` + post.title + `</div>
                        <div class="item_temp">` + post.quote + `</div>
                    </a>`
                }
            })
            document.getElementById("post_in_category").insertAdjacentHTML('beforeend', element);
        })
}
generateElementCategoryPage();
var simplemde = new SimpleMDE({
    element: document.getElementById("md_editor"),
    spellChecker: false
});

var CURRENT_POST = "";

function saveTemp() {
    const title = document.getElementById("postName").value;
    if (title.trim() == '') {
        window.alert("Tên bài viết chưa được đặt");
    }
}

const API = "http://localhost:7777/api";
const CATEGORIES_PATH = "/categories";
function getCategories() {
    fetch(API + CATEGORIES_PATH)
        .then((response) => response.json())
        .then(response => {
            if(response.status == 200) {
                return response.data;
            } else {
                alert("Đã có lỗi xảy ra khi load các bài viết!");
            }
        })
        .then((categories) => {
            // render list category
            categories.forEach(category => {
                let element = '<option value="' + category.name + '">' + category.name + '</option>';
                document.getElementById("category").insertAdjacentHTML('beforeend', element);
            })
        })
        .catch(reason => {
            console.error(reason);
        });
}
getCategories();

const POST_PATH = "/posts"; 
function getPosts() {
    fetch(API + POST_PATH)
        .then((response) => response.json())
        .then(response => {
            if(response.status == 200) {
                return response.data;
            } else {
                alert("Đã có lỗi xảy ra khi load các bài viết!");
            }
        })
        .then(posts => {
            // render list post
            posts.forEach((post) => {
                let element = '<a class="e_post" href="#" onclick="selectPost(\'' + post.id + '\')">' + post.title + '</a>';
                document.getElementById("folder").insertAdjacentHTML('beforeend', element);
            })
        });
}

function selectPost(postId) {
    let isLoad = true;
    if(CURRENT_POST != "" && CURRENT_POST != simplemde.value()) {
        isLoad = window.confirm("Mọi thay đổi sẽ không được lưu? Bạn chắc hủy bỏ không?")
    }

    if(isLoad) {
        fetch(API + POST_PATH + "/" + postId)
        .then(response => response.json())
        .then(response => {
            if(response.status == 200) {
                return response.data;
            } else {
                window.alert("Đã có lỗi xảy ra khi load chi tiết bài viết!");
            }
        })
        .then(data => {
            document.getElementById("postId").value = data.id;
            document.getElementById("postTitle").value = data.title;
            document.getElementById("category").value = data.category;
            document.getElementById("postQuote").value = data.quote;
            simplemde.value(data.content);
            CURRENT_POST = data.content;
        })
        .catch(reason => {
            console.error(reason);
        });
    }
}

function saveTemporary() {
    const post = {};
    post["id"] = document.getElementById("postId").value;
    post["title"] = document.getElementById("postTitle").value;
    post["category"] = document.getElementById("category").value;
    post["quote"] = document.getElementById("postQuote").value;
    post["createdDate"] = new Date().toUTCString();
    fetch(API + POST_PATH, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(post)
    })
    .then(response => response.json())
    .then(response => {
        if(response.status == 200) {
            window.alert("Lưu thành công!");
        } else {
            window.alert("Lưu thất bại!");
        }
    })
}

function publishPost() {
    let isAccept = true;
    if(CURRENT_POST != "" && CURRENT_POST != simplemde.value()) {
        isAccept = window.confirm("Mọi thay đổi sẽ không được lưu? Hãy lưu trước khi xuất bản!")
    }

    if(isAccept) {
        const postId = document.getElementById("postId").value;
        fetch(API + POST_PATH + "/publish/" + postId, {method: 'POST'})
        .then(response => response.json())
        .then(response => {
            if(response.status == 200) {
                window.alert("Xuất bản thành công!");
            } else {
                window.alert("Xuất bản thất bại!");
            }
        })
    }
}

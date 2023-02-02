var simplemde = new SimpleMDE({
    element: document.getElementById("md_editor"),
    spellChecker: false
});

var CURRENT_POST_ID = "";
var CURRENT_POST = "";

const API = "http://localhost:7777/api";
const CATEGORIES_PATH = "/categories";

function renderCategories(categories) {
    categories.forEach(category => {
        let element = '<option value="' + category.name + '">' + category.name + '</option>';
        document.getElementById("category").insertAdjacentHTML('beforeend', element);
    })
}

function loadCategories() {
    fetch(API + CATEGORIES_PATH)
        .then((response) => response.json())
        .then(response => {
            if (response.status == 200) {
                return response.data;
            } else {
                alert("Đã có lỗi xảy ra khi load các bài viết!");
            }
        })
        .then(categories => renderCategories(categories))
        .catch(reason => {
            console.error(reason);
        });
}
loadCategories();

const POST_PATH = "/posts";
function renderListPost(posts) {
    document.getElementById("list_post").innerText = '';
    posts.forEach((post) => {
        let element = '<a class="e_post" href="#" onclick="selectPost(\'' + post.id + '\')">' + post.title + '</a>';
        document.getElementById("list_post").insertAdjacentHTML('beforeend', element);
    })
}
function loadPosts() {
    fetch(API + POST_PATH)
        .then((response) => response.json())
        .then(response => {
            if (response.status == 200) {
                return response.data;
            } else {
                alert("Đã có lỗi xảy ra khi load các bài viết!");
            }
        })
        .then(posts => renderListPost(posts));
}
loadPosts();

function createNewPost() {
    let isLoad = true;
    if (CURRENT_POST != simplemde.value()) {
        isLoad = window.confirm("Mọi thay đổi sẽ không được lưu? Bạn chắc hủy bỏ không?")
    }

    if (isLoad) {
        document.getElementById("postId").value = '';
        document.getElementById("postTitle").value = '';
        document.getElementById("category").value = '';
        document.getElementById("postQuote").value = '';
        document.getElementById("createdDateViewer").innerHTML = '';
        document.getElementById("updatedDateViewer").innerHTML = '';
        simplemde.value('');
        CURRENT_POST = '';
    }
}

function renderPost(post) {
    document.getElementById("postId").value = post.id;
    document.getElementById("postTitle").value = post.title;
    document.getElementById("category").value = post.category;
    document.getElementById("postQuote").value = post.quote;
    document.getElementById("createdDate").value = post.createdDate;
    document.getElementById("createdDateViewer").innerHTML = new Date(post.createdDate).toLocaleDateString('vi');
    document.getElementById("updatedDateViewer").innerHTML = post.updatedDate == null || post.updatedDate == undefined ? "" : new Date(post.updatedDate).toLocaleDateString('vi');
    document.getElementById("postStatus").value = post.status;
    simplemde.value(post.content);
}

function selectPost(postId) {
    let isLoad = true;
    if (CURRENT_POST != "" && CURRENT_POST != simplemde.value()
        || (CURRENT_POST == "" && simplemde.value() != "")) {
        isLoad = window.confirm("Mọi thay đổi sẽ không được lưu? Bạn chắc hủy bỏ không?")
    }

    if (isLoad) {
        fetch(API + POST_PATH + "/" + postId)
            .then(response => response.json())
            .then(response => {
                if (response.status == 200) {
                    return response.data;
                } else {
                    window.alert("Đã có lỗi xảy ra khi load chi tiết bài viết!");
                }
            })
            .then(data => {
                renderPost(data);
                CURRENT_POST_ID = data.id;
                CURRENT_POST = data.content;
            })
            .catch(reason => {
                console.error(reason);
            });
    }
}

function savePost() {
    const post = {};
    post["id"] = document.getElementById("postId").value;

    const title = document.getElementById("postTitle").value;
    if (title.trim() == '') {
        window.alert("Tên bài viết không được để trống!");
        return;
    }
    post["title"] = title;

    const category = document.getElementById("category").value
    if (category.trim() == '') {
        window.alert("Loại bài viết không được để trống!");
        return;
    }
    post["category"] = category;

    const quote = document.getElementById("postQuote").value;
    if (quote.trim() == '') {
        window.alert("Trích dẫn không được để trống!");
        return;
    }
    post["quote"] = quote;

    if (post.id == '') {
        post["createdDate"] = new Date().toISOString();
    } else {
        post["createdDate"] = document.getElementById("createdDate").value;
        post["updatedDate"] = new Date().toISOString();
    }


    const content = simplemde.value();
    if (content.trim() == '') {
        window.alert("Nội dung bài viết không được để trống!");
        return;
    }
    post["content"] = content;

    post["status"] = document.getElementById("postStatus").value;

    fetch(API + POST_PATH, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(post)
    })
        .then(response => response.json())
        .then(response => {
            if (response.status == 200) {
                CURRENT_POST = simplemde.value();
                window.alert("Lưu thành công!");
                renderPost(response.data);
                loadPosts();
            } else {
                window.alert("Lưu thất bại!");
            }
        })
}

function publishPost() {
    if (CURRENT_POST == "") {
        return;
    }

    if ((CURRENT_POST != "" && CURRENT_POST != simplemde.value())) {
        window.alert("Mọi thay đổi sẽ không được lưu? Hãy lưu trước khi xuất bản!");
        return;
    }

    const postId = document.getElementById("postId").value;
    fetch(API + POST_PATH + "/publish/" + postId, { method: 'POST' })
        .then(response => response.json())
        .then(response => {
            if (response.status == 200) {
                window.alert("Xuất bản thành công!");
            } else {
                window.alert("Xuất bản thất bại!");
            }
        })
}


function deletePost() {
    let isAccept = true;
    if ((CURRENT_POST != "" && CURRENT_POST != simplemde.value())) {
        isAccept = window.confirm("Bạn có chắc chắn muốn xóa?")
    }

    if (isAccept) {
        const postId = document.getElementById("postId").value;
        fetch(API + POST_PATH + "/" + postId, { method: 'DELETE' })
            .then(response => response.json())
            .then(response => {
                if (response.status == 200) {
                    CURRENT_POST = '';
                    CURRENT_POST_ID = '';
                    simplemde.value('');
                    createNewPost();
                    window.alert("Xóa thành công!");
                } else {
                    window.alert("Xóa thất bại!");
                }
            })
    }
}

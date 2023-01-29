var simplemde = new SimpleMDE({ 
    element: document.getElementById("md_editor"),
    spellChecker: false
});

function saveTemp() {
    const title = document.getElementById("post_name").value;
    if(title.trim() == '') {
        window.alert("Tên bài viết chưa được đặt");
    }
}
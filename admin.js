let sections = [];
let current = null;

const listEl = document.getElementById("sectionList");
const titleEl = document.getElementById("title");
const contentEl = document.getElementById("content");
const imageEl = document.getElementById("image_url");
const imageFileEl = document.getElementById("image_file");
const previewEl = document.getElementById("image_preview");
const statusEl = document.getElementById("status");
const userbar = document.getElementById("userbar");

function status(t, e = false) {
    statusEl.textContent = t;
    statusEl.className = "status" + (e ? " error" : "");
}

async function requireAdmin() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        location.href = "login.html";
        return null;
    }

    const {
        data: p,
        error: pe
    } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (pe || !p || !["admin", "staff"].includes(p.role)) {
        await supabaseClient.auth.signOut();
        location.href = "login.html";
        return null;
    }

    userbar.textContent = `${user.email} • quyền ${p.role}`;

    return user;
}

function renderList() {
    listEl.innerHTML = "";

    sections.forEach(item => {
        const b = document.createElement("button");

        b.textContent = item.section;

        if (current && current.id === item.id) {
            b.classList.add("active");
        }

        b.onclick = () => selectSection(item.id);

        listEl.appendChild(b);
    });
}

function showPreview(url) {
    if (!previewEl) return;

    if (!url) {
        previewEl.innerHTML = "";
        return;
    }

    previewEl.innerHTML = `
        <img
            src="${url}"
            alt="Ảnh xem trước"
            style="
                max-width:300px;
                max-height:200px;
                border-radius:10px;
                border:1px solid #ddd;
                object-fit:cover;
            "
        >
    `;
}

function selectSection(id) {
    current = sections.find(x => x.id === id);

    if (!current) return;

    titleEl.value = current.title || "";
    contentEl.value = current.content || "";
    imageEl.value = current.image_url || "";

    if (imageFileEl) {
        imageFileEl.value = "";
    }

    showPreview(current.image_url);

    status("");
    renderList();
}

async function uploadImage(file) {
    if (!file) {
        throw new Error("Chưa chọn ảnh.");
    }

    if (!file.type.startsWith("image/")) {
        throw new Error("File được chọn không phải là ảnh.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
    }

    const ext = file.name.split(".").pop().toLowerCase();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filePath = `website/${fileName}`;

    status("Đang upload ảnh...");

    const { error } = await supabaseClient.storage
        .from("site-images")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/jpeg"
        });

    if (error) {
        console.error("Storage upload error:", error);
        throw error;
    }

    const { data: publicData } = supabaseClient.storage
        .from("site-images")
        .getPublicUrl(filePath);

    if (!publicData || !publicData.publicUrl) {
        throw new Error("Không lấy được URL ảnh.");
    }

    return publicData.publicUrl;
}
if (imageFileEl) {
    imageFileEl.addEventListener("change", () => {
        const file = imageFileEl.files[0];

        if (!file) {
            return;
        }

        const localUrl = URL.createObjectURL(file);

        showPreview(localUrl);
    });
}

async function loadContent() {
    status("Đang tải...");

    const {
        data,
        error
    } = await supabaseClient
        .from("site_content")
        .select("id,section,title,content,image_url,updated_at")
        .order("id");

    if (error) {
        status(error.message, true);
        return;
    }

    sections = data || [];

    renderList();

    if (sections.length) {
        selectSection(sections[0].id);
    } else {
        status("Chưa có nội dung.", true);
    }
}

document.getElementById("saveBtn").onclick = async () => {
    if (!current) return;

    try {
        status("Đang lưu...");

        let imageUrl = imageEl.value.trim() || null;

        // Nếu chọn ảnh mới thì upload
        if (imageFileEl && imageFileEl.files.length > 0) {
            imageUrl = await uploadImage(imageFileEl.files[0]);
        }

        const {
            error
        } = await supabaseClient
            .from("site_content")
            .update({
                title: titleEl.value.trim(),
                content: contentEl.value.trim(),
                image_url: imageUrl,
                updated_at: new Date().toISOString()
            })
            .eq("id", current.id);

        if (error) {
            throw error;
        }

        current.title = titleEl.value.trim();
        current.content = contentEl.value.trim();
        current.image_url = imageUrl;

        imageEl.value = imageUrl || "";

        if (imageFileEl) {
            imageFileEl.value = "";
        }

        showPreview(imageUrl);

        status("✓ Đã lưu và cập nhật ảnh.");
    } catch (error) {
        console.error(error);

        status(
            error.message || "Upload/lưu dữ liệu thất bại.",
            true
        );
    }
};

document.getElementById("logoutBtn").onclick = async () => {
    await supabaseClient.auth.signOut();
    location.href = "login.html";
};

(async () => {
    const u = await requireAdmin();

    if (u) {
        await loadContent();
    }
})();

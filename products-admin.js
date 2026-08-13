// ==========================================
// AppleSeed - Product Admin
// products-admin.js
// ==========================================

let products = [];
let editingId = null;
let selectedImageFile = null;

const listEl = document.getElementById("productsList");
const nameEl = document.getElementById("name");
const categoryEl = document.getElementById("category");
const priceEl = document.getElementById("price");
const descriptionEl = document.getElementById("description");
const imageFileEl = document.getElementById("imageFile");
const imagePreviewEl = document.getElementById("imagePreview");
const isActiveEl = document.getElementById("isActive");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const newBtn = document.getElementById("newBtn");
const statusEl = document.getElementById("status");
const formTitleEl = document.getElementById("formTitle");
const userbarEl = document.getElementById("userbar");


// ==========================================
// STATUS
// ==========================================

function status(message, error = false) {
    statusEl.textContent = message;
    statusEl.className = "status" + (error ? " error" : "");
}


// ==========================================
// KIỂM TRA ADMIN / STAFF
// ==========================================

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
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
        profileError ||
        !profile ||
        !["admin", "staff"].includes(profile.role)
    ) {
        await supabaseClient.auth.signOut();
        location.href = "login.html";
        return null;
    }

    userbarEl.textContent =
        `${user.email} • quyền ${profile.role}`;

    return user;
}


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    editingId = null;
    selectedImageFile = null;

    formTitleEl.textContent = "Thêm sản phẩm";

    nameEl.value = "";
    categoryEl.value = "";
    priceEl.value = "";
    descriptionEl.value = "";

    isActiveEl.checked = true;

    imageFileEl.value = "";

    imagePreviewEl.innerHTML = "";

    saveBtn.textContent = "Lưu sản phẩm";

    status("");
}


// ==========================================
// PREVIEW ẢNH
// ==========================================

function showImagePreview(url) {

    imagePreviewEl.innerHTML = "";

    if (!url) return;

    const img = document.createElement("img");

    img.src = url;
    img.alt = "Ảnh sản phẩm";

    imagePreviewEl.appendChild(img);
}


// ==========================================
// CHỌN ẢNH
// ==========================================

imageFileEl.addEventListener("change", () => {

    const file = imageFileEl.files[0];

    if (!file) {
        selectedImageFile = null;
        return;
    }

    if (!file.type.startsWith("image/")) {

        status("File được chọn không phải ảnh.", true);

        imageFileEl.value = "";
        selectedImageFile = null;

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        status("Ảnh quá lớn. Tối đa 5MB.", true);

        imageFileEl.value = "";
        selectedImageFile = null;

        return;
    }

    selectedImageFile = file;

    const localUrl = URL.createObjectURL(file);

    showImagePreview(localUrl);
});


// ==========================================
// UPLOAD ẢNH
// ==========================================

async function uploadProductImage(file) {

    if (!file) {
        throw new Error("Chưa chọn ảnh.");
    }

    const extension =
        file.name.split(".").pop().toLowerCase();

    const fileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const filePath =
        `products/${fileName}`;

    status("Đang upload ảnh...");

    const { error } = await supabaseClient.storage
        .from("site-images")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) {
        console.error(error);
        throw error;
    }

    const imageUrl =
        `${supabaseClient.supabaseUrl}` +
        `/storage/v1/render/image/public/site-images/${filePath}`;

    return {
        url: imageUrl,
        path: filePath
    };
}


// ==========================================
// XÓA ẢNH TRONG STORAGE
// ==========================================

async function deleteStorageImage(path) {

    if (!path) return;

    const { error } = await supabaseClient.storage
        .from("site-images")
        .remove([path]);

    if (error) {
        console.warn(
            "Không xóa được ảnh Storage:",
            error
        );
    }
}


// ==========================================
// TẢI DANH SÁCH SẢN PHẨM
// ==========================================

async function loadProducts() {

    listEl.textContent = "Đang tải sản phẩm...";

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: false });

    if (error) {

        console.error(error);

        status(
            "Không tải được sản phẩm: " + error.message,
            true
        );

        listEl.textContent = "";

        return;
    }

    products = data || [];

    renderProducts();
}


// ==========================================
// HIỂN THỊ DANH SÁCH
// ==========================================

function renderProducts() {

    listEl.innerHTML = "";

    if (!products.length) {

        const empty = document.createElement("p");

        empty.textContent =
            "Chưa có sản phẩm. Bấm + Thêm sản phẩm.";

        empty.style.color = "#667085";

        listEl.appendChild(empty);

        return;
    }

    products.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";


        // ẢNH
        const img = document.createElement("img");

        img.src =
            product.image_url ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f2f4f7'/%3E%3C/svg%3E";

        img.alt = product.name || "Sản phẩm";

        card.appendChild(img);


        // THÔNG TIN
        const info = document.createElement("div");

        info.className = "product-info";


        const title = document.createElement("h3");

        title.textContent =
            product.name || "Không có tên";

        info.appendChild(title);


        if (product.category) {

            const category = document.createElement("p");

            category.textContent =
                "Danh mục: " + product.category;

            info.appendChild(category);
        }


        const price = document.createElement("p");

        price.className = "price";

        price.textContent =
            formatPrice(product.price);

        info.appendChild(price);


        const badge = document.createElement("span");

        badge.className =
            "badge " +
            (product.is_active
                ? "badge-on"
                : "badge-off");

        badge.textContent =
            product.is_active
                ? "Đang bán"
                : "Đang ẩn";

        info.appendChild(badge);


        card.appendChild(info);


        // NÚT
        const actions = document.createElement("div");

        actions.className = "card-actions";


        const editBtn =
            document.createElement("button");

        editBtn.className = "btn2";

        editBtn.textContent = "Sửa";

        editBtn.onclick = () =>
            editProduct(product.id);


        const toggleBtn =
            document.createElement("button");

        toggleBtn.className = "btn2";

        toggleBtn.textContent =
            product.is_active
                ? "Ẩn"
                : "Hiện";

        toggleBtn.onclick = () =>
            toggleProduct(product);


        const deleteBtn =
            document.createElement("button");

        deleteBtn.className =
            "btn2 btn-danger";

        deleteBtn.textContent = "Xóa";

        deleteBtn.onclick = () =>
            deleteProduct(product);


        actions.appendChild(editBtn);
        actions.appendChild(toggleBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(actions);

        listEl.appendChild(card);
    });
}


// ==========================================
// FORMAT GIÁ
// ==========================================

function formatPrice(value) {

    const number = Number(value || 0);

    if (!number) {
        return "Liên hệ";
    }

    return number.toLocaleString("vi-VN") + "đ";
}


// ==========================================
// SỬA SẢN PHẨM
// ==========================================

function editProduct(id) {

    const product =
        products.find(p => p.id === id);

    if (!product) return;

    editingId = id;

    selectedImageFile = null;

    formTitleEl.textContent =
        "Sửa sản phẩm";

    saveBtn.textContent =
        "Cập nhật sản phẩm";

    nameEl.value =
        product.name || "";

    categoryEl.value =
        product.category || "";

    priceEl.value =
        product.price || "";

    descriptionEl.value =
        product.description || "";

    isActiveEl.checked =
        product.is_active !== false;

    imageFileEl.value = "";

    showImagePreview(product.image_url);

    status("");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// THÊM / CẬP NHẬT
// ==========================================

saveBtn.addEventListener("click", async () => {

    try {

        const name =
            nameEl.value.trim();

        const category =
            categoryEl.value.trim();

        const description =
            descriptionEl.value.trim();

        const price =
            Number(priceEl.value || 0);

        const isActive =
            isActiveEl.checked;


        if (!name) {

            status(
                "Vui lòng nhập tên sản phẩm.",
                true
            );

            nameEl.focus();

            return;
        }


        saveBtn.disabled = true;

        status("Đang lưu...");


        // ==================================
        // THÊM SẢN PHẨM
        // ==================================

        if (!editingId) {

            let imageUrl = null;
            let imagePath = null;


            if (selectedImageFile) {

                const uploaded =
                    await uploadProductImage(
                        selectedImageFile
                    );

                imageUrl =
                    uploaded.url;

                imagePath =
                    uploaded.path;
            }


            const { error } =
                await supabaseClient
                    .from("products")
                    .insert({
                        name,
                        category:
                            category || null,
                        price,
                        description:
                            description || null,
                        image_url:
                            imageUrl,
                        image_path:
                            imagePath,
                        is_active:
                            isActive
                    });


            if (error) {

                // Nếu DB lỗi thì xóa ảnh vừa upload
                if (imagePath) {
                    await deleteStorageImage(
                        imagePath
                    );
                }

                throw error;
            }


            status(
                "✓ Đã thêm sản phẩm."
            );
        }


        // ==================================
        // CẬP NHẬT SẢN PHẨM
        // ==================================

        else {

            const oldProduct =
                products.find(
                    p => p.id === editingId
                );

            if (!oldProduct) {
                throw new Error(
                    "Không tìm thấy sản phẩm."
                );
            }


            let imageUrl =
                oldProduct.image_url || null;

            let imagePath =
                oldProduct.image_path || null;


            // Có chọn ảnh mới
            if (selectedImageFile) {

                const uploaded =
                    await uploadProductImage(
                        selectedImageFile
                    );


                imageUrl =
                    uploaded.url;

                imagePath =
                    uploaded.path;


                // Xóa ảnh cũ
                if (oldProduct.image_path) {

                    await deleteStorageImage(
                        oldProduct.image_path
                    );
                }
            }


            const { error } =
                await supabaseClient
                    .from("products")
                    .update({
                        name,
                        category:
                            category || null,
                        price,
                        description:
                            description || null,
                        image_url:
                            imageUrl,
                        image_path:
                            imagePath,
                        is_active:
                            isActive
                    })
                    .eq("id", editingId);


            if (error) {

                // Nếu update lỗi,
                // xóa ảnh mới vừa upload
                if (
                    selectedImageFile &&
                    imagePath !== oldProduct.image_path
                ) {
                    await deleteStorageImage(
                        imagePath
                    );
                }

                throw error;
            }


            status(
                "✓ Đã cập nhật sản phẩm."
            );
        }


        resetForm();

        await loadProducts();

    } catch (error) {

        console.error(error);

        status(
            error.message ||
            "Lưu sản phẩm thất bại.",
            true
        );

    } finally {

        saveBtn.disabled = false;
    }
});


// ==========================================
// ẨN / HIỆN SẢN PHẨM
// ==========================================

async function toggleProduct(product) {

    const newStatus =
        !product.is_active;

    const action =
        newStatus ? "hiện" : "ẩn";

    const ok =
        confirm(
            `Bạn muốn ${action} sản phẩm "${product.name}"?`
        );

    if (!ok) return;


    status("Đang cập nhật...");


    const { error } =
        await supabaseClient
            .from("products")
            .update({
                is_active: newStatus
            })
            .eq("id", product.id);


    if (error) {

        console.error(error);

        status(
            error.message,
            true
        );

        return;
    }


    status(
        newStatus
            ? "✓ Đã hiện sản phẩm."
            : "✓ Đã ẩn sản phẩm."
    );


    await loadProducts();
}


// ==========================================
// XÓA SẢN PHẨM
// ==========================================

async function deleteProduct(product) {

    const ok =
        confirm(
            `XÓA sản phẩm "${product.name}"?\n\n` +
            `Hành động này sẽ xóa sản phẩm khỏi database.`
        );

    if (!ok) return;


    try {

        status("Đang xóa...");


        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", product.id);


        if (error) {
            throw error;
        }


        // Xóa ảnh khỏi Storage
        if (product.image_path) {

            await deleteStorageImage(
                product.image_path
            );
        }


        // Nếu đang sửa sản phẩm này
        if (editingId === product.id) {

            resetForm();
        }


        status(
            "✓ Đã xóa sản phẩm và ảnh."
        );


        await loadProducts();

    } catch (error) {

        console.error(error);

        status(
            error.message ||
            "Xóa sản phẩm thất bại.",
            true
        );
    }
}


// ==========================================
// NÚT THÊM MỚI
// ==========================================

newBtn.addEventListener(
    "click",
    resetForm
);


// ==========================================
// NÚT HỦY
// ==========================================

cancelBtn.addEventListener(
    "click",
    resetForm
);


// ==========================================
// ĐĂNG XUẤT
// ==========================================

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        location.href = "login.html";
    });


// ==========================================
// KHỞI ĐỘNG
// ==========================================

(async () => {

    const user =
        await requireAdmin();

    if (!user) return;

    await loadProducts();

})();

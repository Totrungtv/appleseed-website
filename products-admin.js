// ==========================================
// AppleSeed - Product Admin
// products-admin.js
// ==========================================

let products = [];
let editingId = null;
let selectedImageFile = null;
let selectedImageFiles = [];
let productGallery = [];

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
    selectedImageFiles = [];
    productGallery = [];

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
// PREVIEW / GALLERY ẢNH
// ==========================================

function ensureGalleryStyles(){
    if(document.getElementById("productGalleryAdminStyle")) return;
    const style=document.createElement("style");
    style.id="productGalleryAdminStyle";
    style.textContent=`
      #imagePreview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
      .gallery-item{position:relative;border:1px solid #e5e7eb;border-radius:10px;padding:5px;background:#fff}
      .gallery-item img{width:100%;height:110px;object-fit:cover;border-radius:7px;margin:0}
      .gallery-badge{position:absolute;left:8px;top:8px;background:#2563eb;color:#fff;border-radius:999px;padding:3px 7px;font-size:11px;font-weight:700}
      .gallery-remove{position:absolute;right:6px;top:6px;width:28px;height:28px;border:0;border-radius:50%;background:#fff;color:#dc2626;font-size:18px;cursor:pointer;box-shadow:0 1px 5px rgba(0,0,0,.15)}
      .gallery-primary{display:block;width:100%;margin-top:5px;border:0;background:#f2f4f7;border-radius:7px;padding:5px;font-size:11px;font-weight:700;cursor:pointer}
      .gallery-primary.active{background:#dbeafe;color:#1d4ed8}
      @media(max-width:600px){#imagePreview{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
}
function showImagePreview(url){
    imagePreviewEl.innerHTML="";
    if(!url)return;
    const img=document.createElement("img");
    img.src=url; img.alt="Ảnh sản phẩm"; imagePreviewEl.appendChild(img);
}
function renderGallery(){
    ensureGalleryStyles();
    imagePreviewEl.innerHTML="";
    productGallery.forEach((item,index)=>{
        const box=document.createElement("div"); box.className="gallery-item";
        const img=document.createElement("img"); img.src=item.url; img.alt=`${nameEl.value.trim()||"Sản phẩm"} - ảnh ${index+1}`; box.appendChild(img);
        if(item.isPrimary){const badge=document.createElement("span");badge.className="gallery-badge";badge.textContent="Ảnh chính";box.appendChild(badge);}
        const remove=document.createElement("button");remove.type="button";remove.className="gallery-remove";remove.title="Xóa ảnh";remove.textContent="×";remove.onclick=()=>removeGalleryItem(index);box.appendChild(remove);
        const primary=document.createElement("button");primary.type="button";primary.className="gallery-primary"+(item.isPrimary?" active":"");primary.textContent=item.isPrimary?"⭐ Ảnh chính":"Đặt làm ảnh chính";primary.onclick=()=>setLocalPrimary(index);box.appendChild(primary);
        imagePreviewEl.appendChild(box);
    });
}
function setLocalPrimary(index){
    productGallery=productGallery.map((x,i)=>({...x,isPrimary:i===index}));
    renderGallery();
}
async function loadProductGallery(productId){
    if(!productId)return [];
    const {data,error}=await supabaseClient.from("product_images")
        .select("id,product_id,image_url,image_path,sort_order,is_primary,created_at")
        .eq("product_id",productId).order("sort_order",{ascending:true}).order("id",{ascending:true});
    if(error){console.warn("Không tải được gallery:",error);return [];}
    return (data||[]).map(x=>({id:x.id,productId:x.product_id,url:x.image_url,path:x.image_path||"",sortOrder:Number(x.sort_order||0),isPrimary:!!x.is_primary,pending:false}));
}
async function removeGalleryItem(index){
    const item=productGallery[index]; if(!item)return;
    if(!confirm("Xóa ảnh này?"))return;

    if(item.pending){
        productGallery.splice(index,1);
        selectedImageFiles=selectedImageFiles.filter(f=>f!==item.file);
        if(!selectedImageFiles.length)imageFileEl.value="";
        renderGallery(); return;
    }
    if(!item.id)return;
    status("Đang xóa ảnh...");

    const {error}=await supabaseClient.from("product_images").delete().eq("id",item.id);
    if(error){status("Xóa ảnh lỗi: "+error.message,true);return;}
    if(item.path)await deleteStorageImage(item.path);

    const remaining=productGallery.filter((_,i)=>i!==index);
    if(item.isPrimary&&editingId){
        if(remaining.length){
            const next=remaining[0];
            await supabaseClient.from("product_images").update({is_primary:false}).eq("product_id",editingId);
            await supabaseClient.from("product_images").update({is_primary:true}).eq("id",next.id);
            await supabaseClient.from("products").update({image_url:next.url,image_path:next.path||null}).eq("id",editingId);
        }else{
            await supabaseClient.from("products").update({image_url:null,image_path:null}).eq("id",editingId);
        }
    }
    productGallery=remaining;
    if(productGallery.length&&!productGallery.some(x=>x.isPrimary))productGallery[0].isPrimary=true;
    renderGallery(); status("✓ Đã xóa ảnh.");
}

// ==========================================
// CHỌN NHIỀU ẢNH
// ==========================================

imageFileEl.multiple=true;
imageFileEl.addEventListener("change",()=>{
    const files=Array.from(imageFileEl.files||[]);
    if(!files.length)return;
    if(files.some(f=>!f.type.startsWith("image/"))){status("Có file được chọn không phải ảnh.",true);imageFileEl.value="";return;}
    if(files.some(f=>f.size>5*1024*1024)){status("Mỗi ảnh tối đa 5MB.",true);imageFileEl.value="";return;}
    selectedImageFiles=files; selectedImageFile=files[0]||null;
    const newItems=files.map(file=>({id:null,productId:editingId,url:URL.createObjectURL(file),path:"",sortOrder:999999,isPrimary:false,pending:true,file}));
    if(!productGallery.some(x=>x.isPrimary)&&newItems.length)newItems[0].isPrimary=true;
    productGallery=[...productGallery.filter(x=>!x.pending),...newItems];
    renderGallery();
    status(`Đã chọn ${files.length} ảnh. Bấm "Lưu sản phẩm" để upload.`);
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

   const { data: publicData } =
    supabaseClient.storage
        .from("site-images")
        .getPublicUrl(filePath);

const imageUrl = publicData.publicUrl;

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
    selectedImageFiles = [];
    productGallery = await loadProductGallery(product.id);

    if(!productGallery.length && product.image_url){
        productGallery=[{
            id:null,productId:product.id,url:product.image_url,
            path:product.image_path||"",sortOrder:0,isPrimary:true,pending:false
        }];
    }
    renderGallery();
    status("");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// THÊM / CẬP NHẬT
// ==========================================
// THÊM / CẬP NHẬT
// ==========================================

saveBtn.addEventListener("click",async()=>{
    try{
        const name=nameEl.value.trim();
        const category=categoryEl.value.trim();
        const description=descriptionEl.value.trim();
        const price=Number(priceEl.value||0);
        const isActive=isActiveEl.checked;

        if(!name){status("Vui lòng nhập tên sản phẩm.",true);nameEl.focus();return;}

        const wasEditing=!!editingId;
        saveBtn.disabled=true; status("Đang lưu...");
        let productId=editingId;

        if(!productId){
            const {data,error}=await supabaseClient.from("products").insert({
                name,category:category||null,price,description:description||null,
                image_url:null,image_path:null,is_active:isActive
            }).select("id").single();
            if(error)throw error;
            productId=data.id;
        }else{
            const oldProduct=products.find(p=>p.id===productId);
            if(!oldProduct)throw new Error("Không tìm thấy sản phẩm.");
            const {error}=await supabaseClient.from("products").update({
                name,category:category||null,price,description:description||null,is_active:isActive
            }).eq("id",productId);
            if(error)throw error;
        }

        const pendingItems=productGallery.filter(x=>x.pending);
        const uploadedItems=[];
        for(const item of pendingItems){
            const uploaded=await uploadProductImage(item.file);
            uploadedItems.push({url:uploaded.url,path:uploaded.path,isPrimary:!!item.isPrimary});
        }

        if(uploadedItems.length){
            const current=await loadProductGallery(productId);
            let nextOrder=current.reduce((m,x)=>Math.max(m,Number(x.sortOrder||0)),-1)+1;
            const rows=uploadedItems.map((x,i)=>({
                product_id:productId,image_url:x.url,image_path:x.path,
                sort_order:nextOrder+i,is_primary:false
            }));
            const {error}=await supabaseClient.from("product_images").insert(rows);
            if(error){
                for(const x of uploadedItems)await deleteStorageImage(x.path);
                throw error;
            }

            const after=await loadProductGallery(productId);
            let primary=after.find(x=>x.isPrimary);
            const primaryIndex=pendingItems.findIndex(x=>x.isPrimary);
            if(primaryIndex>=0){
                const wanted=uploadedItems[primaryIndex];
                primary=after.find(x=>x.url===wanted.url)||primary;
            }
            if(!primary)primary=after[0];

            if(primary){
                await supabaseClient.from("product_images").update({is_primary:false}).eq("product_id",productId);
                const pr=await supabaseClient.from("product_images").update({is_primary:true}).eq("id",primary.id);
                if(pr.error)throw pr.error;
                const up=await supabaseClient.from("products").update({
                    image_url:primary.url,image_path:primary.path||null
                }).eq("id",productId);
                if(up.error)throw up.error;
            }
        }else{
            const galleryRows=await loadProductGallery(productId);
            if(galleryRows.length){
                const chosen=productGallery.find(x=>x.isPrimary&&!x.pending);
                const primary=(chosen&&galleryRows.find(x=>x.id===chosen.id))||galleryRows.find(x=>x.isPrimary)||galleryRows[0];

                await supabaseClient.from("product_images").update({is_primary:false}).eq("product_id",productId);
                await supabaseClient.from("product_images").update({is_primary:true}).eq("id",primary.id);
                const up=await supabaseClient.from("products").update({
                    image_url:primary.url,image_path:primary.path||null
                }).eq("id",productId);
                if(up.error)throw up.error;
            }
        }

        resetForm();
        status(wasEditing?"✓ Đã cập nhật sản phẩm + nhiều ảnh.":"✓ Đã thêm sản phẩm + nhiều ảnh.");
        await loadProducts();
    }catch(error){
        console.error(error);
        status(error.message||"Lưu sản phẩm thất bại.",true);
    }finally{
        saveBtn.disabled=false;
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


        // Xóa toàn bộ gallery của sản phẩm
        const { data: galleryRows } = await supabaseClient
            .from("product_images")
            .select("id,image_path")
            .eq("product_id", product.id);

        if (galleryRows?.length) {
            await supabaseClient
                .from("product_images")
                .delete()
                .eq("product_id", product.id);

            for (const row of galleryRows) {
                if (row.image_path) await deleteStorageImage(row.image_path);
            }
        }

        if (product.image_path) {
            await deleteStorageImage(product.image_path);
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
    () => {
        resetForm();
        renderGallery();
    }
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

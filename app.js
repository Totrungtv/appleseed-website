async function loadAppleSeedContent(){
 const {data,error}=await supabaseClient.from("site_content").select("section,title,content,image_url");
 if(error){console.warn("AppleSeed CMS:",error.message);return}
 const by=Object.fromEntries((data||[]).map(x=>[x.section,x]));
 if(by.hero){
  const h=document.querySelector(".hero h1"),
        p=document.querySelector(".hero p"),
         img=document.getElementById("heroImage");
  if (heroImage && hero.image_url) {
  heroImage.src = hero.image_url;
  heroImage.style.display = "block";
}

  if(h&&by.hero.title)h.textContent=by.hero.title;
  if(p&&by.hero.content)p.textContent=by.hero.content;

  if(img&&by.hero.image_url){
    img.src=by.hero.image_url;
    img.style.display="block";
  }
}
 if(by.about){
  const h=document.querySelector("#gioi-thieu h2"),p=document.querySelector("#gioi-thieu p");
  if(h&&by.about.title)h.textContent=by.about.title;
  if(p&&by.about.content)p.textContent=by.about.content;
 }
 if(by.contact){
  const h=document.querySelector("#lien-he h2"),p=document.querySelector("#lien-he p");
  if(h&&by.contact.title)h.textContent=by.contact.title;
  if(p&&by.contact.content)p.textContent=by.contact.content;
 }
}
loadAppleSeedContent();

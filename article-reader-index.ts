// Apple Seed article-reader Edge Function v2
// Deployed slug: article-reader
// Security: HTTPS only + explicit allowlist. No arbitrary proxying.

const ALLOWED = new Set([
  "tuoitre.vn","vnexpress.net","dantri.com.vn","thanhnien.vn",
  "vietnamnet.vn","vov.vn","laodong.vn","nld.com.vn","plo.vn",
  "genk.vn","kenh14.vn","zingnews.vn"
]);

const CORS = {
  "content-type":"application/json; charset=utf-8",
  "access-control-allow-origin":"*",
  "access-control-allow-methods":"GET, OPTIONS",
  "access-control-allow-headers":"content-type"
};

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:CORS});}
function cleanText(s){return String(s||"").replace(/\s+/g," ").trim();}
function escAttr(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function abs(url,base){try{return new URL(url,base).href}catch{return "";}}
function stripTags(s){return String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,"");}

function extractBalanced(html,start){
  const open=html.slice(start).match(/^<([a-z0-9]+)\b[^>]*>/i);
  if(!open)return "";
  const tag=open[1].toLowerCase();
  const re=new RegExp("<\\/?"+tag+"\\b[^>]*>","gi");
  re.lastIndex=start+open[0].length;
  let depth=1,m;
  while((m=re.exec(html))){
    if(m[0].startsWith("</")) depth--;
    else if(!m[0].endsWith("/>")) depth++;
    if(depth===0)return html.slice(start,m.index+m[0].length);
  }
  return "";
}

function findBlock(html,patterns){
  for(const re of patterns){
    const m=re.exec(html);
    if(m){
      const block=extractBalanced(html,m.index);
      if(block&&block.length>300)return block;
    }
  }
  return "";
}

function sanitize(html,base){
  let s=stripTags(html).replace(/<!--[\s\S]*?-->/g,"");
  s=s.replace(/<(iframe|object|embed|form|button|input|textarea|select|svg|canvas|video|audio)\b[^>]*>[\s\S]*?<\/\1>/gi,"");
  s=s.replace(/<(iframe|object|embed|form|button|input|textarea|select|svg|canvas|video|audio)\b[^>]*\/?\s*>/gi,"");
  s=s.replace(/<div[^>]*>/gi,"").replace(/<\/div>/gi,"");
  s=s.replace(/<span[^>]*>/gi,"").replace(/<\/span>/gi,"");
  s=s.replace(/<p[^>]*>/gi,"<p>").replace(/<\/p>/gi,"</p>");
  s=s.replace(/<(h[1-6])[^>]*>/gi,"<$1>");
  s=s.replace(/<strong[^>]*>/gi,"<strong>").replace(/<em[^>]*>/gi,"<em>");
  s=s.replace(/<ul[^>]*>/gi,"<ul>").replace(/<ol[^>]*>/gi,"<ol>").replace(/<li[^>]*>/gi,"<li>");
  s=s.replace(/<blockquote[^>]*>/gi,"<blockquote>").replace(/<figure[^>]*>/gi,"<figure>").replace(/<figcaption[^>]*>/gi,"<figcaption>");
  s=s.replace(/<br[^>]*>/gi,"<br>");
  s=s.replace(/<a([^>]*)>/gi,(all,attrs)=>{
    const hm=attrs.match(/href\s*=\s*["']([^"']+)["']/i);
    const href=hm?abs(hm[1],base):"";
    return href?'<a href="'+escAttr(href)+'" target="_blank" rel="noopener noreferrer">':"<span>";
  });
  s=s.replace(/<img([^>]*)>/gi,(all,attrs)=>{
    const sm=attrs.match(/(?:src|data-src|data-original)\s*=\s*["']([^"']+)["']/i);
    const src=sm?abs(sm[1],base):"";
    if(!src)return "";
    const am=attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
    return '<img src="'+escAttr(src)+'" alt="'+escAttr(am?am[1]:"")+'" loading="lazy" referrerpolicy="no-referrer">';
  });
  s=s.replace(/<[^>]+>/g,(tag)=>/^<\/?(p|h2|h3|h4|strong|em|ul|ol|li|blockquote|figure|figcaption|br|a|img)(\s|\/?>)/i.test(tag)?tag:"");
  return s.replace(/\n{3,}/g,"\n\n").trim();
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return json({ok:true});
  try{
    const u=new URL(req.url);
    const target=u.searchParams.get("url");
    if(!target)return json({error:"missing_url"},400);
    const parsed=new URL(target);
    if(parsed.protocol!=="https:")return json({error:"https_only"},400);
    const host=parsed.hostname.toLowerCase().replace(/^www\./,"");
    if(!ALLOWED.has(host))return json({error:"domain_not_allowed",domain:host},403);

    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);
    let res;
    try{
      res=await fetch(parsed.href,{
        headers:{
          "user-agent":"Mozilla/5.0 (compatible; AppleSeedReader/2.0; +https://appleseedtravinh.com/)",
          "accept":"text/html,application/xhtml+xml"
        },
        redirect:"follow",
        signal:controller.signal
      });
    }finally{clearTimeout(timer);}

    if(!res.ok)return json({error:"source_fetch_failed",status:res.status},502);
    const html=await res.text();
    if(html.length<500)return json({error:"source_empty"},502);

    const og=html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const tt=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title=cleanText((og?.[1]||h1?.[1]||tt?.[1]||"").replace(/<[^>]+>/g," "));

    const tm=html.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i);
    const time=cleanText((tm?.[1]||"").replace(/<[^>]+>/g," "));

    const block=findBlock(html,[
      /<div\b[^>]*(?:id|class)=["'][^"']*(?:main-detail-body|detail-content|article-body|article__body|fck_detail|detail__content|content-detail)[^"']*["'][^>]*>/i,
      /<article\b[^>]*>/i
    ]);

    let body=sanitize(block||"",parsed.href);
    if(!body || body.replace(/<[^>]+>/g," ").trim().length<120){
      const ps=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m=>m[0]).filter(x=>cleanText(x.replace(/<[^>]+>/g," ")).length>=45).slice(0,45);
      body=sanitize(ps.join("\n"),parsed.href);
    }
    if(!body || body.replace(/<[^>]+>/g," ").trim().length<120)return json({error:"article_not_extractable",source:host},422);

    body=body.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi,"");
    return json({ok:true,title:title||"Bài viết",source:host,time,url:parsed.href,html:body});
  }catch(e){
    return json({error:"reader_error",message:String(e?.message||e)},500);
  }
});
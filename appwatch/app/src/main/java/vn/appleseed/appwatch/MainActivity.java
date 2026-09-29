package vn.appleseed.appwatch;

import android.app.Activity;
import android.os.Bundle;
import android.content.*;
import android.content.pm.*;
import android.graphics.Color;
import android.net.Uri;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
    LinearLayout root, results;
    TextView summary;
    PackageManager pm;

    int dp(float v){ return (int)(v*getResources().getDisplayMetrics().density+.5f); }
    TextView tv(String s,int sp){
        TextView t=new TextView(this); t.setText(s); t.setTextColor(Color.WHITE); t.setTextSize(sp);
        t.setPadding(dp(12),dp(8),dp(12),dp(8)); return t;
    }
    Button btn(String s){
        Button b=new Button(this); b.setText(s); b.setTextColor(Color.WHITE); b.setTextSize(13);
        b.setAllCaps(false); return b;
    }

    @Override public void onCreate(Bundle b){
        super.onCreate(b); pm=getPackageManager(); build();
    }

    void build(){
        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(16),dp(14),dp(16),dp(14));
        root.setBackgroundColor(Color.rgb(5,13,8));
        TextView title=tv("🛡  Apple Seed App Watch",24); title.setTextColor(Color.rgb(97,239,167));
        root.addView(title);
        TextView sub=tv("Chỉ tìm ứng dụng bên thứ ba có dấu hiệu gây quảng cáo bật lên. Không tự động gỡ ứng dụng.",12);
        sub.setTextColor(Color.rgb(120,149,135)); root.addView(sub);

        LinearLayout actions=new LinearLayout(this); actions.setOrientation(LinearLayout.HORIZONTAL);
        Button scan=btn("🔍 Quét app quảng cáo"); Button apps=btn("📋 Quét lại");
        actions.addView(scan,new LinearLayout.LayoutParams(0,dp(54),1));
        actions.addView(apps,new LinearLayout.LayoutParams(0,dp(54),1));
        root.addView(actions);

        summary=tv("Chưa quét thiết bị.",13); summary.setTextColor(Color.rgb(120,149,135)); root.addView(summary);
        ScrollView sv=new ScrollView(this);
        results=new LinearLayout(this); results.setOrientation(LinearLayout.VERTICAL); sv.addView(results);
        root.addView(sv,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);

        scan.setOnClickListener(v->scan());
        apps.setOnClickListener(v->scan());
    }

    void scan(){
        results.removeAllViews();
        List<PackageInfo> pkgs=pm.getInstalledPackages(PackageManager.GET_PERMISSIONS|PackageManager.GET_SERVICES|PackageManager.GET_RECEIVERS);
        List<PackageInfo> flagged=new ArrayList<>();
        for(PackageInfo p:pkgs){
            if(isAdwareCandidate(p)) flagged.add(p);
        }
        if(flagged.isEmpty()){
            summary.setText("Đã kiểm tra "+pkgs.size()+" ứng dụng. Chưa thấy ứng dụng nào đủ dấu hiệu quảng cáo bật lên.");
            TextView clean=tv("🟢 Chưa phát hiện ứng dụng đáng ngờ theo các dấu hiệu hiện có. Nếu quảng cáo vẫn tự bật, hãy gửi danh sách app mới cài để kiểm tra sâu hơn.",13);
            clean.setTextColor(Color.rgb(97,239,167)); results.addView(clean);
            return;
        }
        summary.setText("Đã kiểm tra "+pkgs.size()+" ứng dụng • "+flagged.size()+" ứng dụng có dấu hiệu cần kiểm tra");
        for(PackageInfo p:flagged) addRow(p);
    }

    boolean isAdwareCandidate(PackageInfo p){
        if(p.applicationInfo==null) return false;
        // Không đưa ứng dụng hệ thống/ứng dụng hệ thống đã cập nhật vào danh sách nghi vấn.
        int flags=p.applicationInfo.flags;
        if((flags & ApplicationInfo.FLAG_SYSTEM)!=0 || (flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)!=0) return false;

        String pkg=p.packageName==null?"":p.packageName.toLowerCase(Locale.ROOT);
        String label=String.valueOf(p.applicationInfo.loadLabel(pm)).toLowerCase(Locale.ROOT);
        String name=pkg+" "+label;
        boolean adName=name.matches(".*(adware|adservice|ad\.sdk|admob|advert|advertis|adsdk|popup|pop-up|pushads|adplugin|adplugin|hotapp|hot apps).*");
        boolean overlay=false, boot=false, installPackages=false, usage=false;
        if(p.requestedPermissions!=null){
            for(String perm:p.requestedPermissions){
                if(Manifest.permission.SYSTEM_ALERT_WINDOW.equals(perm)) overlay=true;
                if(Manifest.permission.RECEIVE_BOOT_COMPLETED.equals(perm)) boot=true;
                if(Manifest.permission.REQUEST_INSTALL_PACKAGES.equals(perm)) installPackages=true;
                if("android.permission.PACKAGE_USAGE_STATS".equals(perm)) usage=true;
            }
        }
        // Chỉ gắn cờ khi có dấu hiệu liên quan quảng cáo hoặc tổ hợp quyền rủi ro,
        // không đánh dấu chỉ vì có service/receiver hay tên hãng điện thoại.
        if(adName && (overlay || boot || installPackages || usage)) return true;
        return overlay && installPackages && boot;
    }

    void addRow(PackageInfo p){
        LinearLayout card=new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(12),dp(10),dp(12),dp(10)); card.setBackgroundColor(Color.rgb(9,24,16));
        TextView name=tv("⚠️ "+String.valueOf(p.applicationInfo.loadLabel(pm)),16);
        name.setTextColor(Color.WHITE); card.addView(name);
        TextView pkg=tv(p.packageName+"\\nDấu hiệu: ứng dụng bên thứ ba có quyền hiển thị lớp phủ/cài gói hoặc tên liên quan quảng cáo",11); pkg.setTextColor(Color.rgb(255,190,105)); card.addView(pkg);
        LinearLayout a=new LinearLayout(this);
        Button info=btn("Chi tiết"); Button uninstall=btn("🗑 Gỡ");
        a.addView(info,new LinearLayout.LayoutParams(0,dp(48),1));
        a.addView(uninstall,new LinearLayout.LayoutParams(0,dp(48),1));
        card.addView(a);
        info.setOnClickListener(v->openInfo(p.packageName));
        uninstall.setOnClickListener(v->uninstall(p.packageName));
        results.addView(card,new LinearLayout.LayoutParams(-1,dp(140)));
    }

    void openInfo(String pkg){
        Intent i=new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:"+pkg));
        startActivity(i);
    }

    void uninstall(String pkg){
        try{
            Intent i=new Intent(Intent.ACTION_DELETE,Uri.parse("package:"+pkg));
            i.putExtra(Intent.EXTRA_RETURN_RESULT,true);
            startActivity(i);
        }catch(Exception e){ openInfo(pkg); }
    }
}

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
        TextView sub=tv("Quét ứng dụng • phát hiện dấu hiệu adware • xem chi tiết • gỡ ứng dụng",12);
        sub.setTextColor(Color.rgb(120,149,135)); root.addView(sub);

        LinearLayout actions=new LinearLayout(this); actions.setOrientation(LinearLayout.HORIZONTAL);
        Button scan=btn("🔍 Quét thiết bị"); Button apps=btn("📦 Ứng dụng");
        actions.addView(scan,new LinearLayout.LayoutParams(0,dp(54),1));
        actions.addView(apps,new LinearLayout.LayoutParams(0,dp(54),1));
        root.addView(actions);

        summary=tv("Chưa quét thiết bị.",13); summary.setTextColor(Color.rgb(120,149,135)); root.addView(summary);
        ScrollView sv=new ScrollView(this);
        results=new LinearLayout(this); results.setOrientation(LinearLayout.VERTICAL); sv.addView(results);
        root.addView(sv,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);

        scan.setOnClickListener(v->scan(false));
        apps.setOnClickListener(v->scan(true));
    }

    void scan(boolean all){
        results.removeAllViews();
        List<PackageInfo> pkgs=pm.getInstalledPackages(PackageManager.GET_PERMISSIONS|PackageManager.GET_SERVICES|PackageManager.GET_RECEIVERS);
        int suspicious=0;
        for(PackageInfo p:pkgs){
            if(!all && !isInteresting(p)) continue;
            if(isInteresting(p)) suspicious++;
            addRow(p);
        }
        summary.setText("Đã quét "+pkgs.size()+" ứng dụng  •  "+suspicious+" ứng dụng cần xem xét");
    }

    boolean isInteresting(PackageInfo p){
        String n=(p.packageName+" "+(p.applicationInfo.loadLabel(pm))).toLowerCase(Locale.ROOT);
        int score=0;
        if(n.matches(".*(adservice|admob|advert|ads[._-]|marketing|promo|recommend|hotapp|appmarket|appcenter|cleaner|booster).*")) score+=2;
        if(p.requestedPermissions!=null) for(String x:p.requestedPermissions){
            if(x.contains("SYSTEM_ALERT_WINDOW")||x.contains("RECEIVE_BOOT_COMPLETED")||x.contains("REQUEST_INSTALL_PACKAGES")||x.contains("PACKAGE_USAGE_STATS")) score++;
        }
        if(p.services!=null && p.services.length>0) score++;
        return score>=2;
    }

    void addRow(PackageInfo p){
        LinearLayout card=new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(12),dp(10),dp(12),dp(10)); card.setBackgroundColor(Color.rgb(9,24,16));
        TextView name=tv("📦 "+String.valueOf(p.applicationInfo.loadLabel(pm)),16);
        name.setTextColor(Color.WHITE); card.addView(name);
        TextView pkg=tv(p.packageName,11); pkg.setTextColor(Color.rgb(120,149,135)); card.addView(pkg);
        LinearLayout a=new LinearLayout(this);
        Button info=btn("Chi tiết"); Button uninstall=btn("🗑 Gỡ");
        a.addView(info,new LinearLayout.LayoutParams(0,dp(48),1));
        a.addView(uninstall,new LinearLayout.LayoutParams(0,dp(48),1));
        card.addView(a);
        info.setOnClickListener(v->openInfo(p.packageName));
        uninstall.setOnClickListener(v->uninstall(p.packageName));
        results.addView(card,new LinearLayout.LayoutParams(-1,dp(120)));
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

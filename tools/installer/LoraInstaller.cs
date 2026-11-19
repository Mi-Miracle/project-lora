// Інсталятор Project LORA: завантажує Electron і свіжі файли гри з GitHub у вибрану папку, створює ярлик.
// Збирання (Windows, .NET Framework 4.x уже є в системі): tools\installer\build.bat
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("Project LORA — інсталятор")]
[assembly: System.Reflection.AssemblyProduct("Project LORA")]
[assembly: System.Reflection.AssemblyCompany("Mi-Miracle")]
[assembly: System.Reflection.AssemblyVersion("1.1.0.0")]

class LoraInstaller : Form
{
    const string ELECTRON = "33.4.11";
    const string REPO_ZIP = "https://codeload.github.com/Mi-Miracle/project-lora/zip/refs/heads/main";
    static readonly string EL_ZIP = "https://github.com/electron/electron/releases/download/v" + ELECTRON + "/electron-v" + ELECTRON + "-win32-x64.zip";
    static readonly string[] GAME = { "index.html", "overlay.html", "src/", "data/", "assets/", "styles/", "lib/" };

    TextBox path = new TextBox();
    Button browse = new Button(), install = new Button(), launch = new Button(), remove = new Button();
    CheckBox desk = new CheckBox(), menu = new CheckBox();
    ProgressBar bar = new ProgressBar();
    Label status = new Label();
    string exePath;

    [STAThread]
    static void Main(string[] args)
    {
        if (args.Length >= 2 && args[0] == "/silent") // тихий режим для перевірки: LORA-Installer.exe /silent "D:\Games\Project LORA"
        {
            var f = new LoraInstaller(); string log = Path.Combine(Path.GetTempPath(), "lora-install.log");
            try { f.quiet = true; f.Work(args[1], false, false); File.WriteAllText(log, "OK " + f.exePath); } catch (Exception e) { File.WriteAllText(log, "ERR " + e); }
            return;
        }
        if (args.Length >= 1 && args[0] == "/uninstall")
        {
            string d = args.Length >= 2 ? args[1] : InstalledDir();
            // деінсталятор лежить у папці гри — запускаємо копію з TEMP, щоб папку можна було видалити
            string me = Application.ExecutablePath;
            if (d != null && me.StartsWith(d, StringComparison.OrdinalIgnoreCase))
            {
                string tmp = Path.Combine(Path.GetTempPath(), "lora-uninstall.exe"); File.Copy(me, tmp, true);
                Process.Start(tmp, "/uninstall \"" + d + "\""); return;
            }
            Application.EnableVisualStyles(); Uninstall(d, null); return;
        }
        Application.EnableVisualStyles(); Application.Run(new LoraInstaller());
    }
    const string UKEY = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\ProjectLORA";
    static string InstalledDir()
    {
        try { using (var k = Registry.CurrentUser.OpenSubKey(UKEY)) { var v = k == null ? null : k.GetValue("InstallLocation") as string; return v != null && File.Exists(Path.Combine(v, "Project LORA.exe")) ? v : null; } } catch { return null; }
    }
    static void Uninstall(string d, IWin32Window owner)
    {
        if (owner == null) { var top = new Form { TopMost = true, ShowInTaskbar = false, FormBorderStyle = FormBorderStyle.None, Size = new Size(1, 1), StartPosition = FormStartPosition.CenterScreen, Opacity = 0 }; top.Show(); top.Activate(); owner = top; }
        if (d == null || !Directory.Exists(d)) { MessageBox.Show(owner, "Встановлену гру не знайдено.", "Project LORA", MessageBoxButtons.OK, MessageBoxIcon.Information); return; }
        if (MessageBox.Show(owner, "Видалити Project LORA з папки\n" + d + " ?", "Видалення Project LORA", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        var saves = MessageBox.Show(owner, "Видалити також збереження, налаштування й завантажені оновлення гри?\n(Ні — вони залишаться, якщо встановите гру знову)", "Project LORA", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes;
        foreach (var p in Process.GetProcessesByName("Project LORA")) { try { if (p.MainModule.FileName.StartsWith(d, StringComparison.OrdinalIgnoreCase)) { p.Kill(); p.WaitForExit(5000); } } catch { } }
        Thread.Sleep(500);
        try { Directory.Delete(d, true); } catch (Exception e) { MessageBox.Show(owner, "Не вдалося видалити все: " + e.Message + "\nЗакрийте гру й спробуйте ще раз.", "Project LORA", MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
        try { File.Delete(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Project LORA.lnk")); } catch { }
        try { Directory.Delete(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Project LORA"), true); } catch { }
        try { Registry.CurrentUser.DeleteSubKeyTree(UKEY, false); } catch { }
        if (saves) { try { Directory.Delete(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Project LORA"), true); } catch { } }
        MessageBox.Show(owner, "Project LORA видалено." + (saves ? "" : " Збереження залишились."), "Project LORA", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
    bool quiet;

    LoraInstaller()
    {
        Text = "Project LORA — встановлення"; ClientSize = new Size(560, 300); FormBorderStyle = FormBorderStyle.FixedDialog; MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen; BackColor = Color.FromArgb(10, 16, 26); ForeColor = Color.FromArgb(223, 233, 245); Font = new Font("Segoe UI", 10f);
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        var title = new Label { Text = "L.O.R.A. · Lords Of Real Atlas", Font = new Font("Segoe UI", 18f, FontStyle.Bold), ForeColor = Color.FromArgb(255, 211, 77), AutoSize = true, Location = new Point(20, 16) };
        var sub = new Label { Text = "Гра завантажиться з GitHub (~120 МБ) і далі оновлюватиметься сама.", AutoSize = true, ForeColor = Color.FromArgb(156, 200, 240), Location = new Point(22, 56) };
        var lp = new Label { Text = "Папка встановлення:", AutoSize = true, Location = new Point(22, 92) };
        path.Location = new Point(22, 116); path.Width = 420;
        path.Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Project LORA");
        browse.Text = "Огляд…"; browse.Location = new Point(450, 114); browse.Width = 88; browse.FlatStyle = FlatStyle.Flat; browse.Click += Browse;
        desk.Text = "Ярлик на робочому столі"; desk.Checked = true; desk.AutoSize = true; desk.Location = new Point(22, 150);
        menu.Text = "Ярлик у меню «Пуск»"; menu.Checked = true; menu.AutoSize = true; menu.Location = new Point(260, 150);
        bar.Location = new Point(22, 186); bar.Width = 516; bar.Height = 18;
        status.Location = new Point(22, 210); status.Width = 516; status.Height = 40; status.ForeColor = Color.FromArgb(138, 160, 184);
        status.Text = "Оберіть папку й натисніть «Встановити».";
        install.Text = "Встановити"; install.Location = new Point(330, 254); install.Width = 100; install.Height = 32; install.BackColor = Color.FromArgb(255, 211, 77); install.ForeColor = Color.Black; install.FlatStyle = FlatStyle.Flat; install.Click += Install;
        launch.Text = "Грати ▶"; launch.Location = new Point(438, 254); launch.Width = 100; launch.Height = 32; launch.Enabled = false; launch.FlatStyle = FlatStyle.Flat; launch.Click += delegate { Process.Start(new ProcessStartInfo(exePath) { WorkingDirectory = Path.GetDirectoryName(exePath) }); Close(); };
        remove.Text = "Видалити гру"; remove.Location = new Point(22, 254); remove.Width = 120; remove.Height = 32; remove.FlatStyle = FlatStyle.Flat; remove.ForeColor = Color.FromArgb(255, 140, 140);
        remove.Click += delegate { Uninstall(InstalledDir() ?? (File.Exists(Path.Combine(path.Text, "Project LORA.exe")) ? path.Text : null), this); Refresh2(); };
        Controls.AddRange(new Control[] { title, sub, lp, path, browse, desk, menu, bar, status, install, launch, remove });
        Refresh2();
    }
    void Refresh2()
    {
        string d = InstalledDir(); remove.Enabled = d != null;
        if (d != null) { path.Text = d; exePath = Path.Combine(d, "Project LORA.exe"); launch.Enabled = true; install.Text = "Перевстановити"; status.Text = "Гру вже встановлено. Можна перевстановити (оновити), видалити або грати."; }
        else { launch.Enabled = false; install.Text = "Встановити"; install.Enabled = browse.Enabled = path.Enabled = true; }
    }

    void Browse(object s, EventArgs e)
    {
        using (var d = new FolderBrowserDialog { Description = "Куди встановити Project LORA? (буде створено підпапку «Project LORA»)", ShowNewFolderButton = true })
        {
            if (d.ShowDialog(this) == DialogResult.OK) path.Text = Path.Combine(d.SelectedPath, "Project LORA");
        }
    }

    void Ui(Action a) { if (quiet) return; if (InvokeRequired) BeginInvoke(a); else a(); }
    void Say(string t, int p) { if (quiet) { try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "lora-install.trace"), DateTime.Now.ToString("HH:mm:ss ") + t + "\r\n"); } catch { } } Ui(delegate { status.Text = t; if (p >= 0) bar.Value = Math.Max(0, Math.Min(100, p)); }); }

    void Install(object s, EventArgs e)
    {
        string dir = path.Text.Trim(); if (dir.Length == 0) return;
        install.Enabled = browse.Enabled = path.Enabled = false; bool dk = desk.Checked, mn = menu.Checked;
        var th = new Thread(delegate ()
        {
            try { Work(dir, dk, mn); Ui(delegate { launch.Enabled = true; remove.Enabled = true; install.Text = "Готово"; }); }
            catch (Exception ex) { Say("Помилка: " + ex.Message + "\nПеревірте інтернет і спробуйте ще раз.", -1); Ui(delegate { install.Enabled = browse.Enabled = path.Enabled = true; }); }
        });
        th.IsBackground = true; th.Start();
    }

    void Download(string url, string file, string what, int p0, int p1)
    {
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                var rq = (HttpWebRequest)WebRequest.Create(url); rq.UserAgent = "ProjectLORA-Installer"; rq.AllowAutoRedirect = true; rq.Timeout = 60000; rq.ReadWriteTimeout = 60000;
                using (var rs = (HttpWebResponse)rq.GetResponse()) using (var inp = rs.GetResponseStream()) using (var outp = File.Create(file))
                {
                    long total = rs.ContentLength, got = 0; var buf = new byte[1 << 16]; int n; long lastTick = 0;
                    while ((n = inp.Read(buf, 0, buf.Length)) > 0)
                    {
                        outp.Write(buf, 0, n); got += n;
                        if (Environment.TickCount - lastTick > 200) { lastTick = Environment.TickCount; string mb = (got / 1048576.0).ToString("0.0") + (total > 0 ? " / " + (total / 1048576.0).ToString("0.0") : "") + " МБ"; Say(what + "… " + mb, total > 0 ? p0 + (int)((p1 - p0) * got / total) : -1); }
                    }
                }
                return;
            }
            catch (Exception e) { if (attempt >= 3) throw new Exception(what + ": " + e.Message); Say(what + ": повтор " + (attempt + 1) + "/3…", -1); Thread.Sleep(2000); }
        }
    }

    void Work(string dir, bool dk, bool mn)
    {
        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072; // TLS 1.2
        string tmp = Path.Combine(Path.GetTempPath(), "lora-install-" + DateTime.Now.Ticks); Directory.CreateDirectory(tmp);
        string elz = Path.Combine(tmp, "electron.zip"), gz = Path.Combine(tmp, "game.zip");
        Download(EL_ZIP, elz, "Завантажую рушій гри (Electron)", 0, 70);
        Download(REPO_ZIP, gz, "Завантажую файли гри з GitHub", 70, 85);
        Say("Розпаковую…", 86);
        Directory.CreateDirectory(dir);
        using (var z = ZipFile.OpenRead(elz)) foreach (var en in z.Entries)
        {
            if (en.FullName.EndsWith("/")) continue; string name = en.FullName.Replace('/', '\\');
            if (name.Equals("electron.exe", StringComparison.OrdinalIgnoreCase)) name = "Project LORA.exe";
            if (name.EndsWith("default_app.asar", StringComparison.OrdinalIgnoreCase)) continue;
            string dst = Path.Combine(dir, name); Directory.CreateDirectory(Path.GetDirectoryName(dst)); en.ExtractToFile(dst, true);
        }
        string app = Path.Combine(dir, "resources", "app"), game = Path.Combine(app, "game"); Directory.CreateDirectory(game);
        Say("Встановлюю файли гри…", 92);
        using (var z = ZipFile.OpenRead(gz)) foreach (var en in z.Entries)
        {
            string full = en.FullName; int sl = full.IndexOf('/'); if (sl < 0) continue; string rel = full.Substring(sl + 1); if (rel.Length == 0 || rel.EndsWith("/")) continue;
            string dst = null;
            if (rel == "desktop/main.js" || rel == "desktop/updater.js" || rel == "desktop/package.json") dst = Path.Combine(app, rel.Substring(8));
            else foreach (var g in GAME) if (rel == g || (g.EndsWith("/") && rel.StartsWith(g))) { dst = Path.Combine(game, rel.Replace('/', '\\')); break; }
            if (dst == null) continue; Directory.CreateDirectory(Path.GetDirectoryName(dst)); en.ExtractToFile(dst, true);
        }
        exePath = Path.Combine(dir, "Project LORA.exe"); string ico = Path.Combine(game, "assets", "lora.ico");
        Say("Створюю ярлики…", 97);
        if (dk) Shortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Project LORA.lnk"), exePath, ico);
        if (mn) { string pm = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Project LORA"); Directory.CreateDirectory(pm); Shortcut(Path.Combine(pm, "Project LORA.lnk"), exePath, ico); }
        try { File.Copy(Application.ExecutablePath, Path.Combine(dir, "LORA-Installer.exe"), true); } catch { }
        try
        {
            using (var k = Registry.CurrentUser.CreateSubKey(UKEY))
            {
                k.SetValue("DisplayName", "Project LORA — Lords Of Real Atlas"); k.SetValue("Publisher", "Mi-Miracle"); k.SetValue("DisplayIcon", File.Exists(ico) ? ico : exePath);
                k.SetValue("InstallLocation", dir); k.SetValue("UninstallString", "\"" + Path.Combine(dir, "LORA-Installer.exe") + "\" /uninstall"); k.SetValue("NoModify", 1); k.SetValue("NoRepair", 1);
                long sz = 0; foreach (var f in Directory.GetFiles(dir, "*", SearchOption.AllDirectories)) sz += new FileInfo(f).Length; k.SetValue("EstimatedSize", (int)(sz / 1024));
            }
        }
        catch { }
        try { Directory.Delete(tmp, true); } catch { }
        Say("✔ Готово! Гру встановлено в " + dir + ". Натисніть «Грати».", 100);
    }

    static void Shortcut(string lnk, string target, string ico)
    {
        try
        {
            Type t = Type.GetTypeFromProgID("WScript.Shell"); object sh = Activator.CreateInstance(t);
            object sc = t.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, sh, new object[] { lnk });
            Type st = sc.GetType();
            st.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { target });
            st.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { Path.GetDirectoryName(target) });
            if (File.Exists(ico)) st.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { ico + ",0" });
            st.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, sc, null);
        }
        catch { }
    }
}

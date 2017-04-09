using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Runtime.InteropServices;

namespace wallpaper_receiver
{
    class Program
    {
        const int IMAGE_BUFFER = 4;
        const uint ONEDAY_TICK = 24 * 3600 * 1000;
        static string[] images;
        public static void Main(string[] args)
        {
            images = new string[IMAGE_BUFFER];
            for(int i = 0; i < IMAGE_BUFFER; i++)
            {
                images[i] = Path.GetFullPath("wallpaper" + i + ".png");
            }
            try
            {
                JObject data;
                data = Read();
                if (data != null)
                {
                    //Write(cut);
                    var result = SetWallpaper(data);
                    Write(result);

                }
            }
            catch (Exception e)
            {
                var eresult = new JObject();
                eresult["error"] = e.ToString();
                Write(eresult);
            }
        }

        public static JObject SetWallpaper(JObject json)
        {
            string path = "";
            if (json["data"] != null||json["url"]!=null)
            {
                var tick = json["tick"].Value<int>();
                string tempPath = "wallpaper" + tick % IMAGE_BUFFER + ".png";
                var imageIncrease = !File.Exists(tempPath);
                if (json["data"] != null)
                {
                    SaveBase64Wallpaper(json["data"].ToString(), tempPath);
                }
                else
                {
                    DownloadWallpaper(json["url"].ToString(), tempPath);
                }
                path = tempPath;
                var wallpaper = (IDesktopWallpaper)(new DesktopWallpaperClass());
                IShellItemArray itemarr = WinAPI.getImageItemsFromPath(images);
                SetSlidesIfNeeded(wallpaper, itemarr, imageIncrease);
                wallpaper.AdvanceSlideshow(null, DesktopSlideshowDirection.Forward);
            }
            var result = new JObject();
            result["path"] = path;
            return result;
        }

        public static void SetSlidesIfNeeded(IDesktopWallpaper wallpaper, IShellItemArray slides, bool allways)
        {
            string pname = "";
            IShellItemArray currentSlides;
            wallpaper.GetSlideshow(out currentSlides);
            IShellItem item, parent;
            currentSlides.GetItemAt(0, out item);
            item.GetParent(out parent);
            parent.GetDisplayName(ShellNativeMethods.ShellItemDesignNameOptions.FileSystemPath, out pname);
            string curpname = Path.GetFullPath(".");
            if (curpname != pname || allways)
            {
                wallpaper.SetSlideshow(slides);
                wallpaper.SetSlideshowOptions(DesktopSlideshowDirection.Forward, ONEDAY_TICK);
            }
        }

        public static void SaveBase64Wallpaper(string data,string file)
        {
            var bytes = Convert.FromBase64String(data);
            var filestream = new FileStream(file, FileMode.OpenOrCreate);
            filestream.Write(bytes, 0, bytes.Length);
            filestream.Flush();
        }

        public static void DownloadWallpaper(string url, string file)
        {
            using (WebClient client = new WebClient())
            {
                if(url.Contains("pximg.net"))
                    client.Headers.Set("Referer", "https://pximg.net/");
                if (url.Contains("pixiv.net"))
                    client.Headers.Set("Referer", "https://pixiv.net/");
                client.DownloadFile(url, file);
            }
        }
        public static JObject Read()
        {
            var stdin = Console.OpenStandardInput();
            var length = 0;

            var lengthBytes = new byte[4];
            stdin.Read(lengthBytes, 0, 4);
            length = BitConverter.ToInt32(lengthBytes, 0);

            var buffer = new char[length];
            using (var reader = new StreamReader(stdin))
            {
                //while (reader.Peek() >= 0)
                {
                    reader.Read(buffer, 0, buffer.Length);
                }
            }
            return (JObject)JsonConvert.DeserializeObject<JObject>(new string(buffer));
        }

        public static void Write(JObject json)
        {

            var bytes = System.Text.Encoding.UTF8.GetBytes(json.ToString(Formatting.None));

            var stdout = Console.OpenStandardOutput();
            stdout.WriteByte((byte)((bytes.Length >> 0) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 8) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 16) & 0xFF));
            stdout.WriteByte((byte)((bytes.Length >> 24) & 0xFF));
            stdout.Write(bytes, 0, bytes.Length);
            stdout.Flush();
        }
    }
}

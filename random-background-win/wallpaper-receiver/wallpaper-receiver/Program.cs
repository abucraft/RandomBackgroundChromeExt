using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
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
            string pname="";
            if (json["data"] != null)
            {
                var tick = json["tick"].Value<int>();
                var bytes = Convert.FromBase64String(json["data"].ToString());
                string tempPath = "wallpaper" + tick % IMAGE_BUFFER + ".png";
                var imageIncrease = !File.Exists(tempPath);
                var file = new FileStream(tempPath, FileMode.OpenOrCreate);
                file.Write(bytes, 0, bytes.Length);
                file.Flush();
                path = tempPath;
                var wallpaper = (IDesktopWallpaper)(new DesktopWallpaperClass());
                IShellItemArray itemarr = WinAPI.getImageItemsFromPath(images);
                SetSlidesIfNeeded(wallpaper, itemarr, imageIncrease);
                wallpaper.AdvanceSlideshow(null, DesktopSlideshowDirection.Forward);
            }
            var result = new JObject();
            result["path"] = path;
            result["pname"] = pname;
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
        public static int ImageCount()
        {
            var total = 0;
            foreach(string img in images)
            {
                if (File.Exists(img))
                {
                    total++;
                }
            };
            return total;
        }
    }
}

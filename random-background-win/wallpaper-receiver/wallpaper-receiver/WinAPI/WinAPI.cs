using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Microsoft.WindowsAPICodePack.Shell.PropertySystem;
 using Microsoft.WindowsAPICodePack.Shell.Resources;
 using MS.WindowsAPICodePack.Internal;
 using System.Linq;
namespace wallpaper_receiver
{
    class WinAPI
    {
        const string IShellItem2Guid = "7E9FB0D3-919F-4307-AB2E-9B1860310C93";
        internal enum SIGDN : uint
        {
            NORMALDISPLAY = 0,
            PARENTRELATIVEPARSING = 0x80018001,
            PARENTRELATIVEFORADDRESSBAR = 0x8001c001,
            DESKTOPABSOLUTEPARSING = 0x80028000,
            PARENTRELATIVEEDITING = 0x80031001,
            DESKTOPABSOLUTEEDITING = 0x8004c000,
            FILESYSPATH = 0x80058000,
            URL = 0x80068000
        }

        internal enum HResult
        {
            Ok = 0x0000,
            False = 0x0001,
            InvalidArguments = unchecked((int)0x80070057),
            OutOfMemory = unchecked((int)0x8007000E),
            NoInterface = unchecked((int)0x80004002),
            Fail = unchecked((int)0x80004005),
            ElementNotFound = unchecked((int)0x80070490),
            TypeElementNotFound = unchecked((int)0x8002802B),
            NoObject = unchecked((int)0x800401E5),
            Win32ErrorCanceled = 1223,
            Canceled = unchecked((int)0x800704C7),
            ResourceInUse = unchecked((int)0x800700AA),
            AccessDenied = unchecked((int)0x80030005)
        }

        #region user32
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern int SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr result);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        internal static extern int SHCreateItemFromParsingName(
                [MarshalAs(UnmanagedType.LPWStr)] string path,
                // The following parameter is not used - binding context.
                IntPtr pbc,
                ref Guid riid,
                [MarshalAs(UnmanagedType.Interface)] out IShellItem shellItem);

        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern int SHCreateShellItemArray(
               PCIDLIST_ABSOLUTE pidlParent,
               ref IShellFolder psf,
               uint cidl,
               PCUITEMID_CHILD_ARRAY ppidl,
               [MarshalAs(UnmanagedType.Interface)]out IShellItemArray ppsiItemArray);

        public interface PCIDLIST_ABSOLUTE { };
        public interface PCUITEMID_CHILD_ARRAY { };
        #endregion
        public static IShellItemArray getImageItemsFromPath(string[] images)
        {
            List<IShellItem> shellItems = new List<IShellItem>(images.Length);

            Guid shellItemGuid = new Guid(ShellIIDGuid.IShellItem);
            Guid shellItemArrayGuid = new Guid(ShellIIDGuid.IShellItemArray);

            // Create IShellItem for all the scopes we were given
            foreach (string path in images)
            {
                IShellItem scopeShellItem;

                int hr = ShellNativeMethods.SHCreateItemFromParsingName(path, IntPtr.Zero, ref shellItemGuid, out scopeShellItem);

                if (CoreErrorHelper.Succeeded(hr)) { shellItems.Add(scopeShellItem); }
            }

            // Create a new IShellItemArray
            IShellItemArray scopeShellItemArray = new ShellItemArray(shellItems.ToArray());
            return scopeShellItemArray;
        }

    }
}

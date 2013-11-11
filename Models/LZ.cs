using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Web;
using System.Web.Mvc;

namespace Listonz.Models
{
    /// <summary>
    /// This class is a general class (Listonz) for static general methods
    /// </summary>
    public static class LZ
    {
        internal static string GenerateRandomPassword(int length)
        {
            string allowedChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@$?_-*&#+";
            char[] chars = new char[length];
            Random rd = new Random();
            for (int i = 0; i < length; i++)
            {
                chars[i] = allowedChars[rd.Next(0, allowedChars.Length)];
            }
            return new string(chars);
        }

        internal static void SendEMail(string emailid, string subject, string body)
        {
            SmtpClient client = new SmtpClient();
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.EnableSsl = true;
            client.Host = "smtp.mailgun.org";
            client.Port = 587;

            System.Net.NetworkCredential credentials = new System.Net.NetworkCredential("postmaster@app6194.mailgun.org", "5iy1udrv--r3");
            client.UseDefaultCredentials = false;
            client.Credentials = credentials;

            MailMessage msg = new MailMessage();
            msg.From = new MailAddress("mor.shemesh@gmail.com");
            msg.To.Add(new MailAddress(emailid));

            msg.Subject = subject;
            msg.IsBodyHtml = true;
            msg.Body = body;

            client.Send(msg);
        }

        private static Dictionary<string, object> _Cache = new Dictionary<string, object>();
        internal static T GetCache<T>(string keyName)
        {
            var value = _Cache.ContainsKey(keyName) ? _Cache[keyName] : null;
            var type = typeof(T);
            if (type.IsGenericType &&
                type.GetGenericTypeDefinition() == typeof(Nullable<>).GetGenericTypeDefinition())
            {
                type = Nullable.GetUnderlyingType(type);
            }

            return (T)(type.IsEnum ? Enum.ToObject(type, Convert.ToInt32(value)) :
                Convert.ChangeType(value, type));

        }
        internal static object GetCache(string keyName)
        {
            return _Cache.ContainsKey(keyName) ? _Cache[keyName] : null;
        }

        internal static void SetCache(string keyName, object obj)
        {
            _Cache[keyName] = obj;
        }
    }
}
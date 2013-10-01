using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Web.WebPages.OAuth;
using Listonz.Models;

namespace Listonz
{
    public static class AuthConfig
    {
        public static void RegisterAuth()
        {
            // To let users of this site log in using their accounts from other sites such as Microsoft, Facebook, and Twitter,
            // you must update this site. For more information visit http://go.microsoft.com/fwlink/?LinkID=252166

            //OAuthWebSecurity.RegisterMicrosoftClient(
            //    clientId: "",
            //    clientSecret: "");

            //OAuthWebSecurity.RegisterTwitterClient(
            //    consumerKey: "",
            //    consumerSecret: "");

            // https://developers.facebook.com/apps/432403596878782/summary?ref=nav
            OAuthWebSecurity.RegisterFacebookClient(
                appId: "432403596878782",
                appSecret: "1396d3fd52bdba83b7e890e1671a5552");

            // https://www.linkedin.com/secure/developer?showinfo=&app_id=3258791&acc_id=1725431&compnay_name=Listonz&app_name=Listonz
            OAuthWebSecurity.RegisterLinkedInClient(
                consumerKey: "l3b8hyv6e3qt",
                consumerSecret: "IyRV2zbCEvrIPKXO");
            //OAuthWebSecurity.RegisterGoogleClient();
        }
    }
}

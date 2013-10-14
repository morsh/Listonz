using System;
using System.Collections.Generic;
using System.Linq;
using System.Transactions;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using DotNetOpenAuth.AspNet;
using Microsoft.Web.WebPages.OAuth;
using WebMatrix.WebData;
using Listonz.Filters;
using Listonz.Models;

namespace Listonz.Controllers
{
    [Authorize]
    [InitializeSimpleMembership]
    public class AccountController : Controller
    {
        /// <summary>
        /// GET: /Account/Login
        /// Main page login controller
        /// </summary>
        /// <param name="returnUrl"></param>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;

            if (User.Identity.IsAuthenticated)
                return RedirectToLocal(returnUrl);

            return View();
        }

        [AllowAnonymous]
        public ActionResult LoginPartial(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;

            return PartialView();
        }

        //
        // POST: /Account/Login

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult LoginPartial(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid && WebSecurity.Login(model.UserName, model.Password, persistCookie: model.RememberMe))
            {
                if (string.IsNullOrEmpty(returnUrl))
                    returnUrl = "/";
                return JavaScript("window.location = '" + returnUrl + "'");
            }

            // If we got this far, something failed, redisplay form
            ModelState.AddModelError("", "The user name or password provided is incorrect.");
            return PartialView(model);
        }

        //
        // POST: /Account/LogOff

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LogOff()
        {
            WebSecurity.Logout();

            return RedirectToAction("Index", "Home");
        }

        //
        // GET: /Account/Register

        [AllowAnonymous]
        public ActionResult RegisterPartial()
        {
            return PartialView();
        }

        //
        // POST: /Account/Register

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult RegisterPartial(RegisterModel model)
        {
            if (ModelState.IsValid)
            {
                // Attempt to register the user
                try
                {
                    WebSecurity.CreateUserAndAccount(model.UserName, model.Password, new { EmailId = model.EmailId, Details = model.Details });
                    WebSecurity.Login(model.UserName, model.Password);
                    return RedirectToAction("Index", "Home");
                }
                catch (MembershipCreateUserException e)
                {
                    ModelState.AddModelError("", ErrorCodeToString(e.StatusCode));
                }
            }

            // If we got this far, something failed, redisplay form
            return PartialView(model);
        }

        //
        // POST: /Account/Disassociate

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Disassociate(string provider, string providerUserId)
        {
            string ownerAccount = OAuthWebSecurity.GetUserName(provider, providerUserId);
            ManageMessageId? message = null;

            // Only disassociate the account if the currently logged in user is the owner
            if (ownerAccount == User.Identity.Name)
            {
                // Use a transaction to prevent the user from deleting their last login credential
                using (var scope = new TransactionScope(TransactionScopeOption.Required, new TransactionOptions { IsolationLevel = IsolationLevel.Serializable }))
                {
                    bool hasLocalAccount = OAuthWebSecurity.HasLocalAccount(WebSecurity.GetUserId(User.Identity.Name));
                    if (hasLocalAccount || OAuthWebSecurity.GetAccountsFromUserName(User.Identity.Name).Count > 1)
                    {
                        OAuthWebSecurity.DeleteAccount(provider, providerUserId);
                        scope.Complete();
                        message = ManageMessageId.RemoveLoginSuccess;
                    }
                }
            }

            return RedirectToAction("Manage", new { Message = message });
        }

        //
        // GET: /Account/Manage

        public ActionResult Manage(ManageMessageId? message)
        {
            ViewBag.StatusMessage =
                message == ManageMessageId.ChangePasswordSuccess ? "Your password has been changed."
                : message == ManageMessageId.SetPasswordSuccess ? "Your password has been set."
                : message == ManageMessageId.RemoveLoginSuccess ? "The external login was removed."
                : "";
            ViewBag.HasLocalPassword = OAuthWebSecurity.HasLocalAccount(WebSecurity.GetUserId(User.Identity.Name));
            ViewBag.ReturnUrl = Url.Action("Manage");
            return View();
        }

        //
        // POST: /Account/Manage

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Manage(LocalPasswordModel model)
        {
            bool hasLocalAccount = OAuthWebSecurity.HasLocalAccount(WebSecurity.GetUserId(User.Identity.Name));
            ViewBag.HasLocalPassword = hasLocalAccount;
            ViewBag.ReturnUrl = Url.Action("Manage");
            if (hasLocalAccount)
            {
                if (ModelState.IsValid)
                {
                    // ChangePassword will throw an exception rather than return false in certain failure scenarios.
                    bool changePasswordSucceeded;
                    try
                    {
                        changePasswordSucceeded = WebSecurity.ChangePassword(User.Identity.Name, model.OldPassword, model.NewPassword);
                    }
                    catch (Exception)
                    {
                        changePasswordSucceeded = false;
                    }

                    if (changePasswordSucceeded)
                    {
                        return RedirectToAction("Manage", new { Message = ManageMessageId.ChangePasswordSuccess });
                    }
                    else
                    {
                        ModelState.AddModelError("", "The current password is incorrect or the new password is invalid.");
                    }
                }
            }
            else
            {
                // User does not have a local password so remove any validation errors caused by a missing
                // OldPassword field
                ModelState state = ModelState["OldPassword"];
                if (state != null)
                {
                    state.Errors.Clear();
                }

                if (ModelState.IsValid)
                {
                    try
                    {
                        WebSecurity.CreateAccount(User.Identity.Name, model.NewPassword);
                        return RedirectToAction("Manage", new { Message = ManageMessageId.SetPasswordSuccess });
                    }
                    catch (Exception)
                    {
                        ModelState.AddModelError("", String.Format("Unable to create local account. An account with the name \"{0}\" may already exist.", User.Identity.Name));
                    }
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

        #region External Login
        //
        // POST: /Account/ExternalLogin

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLogin(string provider, string returnUrl)
        {
            return new ExternalLoginResult(provider, Url.Action("ExternalLoginCallback", new { ReturnUrl = returnUrl }));
        }

        //
        // GET: /Account/ExternalLoginCallback

        [AllowAnonymous]
        public ActionResult ExternalLoginCallback(string returnUrl)
        {
            var result = OAuthWebSecurity.VerifyAuthentication(Url.Action("ExternalLoginCallback", new { ReturnUrl = returnUrl }));

            if (!result.IsSuccessful)
            {
                return View("LoginResult", new LoginResultViewModel(false, Url.Action("ExternalLoginFailure")));
            }

            if (OAuthWebSecurity.Login(result.Provider, result.ProviderUserId, createPersistentCookie: false))
            {
                return View("LoginResult", new LoginResultViewModel(true, returnUrl));
            }

            // Get email according 
            string email = null;
            if (result.Provider.ToLower() == "google")
                email = result.ExtraData["email"];
            else if (result.Provider.ToLower() == "facebook" || result.Provider.ToLower() == "microsoft")
                email = result.UserName;

            // Ensuring appropriate properties to user according to login information
            var userName = result.UserName;
            try
            {
                if (result.Provider.ToLower() == "facebook")
                    userName = result.ExtraData["name"];
            }
            catch (Exception) { }

            using (var db = new UsersContext())
            {
                if (!db.UserProfiles.Any(u => u.UserName == userName))
                {
                    if (!db.UserProfiles.Any(u => u.UserName == email))
                    {
                        db.UserProfiles.Add(new UserProfile { UserName = userName, EmailId = email });
                        db.SaveChanges();
                    }
                    else
                        throw new Exception("A user with this email already exists");
                }
            }

            OAuthWebSecurity.CreateOrUpdateAccount(result.Provider, result.ProviderUserId, userName);
            return View("LoginResult", new LoginResultViewModel(true, returnUrl));

            //AuthenticationResult result = OAuthWebSecurity.VerifyAuthentication(Url.Action("ExternalLoginCallback", new { ReturnUrl = returnUrl }));
            //if (!result.IsSuccessful)
            //{
            //    return RedirectToAction("ExternalLoginFailure");
            //}

            //if (OAuthWebSecurity.Login(result.Provider, result.ProviderUserId, createPersistentCookie: false))
            //{
            //    return RedirectToLocal(returnUrl);
            //}

            //if (User.Identity.IsAuthenticated)
            //{
            //    // If the current user is logged in add the new account
            //    OAuthWebSecurity.CreateOrUpdateAccount(result.Provider, result.ProviderUserId, User.Identity.Name);
            //    return RedirectToLocal(returnUrl);
            //}
            //else
            //{
            //    // User is new, ask for their desired membership name
            //    var loginData = OAuthWebSecurity.SerializeProviderUserId(result.Provider, result.ProviderUserId);
            //    var providerDisplayName = OAuthWebSecurity.GetOAuthClientData(result.Provider).DisplayName;

            //    ViewBag.ProviderDisplayName = providerDisplayName;
            //    ViewBag.ReturnUrl = returnUrl;

            //    // Ensuring appropriate properties to user according to login information
            //    var userName = result.UserName;
            //    if (providerDisplayName.ToLower() == "facebook" && 
            //        result.ExtraData != null && 
            //        result.ExtraData.ContainsKey("name") &&
            //        !string.IsNullOrEmpty(result.ExtraData["name"]))
            //        userName = result.ExtraData["name"];

            //    return View("ExternalLoginConfirmation", new RegisterExternalLoginModel { UserName = userName, ExternalLoginData = loginData });
            //}
        }

        //
        // POST: /Account/ExternalLoginConfirmation

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ExternalLoginConfirmation(RegisterExternalLoginModel model, string returnUrl)
        {
            string provider = null;
            string providerUserId = null;

            if (User.Identity.IsAuthenticated || !OAuthWebSecurity.TryDeserializeProviderUserId(model.ExternalLoginData, out provider, out providerUserId))
            {
                return RedirectToAction("Manage");
            }

            if (ModelState.IsValid)
            {
                // Insert a new user into the database
                using (UsersContext db = new UsersContext())
                {
                    UserProfile user = db.UserProfiles.FirstOrDefault(u => u.UserName.ToLower() == model.UserName.ToLower());
                    // Check if user already exists
                    if (user == null)
                    {
                        // Insert name into the profile table
                        db.UserProfiles.Add(new UserProfile { UserName = model.UserName });
                        db.SaveChanges();

                        OAuthWebSecurity.CreateOrUpdateAccount(provider, providerUserId, model.UserName);
                        OAuthWebSecurity.Login(provider, providerUserId, createPersistentCookie: false);

                        return RedirectToLocal(returnUrl);
                    }
                    else
                    {
                        ModelState.AddModelError("UserName", "User name already exists. Please enter a different user name.");
                    }
                }
            }

            ViewBag.ProviderDisplayName = OAuthWebSecurity.GetOAuthClientData(provider).DisplayName;
            ViewBag.ReturnUrl = returnUrl;
            return View(model);
        }

        //
        // GET: /Account/ExternalLoginFailure

        [AllowAnonymous]
        public ActionResult ExternalLoginFailure()
        {
            return View();
        }

        [AllowAnonymous]
        [ChildActionOnly]
        public ActionResult ExternalLoginsList(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return PartialView("_ExternalLoginsListPartial", OAuthWebSecurity.RegisteredClientData);
        }

        [ChildActionOnly]
        public ActionResult RemoveExternalLogins()
        {
            ICollection<OAuthAccount> accounts = OAuthWebSecurity.GetAccountsFromUserName(User.Identity.Name);
            List<ExternalLogin> externalLogins = new List<ExternalLogin>();
            foreach (OAuthAccount account in accounts)
            {
                AuthenticationClientData clientData = OAuthWebSecurity.GetOAuthClientData(account.Provider);

                externalLogins.Add(new ExternalLogin
                {
                    Provider = account.Provider,
                    ProviderDisplayName = clientData.DisplayName,
                    ProviderUserId = account.ProviderUserId,
                });
            }

            ViewBag.ShowRemoveButton = externalLogins.Count > 1 || OAuthWebSecurity.HasLocalAccount(WebSecurity.GetUserId(User.Identity.Name));
            return PartialView("_RemoveExternalLoginsPartial", externalLogins);
        }
        #endregion

        #region Password Reseting
        [AllowAnonymous]
        public ActionResult ForgotPasswordPartial()
        {
            return PartialView();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult ForgotPasswordPartial(string UserName, string Email)
        {
            try
            {
                //check user existance
                var user = (MembershipUser)null;
                if (!string.IsNullOrEmpty(UserName))
                    user = Membership.GetUser(UserName);

                if (!string.IsNullOrEmpty(Email) && user == null)
                {
                    using (var db = new UsersContext())
                    {
                        UserName = db.UserProfiles
                            .Where(u => u.EmailId == Email)
                            .Select(u => u.UserName)
                            .FirstOrDefault();

                        if (!string.IsNullOrEmpty(UserName))
                            user = Membership.GetUser(UserName);
                    }
                }

                if (user == null)
                {
                    TempData["Message"] = "User and Email does not Not exist.";
                }
                else
                {
                    if (!WebSecurity.IsConfirmed(UserName))
                        TempData["Message"] = "Please make sure your user is confirmed, and that your account has a password.";

                    //generate password token
                    var token = WebSecurity.GeneratePasswordResetToken(UserName);

                    //create url with above token
                    var resetLink = "<a href='" + Url.Action("ResetPassword", "Account", new { un = UserName, rt = token }, "http") + "'>Reset Password</a>";

                    //get user emailid
                    UsersContext db = new UsersContext();
                    var emailid = (from i in db.UserProfiles
                                   where i.UserName == UserName
                                   select i.EmailId).FirstOrDefault();
                    //send mail
                    string subject = "Password Reset Token";
                    string body = "<b>Please find the Password Reset Token</b><br/>" + resetLink; //edit it
                    try
                    {
                        LZ.SendEMail(emailid, subject, body);
                        TempData["Message"] = "Mail Sent.";
                    }
                    catch (Exception ex)
                    {
                        TempData["Message"] = "Error occured while sending email." + ex.Message;
                    }

                    //only for testing
                    //TempData["Message"] = resetLink;
                }
            }
            catch (Exception ex)
            {
                TempData["Message"] = ex.ToString();
            }
            return PartialView();
        }

        [AllowAnonymous]
        public ActionResult ResetPassword(string un, string rt)
        {
            UsersContext db = new UsersContext();
            //TODO: Check the un and rt matching and then perform following
            //get userid of received username
            var userid = (from i in db.UserProfiles
                          where i.UserName == un
                          select i.UserId).FirstOrDefault();
            //check userid and token matches
            bool any = (from j in db.webpages_Memberships
                        where (j.UserId == userid)
                        && (j.PasswordVerificationToken == rt)
                        //&& (j.PasswordVerificationTokenExpirationDate < DateTime.Now)
                        select j).Any();

            if (any == true)
            {
                //generate random password
                string newpassword = LZ.GenerateRandomPassword(6);
                //reset password
                bool response = WebSecurity.ResetPassword(rt, newpassword);
                if (response == true)
                {
                    //get user emailid to send password
                    var emailid = (from i in db.UserProfiles
                                   where i.UserName == un
                                   select i.EmailId).FirstOrDefault();
                    //send email
                    string subject = "New Password";
                    string body = "<b>Please find the New Password</b><br/>" + newpassword; //edit it
                    try
                    {
                        LZ.SendEMail(emailid, subject, body);
                        TempData["Message"] = "Mail Sent.";
                    }
                    catch (Exception ex)
                    {
                        TempData["Message"] = "Error occured while sending email." + ex.Message;
                    }

                    //display message
                    TempData["Message"] = "Success! Check email we sent. Your New Password Is " + newpassword;
                }
                else
                {
                    TempData["Message"] = "Hey, avoid random request on this page.";
                }
            }
            else
            {
                TempData["Message"] = "Username and token not maching.";
            }

            return View();
        }
        #endregion

        #region Helpers
        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }

        public enum ManageMessageId
        {
            ChangePasswordSuccess,
            SetPasswordSuccess,
            RemoveLoginSuccess,
        }

        internal class ExternalLoginResult : ActionResult
        {
            public ExternalLoginResult(string provider, string returnUrl)
            {
                Provider = provider;
                ReturnUrl = returnUrl;
            }

            public string Provider { get; private set; }
            public string ReturnUrl { get; private set; }

            public override void ExecuteResult(ControllerContext context)
            {
                OAuthWebSecurity.RequestAuthentication(Provider, ReturnUrl);
            }
        }

        private static string ErrorCodeToString(MembershipCreateStatus createStatus)
        {
            // See http://go.microsoft.com/fwlink/?LinkID=177550 for
            // a full list of status codes.
            switch (createStatus)
            {
                case MembershipCreateStatus.DuplicateUserName:
                    return "User name already exists. Please enter a different user name.";

                case MembershipCreateStatus.DuplicateEmail:
                    return "A user name for that e-mail address already exists. Please enter a different e-mail address.";

                case MembershipCreateStatus.InvalidPassword:
                    return "The password provided is invalid. Please enter a valid password value.";

                case MembershipCreateStatus.InvalidEmail:
                    return "The e-mail address provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidAnswer:
                    return "The password retrieval answer provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidQuestion:
                    return "The password retrieval question provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.InvalidUserName:
                    return "The user name provided is invalid. Please check the value and try again.";

                case MembershipCreateStatus.ProviderError:
                    return "The authentication provider returned an error. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                case MembershipCreateStatus.UserRejected:
                    return "The user creation request has been canceled. Please verify your entry and try again. If the problem persists, please contact your system administrator.";

                default:
                    return "An unknown error occurred. Please verify your entry and try again. If the problem persists, please contact your system administrator.";
            }
        }
        #endregion
    }
}

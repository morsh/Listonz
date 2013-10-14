using Listonz.Migrations;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Globalization;
using System.Web.Security;

namespace Listonz.Models
{
    #region Database & Tables
    public class UsersContext : DbContext
    {
        public UsersContext()
            : base("context")
        {
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            Database.SetInitializer(new MigrateDatabaseToLatestVersion<Listonz.Models.UsersContext, Configuration>());
        }

        public DbSet<UserProfile> UserProfiles { get; set; }

        #region New Tables
        public DbSet<webpages_Membership> webpages_Memberships { get; set; }
        #endregion
    }

    [Table("UserProfile")]
    public class UserProfile
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int UserId { get; set; }
        public string UserName { get; set; }

        #region New Properties
        public string EmailId { get; set; }
        public string Details { get; set; }
        #endregion
    }

    [Table("webpages_Membership")]
    public class webpages_Membership
    {
        [Key]
        public int UserId { get; set; }
        public DateTime CreateDate { get; set; }
        public string ConfirmationToken { get; set; }
        public bool IsConfirmed { get; set; }
        public DateTime LastPasswordFailureDate { get; set; }
        public int PasswordFailuresSinceLastSuccess { get; set; }
        public string Password { get; set; }
        public DateTime PasswordChangeDate { get; set; }
        public string PasswordSalt { get; set; }
        public string PasswordVerificationToken { get; set; }
        public DateTime PasswordVerificationTokenExpirationDate { get; set; }
    }
    #endregion

    public class RegisterExternalLoginModel
    {
        [Required]
        [Display(Name = "User name")]
        public string UserName { get; set; }

        public string ExternalLoginData { get; set; }
    }

    public class LocalPasswordModel
    {
        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Current password")]
        public string OldPassword { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        [Display(Name = "New password")]
        public string NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm new password")]
        [Compare("NewPassword", ErrorMessage = "The new password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }
    }

    public class LoginModel
    {
        [Required]
        [Display(Name = "User name")]
        public string UserName { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string Password { get; set; }

        [Display(Name = "Remember me?")]
        public bool RememberMe { get; set; }

    }

    public class RegisterModel
    {
        [Required]
        [Display(Name = "User name", Description = "Enter a user name with which you will be able to log in")]
        public string UserName { get; set; }

        [Required]
        //[StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [PasswordStrength(8, 100, ErrorMessage = "Your password should be al least 8 characters long with at least 1 digit and 1 upper case letter")]
        [DataType(DataType.Password)]
        [Display(Name = "Password", Description = "Enter a pretty password")]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm password")]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }

        //new properties
        [Required]
        [Display(Name = "Email ID")]
        public string EmailId { get; set; }

        [Required]
        [Display(Name = "About Yourself")]
        public string Details { get; set; }

        [IsTrueAttribute(ErrorMessage = "Please confirm Agreement")]
        [Display(Name = "I agree to the terms.")]
        public bool Agreement { get; set; }

    }

    public class ExternalLogin
    {
        public string Provider { get; set; }
        public string ProviderDisplayName { get; set; }
        public string ProviderUserId { get; set; }
    }

    public class LoginResultViewModel
    {
        public LoginResultViewModel(bool success, string returnUrl)
        {
            Success = success;
            ReturnUrl = returnUrl;
        }

        public bool Success { get; set; }
        public string ReturnUrl { get; set; }
    }
}

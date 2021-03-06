﻿using Listonz.Migrations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace Listonz.Models
{
    [Table("Contacts")]
    public class Contact
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string Street { get; set; }
        public string Notes { get; set; }
        
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string MobileNumber { get; set; }
        public string FaxNumber { get; set; }
        public string Birthday { get; set; }
        public string Single { get; set; }
        public string SocialSecurity { get; set; }
        public string DrivingLisence { get; set; }

        public double? Rating { get; set; }

        public int? CompanyId { get; set; }
        [ForeignKey("CompanyId")]
        public virtual Contact Company { get; set; }

        public int? CategoryId { get; set; }
        [ForeignKey("CategoryId")]
        public virtual Category Category { get; set; }

        public int? UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual UserProfile User { get; set; }

        public string ProfilePicture { get; set; }
        public string SocialData { get; set; }

        public DateTime? LastUpdate { get; set; }
    }

    [Table("Categories")]
    public class Category
    {
        [Key]
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Name { get; set; }

        public int? UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual UserProfile User { get; set; }

    }
}
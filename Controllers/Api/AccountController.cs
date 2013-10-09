using Listonz.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Listonz.Controllers.Api
{
    public class AccountController : ApiController
    {
        // GET api/account/get/name
        public bool Get(string name)
        {
            using (var db = new UsersContext())
            {
                return db.UserProfiles.Any(p => p.UserName == name);
            }
        }

        [HttpGet]
        public bool FindEmail(string email)
        {
            using (var db = new UsersContext())
            {
                return db.UserProfiles.Any(p => p.EmailId == email);
            }
        }
    }

}

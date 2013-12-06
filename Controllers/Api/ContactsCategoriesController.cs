using Listonz.Filters;
using Listonz.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Listonz.Controllers.Api
{
    [InitializeSimpleMembership]
    public class ContactsCategoriesController : ApiController
    {
        private UsersContext db = new UsersContext();

        private void EnsureData(Category category)
        {
            category.UserId = LZ.CurrentUserID;
            if (category.UserId == null || category.UserId.Value != LZ.CurrentUserID)
                throw new Exception("A user can only update it's own data");

            category.User = category.UserId != null ? db.UserProfiles.FirstOrDefault(c => c.UserId == category.UserId) : null;

            //category.LastUpdate = DateTime.Now;
        }

        // GET api/contactscategories
        [Queryable]
        public IEnumerable<Category> Get()
        {
            var currentUserID = LZ.CurrentUserID;
            return db.Categories.Where(c => c.UserId == null || c.UserId == currentUserID).AsEnumerable();
        }

        // GET api/contactscategories/5
        public Category Get(int id)
        {
            var category = db.Categories.Find(id);
            if (category == null || category.UserId != LZ.CurrentUserID)
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
            }

            return category;
        }

        // POST api/contactscategories
        public HttpResponseMessage Post(Category category)
        {
            // Checking model is valid and the category name is valid
            // TODO: check for current user only unique name
            if (ModelState.IsValid && !Get().Any(c => c.Name == category.Name))
            {
                EnsureData(category);
                db.Categories.Add(category);
                db.SaveChanges();

                HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Created, category);
                response.Headers.Location = new Uri(Url.Link("ApiById", new { id = category.Id }));
                return response;
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }
        }

        // PUT api/contactscategories/5
        public HttpResponseMessage Put(int id, Category category)
        {
            if (!ModelState.IsValid)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }

            if (id != category.Id || category.UserId != LZ.CurrentUserID)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            EnsureData(category);
            db.Entry(category).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, category);
        }

        // DELETE api/contactscategories/5
        public HttpResponseMessage Delete(int id)
        {
            var category = db.Categories.Find(id);
            if (category == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            if (category.UserId != LZ.CurrentUserID)
                throw new Exception("A user can only update it's own data");

            var childContacts = from c in db.Contacts
                                where c.CategoryId == category.Id
                                select c;

            foreach (var childContact in childContacts)
            {
                childContact.CategoryId = null;
                childContact.Category = null;
            }

            db.Categories.Remove(category);

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, category);
        }
    }
}

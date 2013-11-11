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
    public class ContactsCategoriesController : ApiController
    {
        private UsersContext db = new UsersContext();

        // GET api/contactscategories
        [Queryable]
        public IEnumerable<Category> Get()
        {
            return db.Categories.AsEnumerable();
        }

        // GET api/contactscategories/5
        public Category Get(int id)
        {
            var category = db.Categories.Find(id);
            if (category == null)
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
            if (ModelState.IsValid && !db.Categories.Any(c => c.Name == category.Name))
            {
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

            if (id != category.Id)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

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
            Category category = db.Categories.Find(id);
            if (category == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
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

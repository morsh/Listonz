using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using Listonz.Models;
using System.Web.Http.OData.Query;
using Listonz.Models.Helpers;
using System.Xml;
using System.Text;
using System.Reflection;
using System.Web.Security;
using Listonz.Filters;

namespace Listonz.Controllers.Api
{
    public class Country
    {
        public string i2 { get; set; }
        public string i3 { get; set; }
        public string n { get; set; }
    }
    public class State
    {
        public string name { get; set; }
        public string abb { get; set; }
    }

    [InitializeSimpleMembership]
    public class ContactsController : ApiController
    {
        private UsersContext db = new UsersContext();

        private void EnsureData(Contact contact, bool dontstop = false)
        {
            try
            {
                contact.UserId = LZ.CurrentUserID;
                if (contact.UserId == null || contact.UserId.Value != LZ.CurrentUserID)
                    throw new Exception("A user can only update it's own data");

                contact.User = contact.UserId != null ? db.UserProfiles.FirstOrDefault(c => c.UserId == contact.UserId) : null;

                contact.Category = contact.CategoryId != null ? db.Categories.FirstOrDefault(c => c.Id == contact.CategoryId) : null;


                if (dontstop) return;

                if ((contact.Category != null && contact.Category.Name == "Company") ||
                    contact.Company == null || contact.Company.CompanyId != null)
                {
                    contact.CompanyId = null;
                    contact.Company = null;
                }
                else
                {
                    contact.Company = contact.CompanyId != null ? db.Contacts.FirstOrDefault(c => c.Id == contact.CompanyId) : null;
                }
                contact.LastUpdate = DateTime.Now;
            }
            catch (Exception ex)
            {
                if (dontstop) throw;
            }
        }

        private IQueryable<Contact> All()
        {
            var userID = LZ.CurrentUserID;
            return db.Contacts
                .Where(c => c.UserId == userID)
                .Include(c => c.Category)
                .Include(c => c.Company);
        }

        // GET api/Contact
        [Queryable]
        public IEnumerable<Contact> GetContacts()
        {
            return All().AsEnumerable();
        }

        // GET api/Contact/5
        public Contact GetContact(int id)
        {
            var contact = All().Where(c => c.Id == id).SingleOrDefault();
            if (contact == null || contact.UserId != LZ.CurrentUserID)
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
            }
            return contact;
        }

        // PUT api/Contact/5
        public HttpResponseMessage PutContact(int id, Contact contact)
        {
            if (!ModelState.IsValid)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }

            if (id != contact.Id || contact.UserId != LZ.CurrentUserID)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            EnsureData(contact);
            db.Entry(contact).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, contact);
        }

        [HttpPost]
        public HttpResponseMessage UpdateRating(int id, double? newRating)
        {
            var contact = GetContact(id);
            if (id != contact.Id || contact.UserId != LZ.CurrentUserID)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            contact.Rating = newRating;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, contact);
        }

        // POST api/Contact
        public HttpResponseMessage PostContact(Contact contact)
        {
            if (ModelState.IsValid)
            {
                contact.UserId = LZ.CurrentUserID;
                EnsureData(contact);
                db.Contacts.Add(contact);
                db.SaveChanges();

                HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Created, contact);
                response.Headers.Location = new Uri(Url.Link("ApiById", new { id = contact.Id }));
                return response;
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }
        }

        // DELETE api/Contact/5
        public HttpResponseMessage DeleteContact(int id)
        {
            var contact = db.Contacts.Find(id);
            if (contact == null || contact.UserId != LZ.CurrentUserID)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            db.Contacts.Remove(contact);

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, contact);
        }

        #region Extra Methods
        [HttpGet]
        public IEnumerable<Country> GetCountries()
        {
            try
            {
                var cacheKey = "Countries";
                var countries = LZ.GetCache<List<Country>>(cacheKey);
                if (countries == null)
                {
                    var m_strFilePath = "http://www.ezzylearning.com/services/CountryInformationService.asmx/GetCountries";
                    string xmlStr;
                    using (var wc = new WebClient())
                    {
                        xmlStr = wc.DownloadString(m_strFilePath);
                    }

                    if (!string.IsNullOrEmpty(xmlStr))
                    {
                        var xmlDoc = new XmlDocument();
                        xmlDoc.LoadXml(xmlStr);

                        countries = new List<Country>();
                        foreach (XmlNode node in xmlDoc.GetElementsByTagName("Countries"))
                        {
                            countries.Add(new Country
                            {
                                i2 = node["ISO2"].InnerText,
                                i3 = node["ISO3"].InnerText,
                                n = node["Country"].InnerText
                            });
                        }
                        countries.OrderBy(c => c.n);
                    }

                    if (countries.Count > 0)
                        LZ.SetCache(cacheKey, countries);
                }

                return countries;
            }
            catch (Exception ex)
            {
                //Logger.Log(ex);
                throw;
            }
        }

        [HttpGet]
        public IEnumerable<string> GetCities(string country, string state = "")
        {
            try
            {
                if (string.IsNullOrEmpty(country))
                    return null;

                var cacheKey = "Countries:" + country;
                var cities = LZ.GetCache<List<string>>(cacheKey);
                if (cities == null)
                {
                    var countries = GetCountries();
                    if (!countries.Any(c => c.i2 == country))
                        country = countries.Where(c => c.n == country).Select(c => c.i2).FirstOrDefault() + "";

                    var m_strFilePath = "http://ws.geonames.org/search?q=&country=" + country;
                    string xmlStr;
                    using (var wc = new WebClient())
                    {
                        xmlStr = wc.DownloadString(m_strFilePath);
                    }

                    if (!string.IsNullOrEmpty(xmlStr))
                    {
                        var xmlDoc = new XmlDocument();
                        xmlDoc.LoadXml(xmlStr);

                        cities = new List<string>();
                        foreach (XmlNode node in xmlDoc.GetElementsByTagName("geoname"))
                        {
                            cities.Add(node["name"].InnerText);
                        }
                        cities.Sort();
                    }

                    if (cities.Count > 0)
                        LZ.SetCache(cacheKey, cities);
                }

                return cities;
            }
            catch (Exception ex)
            {
                //Logger.Log(ex);
                throw;
            }
        }

        private List<State> _States = new List<State>();
        [HttpGet]
        public IEnumerable<State> GetStates(string country = "")
        {
            if (_States.Count == 0)
            {
                _States.Add(new State { name = "Alabama", abb = "AL" });
                _States.Add(new State { name = "Alaska", abb = "AK" });
                _States.Add(new State { name = "Arizona", abb = "AZ" });
                _States.Add(new State { name = "Arkansas", abb = "AR" });
                _States.Add(new State { name = "California", abb = "CA" });
                _States.Add(new State { name = "Colorado", abb = "CO" });
                _States.Add(new State { name = "Connecticut", abb = "CT" });
                _States.Add(new State { name = "Delaware", abb = "DE" });
                _States.Add(new State { name = "Florida", abb = "FL" });
                _States.Add(new State { name = "Georgia", abb = "GA" });
                _States.Add(new State { name = "Hawaii", abb = "HI" });
                _States.Add(new State { name = "Idaho", abb = "ID" });
                _States.Add(new State { name = "Illinois", abb = "IL" });
                _States.Add(new State { name = "Indiana", abb = "IN" });
                _States.Add(new State { name = "Iowa", abb = "IA" });
                _States.Add(new State { name = "Kansas", abb = "KS" });
                _States.Add(new State { name = "Kentucky[C]", abb = "KY" });
                _States.Add(new State { name = "Louisiana", abb = "LA" });
                _States.Add(new State { name = "Maine", abb = "ME" });
                _States.Add(new State { name = "Maryland", abb = "MD" });
                _States.Add(new State { name = "Massachusetts[D]", abb = "MA" });
                _States.Add(new State { name = "Michigan", abb = "MI" });
                _States.Add(new State { name = "Minnesota", abb = "MN" });
                _States.Add(new State { name = "Mississippi", abb = "MS" });
                _States.Add(new State { name = "Missouri", abb = "MO" });
                _States.Add(new State { name = "Montana", abb = "MT" });
                _States.Add(new State { name = "Nebraska", abb = "NE" });
                _States.Add(new State { name = "Nevada", abb = "NV" });
                _States.Add(new State { name = "New Hampshire", abb = "NH" });
                _States.Add(new State { name = "New Jersey", abb = "NJ" });
                _States.Add(new State { name = "New Mexico", abb = "NM" });
                _States.Add(new State { name = "New York", abb = "NY" });
                _States.Add(new State { name = "North Carolina", abb = "NC" });
                _States.Add(new State { name = "North Dakota", abb = "ND" });
                _States.Add(new State { name = "Ohio", abb = "OH" });
                _States.Add(new State { name = "Oklahoma", abb = "OK" });
                _States.Add(new State { name = "Oregon", abb = "OR" });
                _States.Add(new State { name = "Pennsylvania[E]", abb = "PA" });
                _States.Add(new State { name = "Rhode Island[F]", abb = "RI" });
                _States.Add(new State { name = "South Carolina", abb = "SC" });
                _States.Add(new State { name = "South Dakota", abb = "SD" });
                _States.Add(new State { name = "Tennessee", abb = "TN" });
                _States.Add(new State { name = "Texas", abb = "TX" });
                _States.Add(new State { name = "Utah", abb = "UT" });
                _States.Add(new State { name = "Vermont", abb = "VT" });
                _States.Add(new State { name = "Virginia[G]", abb = "VA" });
                _States.Add(new State { name = "Washington", abb = "WA" });
                _States.Add(new State { name = "West Virginia", abb = "WV" });
                _States.Add(new State { name = "Wisconsin", abb = "WI" });
                _States.Add(new State { name = "Wyoming", abb = "WY" });
            }

            return _States;
        }
        #endregion

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}
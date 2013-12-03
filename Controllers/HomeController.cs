using Listonz.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Listonz.Controllers
{
    [InitializeSimpleMembership]
    public class HomeController : Controller
    {
        [Authorize]
        public ActionResult Index()
        {
            ViewBag.Message = "Your place to plan you next marvelous tour!";

            return View();
        }

        [Authorize]
        public ActionResult ProductionManager()
        {
            ViewBag.Message = "Production manager page.";

            return View();
        }

        [Authorize]
        public ActionResult Artist()
        {
            ViewBag.Message = "Artist page.";

            return View();
        }

        [Authorize]
        public ActionResult TourManager()
        {
            ViewBag.Message = "Tour Manager page.";

            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "About us...";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        public ActionResult Pricing()
        {
            ViewBag.Message = "1GZ$ per account.";

            return View();
        }
    }
}

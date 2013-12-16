using System.Web;
using System.Web.Optimization;

namespace Listonz
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
//#if !DEBUG
//            BundleTable.EnableOptimizations = true;
//#endif

            // Site base scripts - part of layouts
            bundles.Add(new ScriptBundle("~/bundles/base").Include(
                        "~/Scripts/jquery-{version}.js",
                        "~/Scripts/jquery-migrate-{version}.js",
                        "~/Scripts/jquery-ui-{version}.js",
                        "~/Scripts/jquery.qtip*",
                        "~/Scripts/sammy-{version}.js",
                        "~/Scripts/Pages/lz-{version}.js"));

            // Modernizer - Part of layout but in different location in the html
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            // Login screen
            bundles.Add(new ScriptBundle("~/bundles/login").Include(
                        "~/Scripts/jquery.validate*",
                        "~/Scripts/jquery.unobtrusive*",
                        "~/Scripts/Pages/lz.pages.validation-{version}.js",
                        "~/Scripts/Pages/lz.pages.login-{version}.js",
                        "~/Scripts/jquery.passstrength-{version}.js"
                        ));
            // pages min
            bundles.Add(new ScriptBundle("~/bundles/pages").Include(
                        "~/Scripts/knockout-{version}.js",
                        "~/Scripts/knockout.mapping-latest*",
                        "~/Scripts/jquery.validator*",
                        "~/Scripts/jquery.validator.knockout*",
                        "~/Scripts/moment*",
                        "~/Scripts/Pages/knockout.extenssions-1.0.0.js",
                        "~/Scripts/jquery.rateit*",
                        "~/Scripts/Pages/lz.pages-{version}.js"));


            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.

            bundles.Add(new StyleBundle("~/Content/site").Include(
                        "~/Content/themes/base/jquery.ui.core.css",
                        "~/Content/themes/base/jquery.ui.accordion.css",
                        "~/Content/themes/base/jquery.ui.autocomplete.css",
                        "~/Content/themes/base/jquery.ui.button.css",
                        "~/Content/themes/base/jquery.ui.dialog.css",
                        "~/Content/themes/base/jquery.ui.tabs.css",
                        "~/Content/themes/base/jquery.ui.datepicker.css",
                        "~/Content/themes/base/jquery.ui.progressbar.css",
                        "~/Content/themes/base/jquery.ui.theme.css",
                        "~/Content/qTip/jquery.qtip.css",
                        "~/Content/site.css"));

            bundles.Add(new StyleBundle("~/Content/pages").Include(
                        "~/Content/rateit.css"));

        }
    }
}
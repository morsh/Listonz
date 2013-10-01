using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

public static class Extensions
{
    // Extension method
    public static MvcHtmlString ActionImage(this HtmlHelper html, string action, object routeValues, string imagePath, string alt)
    {
        return html.ActionImage(action, null, routeValues, imagePath, alt);
    }
    public static MvcHtmlString ActionImage(this HtmlHelper html, string action, string controllerName, object routeValues, string imagePath, string alt)
    {
        var url = new UrlHelper(html.ViewContext.RequestContext);

        // build the <img> tag
        var imgBuilder = new TagBuilder("img");
        imgBuilder.MergeAttribute("src", url.Content(imagePath));
        imgBuilder.MergeAttribute("alt", alt);
        string imgHtml = imgBuilder.ToString(TagRenderMode.SelfClosing);

        // build the <a> tag
        var anchorBuilder = new TagBuilder("a");
        if (controllerName == null)
            anchorBuilder.MergeAttribute("href", url.Action(action, routeValues));
        else
            anchorBuilder.MergeAttribute("href", url.Action(action, controllerName, routeValues));
        anchorBuilder.InnerHtml = imgHtml; // include the <img> tag inside
        string anchorHtml = anchorBuilder.ToString(TagRenderMode.Normal);

        return MvcHtmlString.Create(anchorHtml);
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

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

    public static MvcHtmlString ActionHash(this HtmlHelper html, string text, string action, string hash, dynamic htmlAttributes)
    {
        return html.ActionHash(text, action, null, hash, null);
    }
    public static MvcHtmlString ActionHash(this HtmlHelper html, string text, string action, string controllerName, string hash, dynamic htmlAttributes)
    {
        var url = new UrlHelper(html.ViewContext.RequestContext);

        // build the <a> tag
        var anchorBuilder = new TagBuilder("a");

        if (controllerName == null)
            anchorBuilder.MergeAttribute("href", url.Action(action));
        else
            anchorBuilder.MergeAttribute("href", url.Action(action, controllerName) + "#/" + hash);

        anchorBuilder.MergeAttributes(new RouteValueDictionary(htmlAttributes));
        anchorBuilder.SetInnerText(text);
        
        var anchorHtml = anchorBuilder.ToString(TagRenderMode.Normal);

        return MvcHtmlString.Create(anchorHtml);
    }

    public static MvcHtmlString HintFor<TModel, TValue>(this HtmlHelper<TModel> html, Expression<Func<TModel, TValue>> expression)
    {
        var description = ModelMetadata.FromLambdaExpression(expression, html.ViewData).Description;

        var imgBuilder = new TagBuilder("div");
        imgBuilder.MergeAttribute("class", "info");
        imgBuilder.MergeAttribute("title", description);
        string imgHtml = imgBuilder.ToString(TagRenderMode.StartTag) + imgBuilder.ToString(TagRenderMode.EndTag);

        return MvcHtmlString.Create(imgHtml);
    }
}
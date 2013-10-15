using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

public static class Extensions
{
    #region HtmlHelper Extenssions
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

    public static MvcHtmlString ActionHashUrl(this HtmlHelper html, string action, string hash)
    {
        return html.ActionHashUrl(action, null, hash);
    }
    public static MvcHtmlString ActionHashUrl(this HtmlHelper html, string action, string controllerName, string hash)
    {
        var url = new UrlHelper(html.ViewContext.RequestContext);
        if (controllerName == null)
            return new MvcHtmlString(url.Action(action) + "#/" + hash);
        else
            return new MvcHtmlString(url.Action(action, controllerName) + "#/" + hash);
    }
    public static MvcHtmlString ActionHash(this HtmlHelper html, string text, string action, string hash, dynamic htmlAttributes)
    {
        return html.ActionHash(text, action, null, hash, null);
    }
    public static MvcHtmlString ActionHash(this HtmlHelper html, string text, string action, string controllerName, string hash, dynamic htmlAttributes)
    {

        // build the <a> tag
        var anchorBuilder = new TagBuilder("a");

        anchorBuilder.MergeAttribute("href", html.ActionHashUrl(action, controllerName, hash).ToHtmlString());

        if (htmlAttributes != null)
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

    public static MvcHtmlString ActionMenuItem(this HtmlHelper html, String text, String action, String controllerName)
    {
        var url = new UrlHelper(html.ViewContext.RequestContext);
        var liBuilder = new TagBuilder("li");

        if (html.ViewContext.RequestContext.IsCurrentRoute(null, controllerName, action))
            liBuilder.AddCssClass("selected");

        var anchorBuilder = new TagBuilder("a");
        if (controllerName == null)
            anchorBuilder.MergeAttribute("href", url.Action(action));
        else
            anchorBuilder.MergeAttribute("href", url.Action(action, controllerName));

        anchorBuilder.SetInnerText(text);
        liBuilder.InnerHtml = anchorBuilder.ToString();

        return MvcHtmlString.Create(liBuilder.ToString());
    }
    #endregion

    #region RequestContext Extenssion
    public static bool IsCurrentRoute(this RequestContext context, String areaName, String controllerName, params String[] actionNames)
    {
        var routeData = context.RouteData;
        var routeArea = routeData.DataTokens["area"] as String;
        var current = false;
 
        if ( ((String.IsNullOrEmpty(routeArea) && String.IsNullOrEmpty(areaName)) ||
              (routeArea == areaName)) && 

             ((String.IsNullOrEmpty(controllerName)) ||
              (routeData.GetRequiredString("controller") == controllerName)) && 

             ((actionNames == null) ||
               actionNames.Contains(routeData.GetRequiredString("action"))) )
        {
            current = true;
        }
 
        return current;
    }
    #endregion

    #region UrlHelper Extenssion
    public static bool IsCurrent(this UrlHelper urlHelper, String areaName, String controllerName, params String[] actionNames)
    {
        return urlHelper.RequestContext.IsCurrentRoute(areaName, controllerName, actionNames);
    }

    public static string Selected(this UrlHelper urlHelper, String areaName, String controllerName, params String[] actionNames)
    {
        return urlHelper.IsCurrent(areaName, controllerName, actionNames) ? "selected" : String.Empty;
    }
    #endregion
}
function loginCallback(success, returnUrl) {
    if (!returnUrl) {
        returnUrl = "/";
    }
    window.location.href = returnUrl;
    //else {
    //    $.ajax({
    //        url: '@Url.Action("LoginPartial", "Account")',
    //        success: function (result) {
    //            $('#login').html(result);
    //        }
    //    });
}
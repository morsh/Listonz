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

$(function () {
    var $password = $('.pass-strength input[type=password]');
    $password.get(0).passStrength = $password.password_strength({
        minLength: 8,
        specialLength: 0,
        messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
    });
});